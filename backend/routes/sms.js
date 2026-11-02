const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { parseSMSMessage, calculateRiskScore } = require('../services/aiEngine');
const Report = require('../models/Report');
const Alert = require('../models/Alert');
const Village = require('../models/Village');

// @POST /api/sms/webhook - Real Twilio SMS Webhook
router.post('/webhook', async (req, res) => {
  try {
    const message = req.body.Body;
    const from = req.body.From;
    if (!message) {
      return res.status(400).send('No message body');
    }

    const parsed = parseSMSMessage(message);
    const risk = await calculateRiskScore({
      casesCount: parsed.casesCount,
      village: parsed.village,
      waterQuality: { status: parsed.waterStatus, bacterialPresence: parsed.waterStatus === 'contaminated' },
    });

    const reportData = {
      village: parsed.village,
      symptoms: parsed.symptoms,
      casesCount: parsed.casesCount,
      waterQuality: { status: parsed.waterStatus },
      riskScore: risk.score,
      riskLevel: risk.level,
      source: 'sms',
      rawMessage: message,
      timestamp: new Date(),
    };

    const report = await Report.create(reportData);

    const io = req.app.get('io');
    if (io) {
      io.emit('new_report', report);
    }

    if (risk.level === 'HIGH') {
      const alertData = {
        village: parsed.village, 
        title: `HIGH RISK Alert: ${parsed.village} (via SMS)`,
        message: `Risk score ${risk.score}. Immediate action required.`,
        riskLevel: risk.level, 
        riskScore: risk.score, 
        reportId: report._id, 
        isActive: true,
      };
      const alert = await Alert.create(alertData);
      
      await Village.findOneAndUpdate(
        { name: parsed.village }, 
        { riskLevel: risk.level, riskScore: risk.score, waterStatus: parsed.waterStatus }, 
        { upsert: true }
      );

      if (io) io.emit('new_alert', alert);
      
      const notifyService = require('../services/notificationService');
      await notifyService.sendAlert(alertData);
    }

    // Twilio Response (TwiML)
    const twiml = `
      <Response>
        <Message>Report received for ${parsed.village}. Risk Level: ${risk.level}. Score: ${risk.score}</Message>
      </Response>
    `;
    res.type('text/xml').send(twiml);
  } catch (error) {
    console.error('SMS Webhook Error:', error);
    res.status(500).send('<Response><Message>System error processing report</Message></Response>');
  }
});

// @POST /api/sms/parse - App frontend submission
router.post('/parse', protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'SMS message required' });

    const parsed = parseSMSMessage(message);
    const risk = await calculateRiskScore({
      casesCount: parsed.casesCount,
      village: parsed.village,
      waterQuality: { status: parsed.waterStatus, bacterialPresence: parsed.waterStatus === 'contaminated' },
    });

    const reportData = {
      village: parsed.village,
      symptoms: parsed.symptoms,
      casesCount: parsed.casesCount,
      waterQuality: { status: parsed.waterStatus },
      riskScore: risk.score,
      riskLevel: risk.level,
      source: 'sms',
      rawMessage: message,
      timestamp: new Date(),
      reportedBy: req.user._id || req.user.id,
      reporterName: req.user.name,
    };

    const saved = await Report.create(reportData);

    const io = req.app.get('io');
    if (io) io.emit('new_report', saved);

    if (risk.level === 'HIGH') {
      const alertData = {
        village: parsed.village, 
        title: `HIGH RISK Alert: ${parsed.village} (via App SMS simulation)`,
        message: `Risk score ${risk.score}.`,
        riskLevel: risk.level, 
        riskScore: risk.score, 
        reportId: saved._id, 
        isActive: true,
      };
      const alert = await Alert.create(alertData);
      
      await Village.findOneAndUpdate(
        { name: parsed.village }, 
        { riskLevel: risk.level, riskScore: risk.score, waterStatus: parsed.waterStatus }, 
        { upsert: true }
      );

      if (io) io.emit('new_alert', alert);
      
      const notifyService = require('../services/notificationService');
      await notifyService.sendAlert(alertData);
    }

    res.json({ parsed, risk, report: saved, message: 'SMS parsed and report created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
