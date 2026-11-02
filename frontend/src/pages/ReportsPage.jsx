import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { reportsAPI, predictAPI } from '../services/api';
import { useAppStore, useAuthStore } from '../store';
import { Mic, MicOff, MapPin, Thermometer, Droplets, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import RiskIndicator from '../components/RiskIndicator';

const VILLAGES = ['Rampur', 'Ganeshpur', 'Kalyanpur', 'Shivpur', 'Nandgaon', 'Krishnapur', 'Triveni', 'Devpur'];

// water status → numeric enum for Flask model
const WQ_MAP = { safe: 0, moderate: 1, contaminated: 2, good: 0, bad: 2 };

export default function ReportsPage() {
  const { theme, isOnline, addToOfflineQueue } = useAppStore();
  const { user } = useAuthStore();
  const isDark = theme === 'dark';

  const [form, setForm] = useState({
    village: user?.village || '',
    casesCount: 1,
    severity: 'mild',
    symptoms: { fever: false, diarrhea: false, vomiting: false, dehydration: false, other: '' },
    waterQuality: { ph: '', turbidity: '', bacterialPresence: false, status: 'safe' },
    location: { lat: '', lng: '', address: '' },
    isMonsoon: false,
    source: 'form',
  });

  const [riskResult, setRiskResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const recognitionRef = useRef(null);

  // Voice input
  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'en-IN';
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setVoiceText(text);
      parseVoiceInput(text);
      toast.success('🎤 Voice captured!');
    };
    recognitionRef.current.onerror = () => {
      setIsListening(false);
      toast.error('Voice recognition error');
    };
    recognitionRef.current.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const parseVoiceInput = (text) => {
    const lower = text.toLowerCase();
    const newSymptoms = { ...form.symptoms };
    if (lower.includes('fever')) newSymptoms.fever = true;
    if (lower.includes('diarrhea') || lower.includes('loose motion')) newSymptoms.diarrhea = true;
    if (lower.includes('vomit')) newSymptoms.vomiting = true;
    if (lower.includes('dehydrat')) newSymptoms.dehydration = true;

    const caseMatch = text.match(/(\d+)\s*cases?/i);
    if (caseMatch) setForm(f => ({ ...f, casesCount: parseInt(caseMatch[1]), symptoms: newSymptoms }));
    else setForm(f => ({ ...f, symptoms: newSymptoms }));
  };

  // GPS location with Real Reverse Geocoding
  const getLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setSubmitting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        let address = 'GPS location detected';
        
        try {
          // Real reverse geocoding using OpenStreetMap Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.display_name) {
            address = data.display_name;
            toast.success(`📍 Location: ${data.address.village || data.address.town || data.address.city || 'Detected'}`);
          }
        } catch (err) {
          toast.success('📍 Coordinates captured, but address lookup failed.');
        }

        setForm(f => ({
          ...f,
          location: { lat, lng, address }
        }));
        setSubmitting(false);
      },
      () => {
        toast.error('Could not get location. Please enter manually.');
        setSubmitting(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.village) return toast.error('Please select a village');

    setSubmitting(true);
    try {
      if (!isOnline) {
        addToOfflineQueue(form);
        toast.success('📦 Saved offline. Will sync when online.');
        setSubmitting(false);
        return;
      }

      // 1. Save report to MongoDB (also triggers AI engine + alert if HIGH)
      const { data } = await reportsAPI.create(form);
      const reportAI = data.riskAnalysis || {};

      // 2. Call standalone ML model for confidence score
      let mlResult = null;
      try {
        const wqNum = WQ_MAP[form.waterQuality?.status] ?? 0;
        const seasonNum = form.isMonsoon ? 1 : (() => {
          const m = new Date().getMonth() + 1;
          return m >= 6 && m <= 9 ? 1 : (m >= 11 || m <= 2) ? 2 : 0;
        })();

        const { data: pd } = await predictAPI.getRisk({
          cases:         form.casesCount,
          water_quality: wqNum,
          season:        seasonNum,
        });
        mlResult = pd;
      } catch (_) {
        // silently fall back — riskAnalysis from Node is still shown
      }

      // 3. Merge results: prefer Flask confidence, use Node level as source-of-truth
      setRiskResult({
        ...reportAI,
        risk:        mlResult?.risk         ?? reportAI.level,
        level:       reportAI.level         ?? mlResult?.risk,
        confidence:  mlResult?.confidence   ?? null,
        fallback:    mlResult?.fallback      ?? false,
      });

      toast.success('✅ Report submitted & AI prediction complete!');
      setForm(prev => ({
        ...prev,
        casesCount: 1,
        symptoms: { fever: false, diarrhea: false, vomiting: false, dehydration: false, other: '' },
        waterQuality: { ph: '', turbidity: '', bacterialPresence: false, status: 'safe' },
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSymptom = (symptom) => {
    setForm(f => ({ ...f, symptoms: { ...f.symptoms, [symptom]: !f.symptoms[symptom] } }));
  };

  return (
    <Layout title="Submit Health Report" subtitle="Report disease cases and water quality data">
      <div className="max-w-4xl mx-auto">
        {/* Voice Banner */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-sm"
            >
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-300">🎤 Listening... Speak now (e.g., "3 cases of diarrhea and fever")</span>
            </motion.div>
          )}
          {voiceText && !isListening && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-sm text-cyan-300"
            >
              🎤 Captured: "{voiceText}"
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              {/* Village + Voice */}
              <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
                <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  Location & Basic Info
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Village *</label>
                    <select
                      value={form.village}
                      onChange={e => setForm({ ...form, village: e.target.value })}
                      required
                      className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition
                        ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    >
                      <option value="">Select village...</option>
                      {VILLAGES.map(v => <option key={v} value={v}>{v}</option>)}
                      <option value="other">Other (specify below)</option>
                    </select>
                  </div>
                  {form.village === 'other' && (
                    <input
                      type="text"
                      placeholder="Enter village name"
                      onChange={e => setForm({ ...form, village: e.target.value })}
                      className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-cyan-500/50
                        ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Cases Count *</label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={form.casesCount}
                        onChange={e => setForm({ ...form, casesCount: parseInt(e.target.value) || 1 })}
                        required
                        className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-cyan-500/50
                          ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Severity</label>
                      <select
                        value={form.severity}
                        onChange={e => setForm({ ...form, severity: e.target.value })}
                        className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-cyan-500/50
                          ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                      >
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>
                    </div>
                  </div>

                  {/* GPS */}
                  <button type="button" onClick={getLocation}
                    className="w-full flex items-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-cyan-500/30 text-cyan-400 text-sm hover:bg-cyan-500/10 transition">
                    <MapPin className="w-4 h-4" />
                    {form.location.lat ? `📍 ${form.location.lat}, ${form.location.lng}` : 'Auto-detect GPS Location'}
                  </button>
                </div>
              </div>

              {/* Symptoms */}
              <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <Thermometer className="w-4 h-4 text-red-400" />
                    Patient Symptoms
                  </h3>
                  <button
                    type="button"
                    onClick={isListening ? stopVoice : startVoice}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${isListening
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20'}`}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    {isListening ? 'Stop' : 'Voice Input'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { key: 'fever', label: '🌡️ Fever', color: 'red' },
                    { key: 'diarrhea', label: '💧 Diarrhea', color: 'orange' },
                    { key: 'vomiting', label: '🤢 Vomiting', color: 'yellow' },
                    { key: 'dehydration', label: '😓 Dehydration', color: 'purple' },
                  ].map(({ key, label, color }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSymptom(key)}
                      className={`p-3 rounded-xl text-sm font-medium border transition-all
                        ${form.symptoms[key]
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                      <span className="flex items-center gap-2">
                        {form.symptoms[key] && <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />}
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Other symptoms..."
                  value={form.symptoms.other}
                  onChange={e => setForm(f => ({ ...f, symptoms: { ...f.symptoms, other: e.target.value } }))}
                  className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-cyan-500/50
                    ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {/* Water Quality */}
              <div className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
                <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Droplets className="w-4 h-4 text-blue-400" />
                  Water Quality Data
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">pH Level (0-14)</label>
                      <input type="number" step="0.1" min="0" max="14" placeholder="7.0"
                        value={form.waterQuality.ph}
                        onChange={e => setForm(f => ({ ...f, waterQuality: { ...f.waterQuality, ph: e.target.value } }))}
                        className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/50
                          ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Turbidity (NTU)</label>
                      <input type="number" step="0.1" min="0" placeholder="< 4 is safe"
                        value={form.waterQuality.turbidity}
                        onChange={e => setForm(f => ({ ...f, waterQuality: { ...f.waterQuality, turbidity: e.target.value } }))}
                        className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/50
                          ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Bacterial Presence</label>
                    <div className="flex gap-3">
                      {[true, false].map((val) => (
                        <button
                          key={String(val)}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, waterQuality: { ...f.waterQuality, bacterialPresence: val } }))}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                            ${form.waterQuality.bacterialPresence === val
                              ? val ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-green-500/20 border-green-500/40 text-green-300'
                              : isDark ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                        >
                          {val ? '⚠️ Yes (Contaminated)' : '✅ No (Safe)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Overall Water Status</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['safe', 'moderate', 'contaminated'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, waterQuality: { ...f.waterQuality, status } }))}
                          className={`py-2 rounded-xl text-xs font-medium border capitalize transition-all
                            ${form.waterQuality.status === status
                              ? status === 'safe' ? 'bg-green-500/20 border-green-500/40 text-green-300'
                                : status === 'moderate' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                                : 'bg-red-500/20 border-red-500/40 text-red-300'
                              : isDark ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                        >
                          {status === 'safe' ? '✅' : status === 'moderate' ? '⚠️' : '🚨'} {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Risk Preview */}
              <AnimatePresence>
                {riskResult && <RiskIndicator riskResult={riskResult} isDark={isDark} />}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {isOnline ? 'Submit Report' : '📦 Save Offline'}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
