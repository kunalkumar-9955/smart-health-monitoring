/**
 * routes/predict.js
 * POST /api/predict-risk
 *
 * Receives raw form values from the frontend, maps them to the numeric
 * enums the Python model expects, calls the Flask AI service, and
 * returns the prediction. Falls back to rule-based logic if AI is down.
 */

const express = require('express');
const router  = express.Router();
const axios   = require('axios');

const AI_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';

// ── Enum maps ────────────────────────────────────────────────────────────
const WATER_QUALITY_MAP = { good: 0, moderate: 1, bad: 2 };
const SEASON_MAP        = { summer: 0, monsoon: 1, winter: 2 };
const RISK_LABELS       = ['LOW', 'MEDIUM', 'HIGH'];

/**
 * Determine current season from month (northern-hemisphere monsoon calendar).
 * Can be overridden by sending { season: "monsoon" } explicitly.
 */
function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 6 && month <= 9) return 1;  // monsoon  (Jun–Sep)
  if (month >= 11 || month <= 2) return 2; // winter   (Nov–Feb)
  return 0;                                 // summer   (Mar–May, Oct)
}

/**
 * Rule-based fallback — mirrors the training formula so results are
 * consistent even when the AI service is unavailable.
 */
function ruleBased(cases, waterQualityNum, seasonNum) {
  const score = cases * 0.4 + waterQualityNum * 20 + (seasonNum === 1 ? 15 : 0);
  let riskNum = 0;
  if (score >= 60) riskNum = 2;
  else if (score >= 30) riskNum = 1;

  return {
    risk:        RISK_LABELS[riskNum],
    risk_numeric: riskNum,
    confidence:  null,
    fallback:    true,
  };
}

// ── POST /api/predict-risk ────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      cases        = 1,
      water_quality,       // accepts both string ("bad") and number (2)
      waterQuality,        // alt key from the form
      season,              // accepts string or number; auto-detected if omitted
      isMonsoon,           // legacy boolean support
    } = req.body;

    // ── Resolve water quality (number 0-2) ──────────────────────────────
    const rawWQ =
      water_quality  !== undefined ? water_quality :
      waterQuality   !== undefined ? waterQuality  : 'good';

    let waterQualityNum;
    if (typeof rawWQ === 'number') {
      waterQualityNum = Math.min(2, Math.max(0, rawWQ));
    } else if (typeof rawWQ === 'string') {
      // support "contaminated" → bad
      const key = rawWQ === 'contaminated' ? 'bad' :
                  rawWQ === 'safe'         ? 'good' : rawWQ;
      waterQualityNum = WATER_QUALITY_MAP[key] ?? 0;
    } else {
      waterQualityNum = 0;
    }

    // ── Resolve season (number 0-2) ──────────────────────────────────────
    let seasonNum;
    if (season !== undefined && season !== null) {
      if (typeof season === 'number') {
        seasonNum = Math.min(2, Math.max(0, season));
      } else {
        seasonNum = SEASON_MAP[season] ?? getCurrentSeason();
      }
    } else if (isMonsoon) {
      seasonNum = 1; // legacy boolean
    } else {
      seasonNum = getCurrentSeason();
    }

    const casesNum = Math.max(0, parseInt(cases, 10) || 0);

    // ── Call Flask AI service ────────────────────────────────────────────
    const aiResponse = await axios.post(
      `${AI_URL}/predict`,
      { cases: casesNum, water_quality: waterQualityNum, season: seasonNum },
      { timeout: 3000 }
    );

    const { risk, risk_numeric, confidence } = aiResponse.data;

    return res.json({ risk, risk_numeric, confidence, fallback: false });

  } catch (err) {
    // ── Fallback ─────────────────────────────────────────────────────────
    console.warn('[predict-risk] AI service unavailable, using rule-based fallback:', err.message);

    const { cases = 1, water_quality, waterQuality, season, isMonsoon } = req.body;

    const rawWQ  = water_quality ?? waterQuality ?? 'good';
    const wqNum  = typeof rawWQ === 'number' ? rawWQ :
                   WATER_QUALITY_MAP[rawWQ === 'contaminated' ? 'bad' :
                                     rawWQ === 'safe' ? 'good' : rawWQ] ?? 0;
    const seaNum = typeof season === 'number' ? season :
                   SEASON_MAP[season] ?? (isMonsoon ? 1 : getCurrentSeason());

    return res.json(ruleBased(parseInt(cases, 10) || 1, wqNum, seaNum));
  }
});

module.exports = router;
