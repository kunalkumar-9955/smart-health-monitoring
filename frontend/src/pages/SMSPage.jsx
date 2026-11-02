import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { smsAPI } from '../services/api';
import { MessageSquare, Send, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store';

const EXAMPLES = [
  'DIARRHEA 5 CASES VILLAGE_RAMPUR WATER_BAD',
  'FEVER VOMITING 3 CASES VILLAGE_GANESHPUR WATER_GOOD',
  'CHOLERA 12 CASES VILLAGE_TRIVENI WATER_BAD',
  'TYPHOID 2 CASES VILLAGE_KALYANPUR',
];

export default function SMSPage() {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleParse = async () => {
    if (!message.trim()) return toast.error('Enter a message to parse');
    setLoading(true);
    try {
      const { data } = await smsAPI.parse(message);
      setResult(data);
      toast.success('✅ SMS parsed and report created!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Parse failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="SMS Reporting System" subtitle="Parse and submit health reports via SMS format">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Info Banner */}
        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
          <h3 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>📡 SMS Report Format</h3>
          <p className="text-sm text-slate-400 mb-3">Send a text message in the format below. The system will auto-parse disease, cases, location, and water status.</p>
          <div className={`p-3 rounded-xl font-mono text-sm ${isDark ? 'bg-slate-900 text-cyan-300' : 'bg-slate-100 text-cyan-700'}`}>
            [DISEASE] [N] CASES VILLAGE_[NAME] [WATER_BAD/WATER_GOOD]
          </div>
        </div>

        {/* Input */}
        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Enter SMS Message</h3>
          </div>
          <textarea
            rows={3}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="e.g., DIARRHEA 5 CASES VILLAGE_RAMPUR WATER_BAD"
            className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none font-mono
              ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
          />
          
          {/* Quick examples */}
          <div className="flex flex-wrap gap-2 mt-3">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setMessage(ex)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all
                  ${isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:border-cyan-500 hover:text-cyan-400' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-cyan-500'}`}
              >
                {ex.substring(0, 30)}...
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleParse}
            disabled={loading}
            className="mt-4 w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            Parse & Submit Report
          </motion.button>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Parsed Data */}
              <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
                <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Parsed Data
                </h3>
                <div className="space-y-2 text-sm">
                  {[
                    ['Village', result.parsed?.village],
                    ['Diseases', result.parsed?.diseases?.join(', ') || 'N/A'],
                    ['Cases', result.parsed?.casesCount],
                    ['Water Status', result.parsed?.waterStatus],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-slate-500">{label}:</span>
                      <span className={`font-semibold capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700/30">
                  <p className="text-xs text-slate-500 mb-1">Active Symptoms:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(result.parsed?.symptoms || {}).filter(([, v]) => v).map(([k]) => (
                      <span key={k} className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full text-xs capitalize">{k}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Risk */}
              <div className={`rounded-2xl border p-5 ${
                result.risk?.level === 'HIGH' ? 'bg-red-500/10 border-red-500/30' :
                result.risk?.level === 'MODERATE' ? 'bg-yellow-500/10 border-yellow-500/30' :
                'bg-green-500/10 border-green-500/30'
              }`}>
                <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Zap className="w-4 h-4 text-yellow-400" />
                  AI Risk Analysis
                </h3>
                <div className="text-4xl font-bold mb-2" style={{
                  color: result.risk?.level === 'HIGH' ? '#ef4444' : result.risk?.level === 'MODERATE' ? '#f59e0b' : '#22c55e'
                }}>
                  {result.risk?.level}
                </div>
                <div className={`text-sm mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Risk Score: <strong>{result.risk?.score}</strong>
                </div>
                <div className="space-y-1">
                  {result.risk?.recommendations?.slice(0, 3).map((rec, i) => (
                    <p key={i} className="text-xs text-slate-400">{rec}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
