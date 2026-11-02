import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Shield, Brain, CheckCircle2 } from 'lucide-react';

/**
 * RiskIndicator
 * -------------
 * Props:
 *   riskResult  — object returned by /api/predict-risk or /api/reports (POST)
 *                 Shape: { risk, risk_numeric, confidence, fallback?,
 *                          recommendations?, score? }
 *   isDark      — boolean (theme)
 *
 * The component accepts both "risk" (from Flask API) and "level" (from
 * the Node AI engine) so it works in both the ReportsPage and DashboardPage.
 */

const STYLES = {
  HIGH: {
    wrapper:   'bg-red-500/10 border-red-500/30',
    badge:     'bg-red-500/20 text-red-400 border-red-500/30',
    bar:       'bg-red-500',
    glow:      'shadow-red-500/20',
    icon:      <ShieldAlert className="w-6 h-6 text-red-500" />,
    dot:       'bg-red-500',
    textColor: 'text-red-400',
  },
  MEDIUM: {
    wrapper:   'bg-yellow-500/10 border-yellow-500/30',
    badge:     'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    bar:       'bg-yellow-500',
    glow:      'shadow-yellow-500/20',
    icon:      <Shield className="w-6 h-6 text-yellow-500" />,
    dot:       'bg-yellow-500',
    textColor: 'text-yellow-400',
  },
  // MODERATE aliases MEDIUM (Node aiEngine uses "MODERATE")
  MODERATE: {
    wrapper:   'bg-yellow-500/10 border-yellow-500/30',
    badge:     'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    bar:       'bg-yellow-500',
    glow:      'shadow-yellow-500/20',
    icon:      <Shield className="w-6 h-6 text-yellow-500" />,
    dot:       'bg-yellow-500',
    textColor: 'text-yellow-400',
  },
  LOW: {
    wrapper:   'bg-green-500/10 border-green-500/30',
    badge:     'bg-green-500/20 text-green-400 border-green-500/30',
    bar:       'bg-green-500',
    glow:      'shadow-green-500/20',
    icon:      <ShieldCheck className="w-6 h-6 text-green-500" />,
    dot:       'bg-green-500',
    textColor: 'text-green-400',
  },
};

export default function RiskIndicator({ riskResult, isDark }) {
  if (!riskResult) return null;

  // Normalise: the API may return { risk } or { level } depending on source
  const rawLevel = (riskResult.risk ?? riskResult.level ?? 'LOW').toUpperCase();
  const style    = STYLES[rawLevel] ?? STYLES.LOW;

  const confidence    = riskResult.confidence;          // null if fallback
  const isFallback    = riskResult.fallback === true;
  const recommendations = riskResult.recommendations ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`rounded-2xl border p-5 shadow-lg ${style.wrapper} ${style.glow}`}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <Brain className="w-4 h-4 text-violet-400" />
          AI Outbreak Prediction
        </h3>

        <div className="flex items-center gap-2">
          {isFallback && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/20">
              rule-based
            </span>
          )}
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${style.badge}`}>
            {rawLevel} RISK
          </span>
        </div>
      </div>

      {/* ── Risk Level Banner ── */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-xl ${style.wrapper}`}>
          {style.icon}
        </div>
        <div>
          <div className={`text-2xl font-black tracking-tight ${style.textColor}`}>
            {rawLevel}
          </div>
          <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Outbreak Risk Level
          </div>
        </div>
      </div>

      {/* ── Confidence Bar ── */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            Model Confidence
          </span>
          <span className={`font-bold ${style.textColor}`}>
            {confidence != null ? `${confidence}%` : 'N/A'}
          </span>
        </div>
        <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          {confidence != null ? (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className={`h-full rounded-full ${style.bar}`}
            />
          ) : (
            <div className="h-full w-full bg-slate-500/30 rounded-full" />
          )}
        </div>
      </div>

      {/* ── Recommendations ── */}
      {recommendations.length > 0 && (
        <div className="space-y-1.5">
          <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Recommended Actions
          </p>
          {recommendations.slice(0, 4).map((rec, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${style.textColor}`} />
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {rec}
              </p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
