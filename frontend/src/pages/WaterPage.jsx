import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { waterAPI } from '../services/api';
import { useAppStore } from '../store';
import { Droplets, Cpu, Plus, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const VILLAGES = ['Rampur', 'Ganeshpur', 'Kalyanpur', 'Shivpur', 'Nandgaon', 'Triveni'];

const WaterStatusBadge = ({ status }) => {
  const styles = {
    safe: 'bg-green-500/20 text-green-400 border-green-500/30',
    moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    contaminated: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  const icons = { safe: '✅', moderate: '⚠️', contaminated: '🚨' };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${styles[status] || styles.safe}`}>
      {icons[status]} {status}
    </span>
  );
};

export default function WaterPage() {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ village: '', ph: '', turbidity: '', bacterialPresence: false, dissolvedOxygen: '', temperature: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data: res } = await waterAPI.getAll();
      setData(res.data || []);
    } catch (e) {
      toast.error('Could not load water data');
    } finally {
      setLoading(false);
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    try {
      await waterAPI.create(form);
      toast.success('✅ Water data recorded!');
      setShowForm(false);
      await loadData();
    } catch (e) {
      toast.error('Submission failed');
    }
  };

  const safeCount = data.filter(d => d.status === 'safe').length;
  const moderateCount = data.filter(d => d.status === 'moderate').length;
  const contaminatedCount = data.filter(d => d.status === 'contaminated').length;

  return (
    <Layout title="Water Monitoring System" subtitle="Real-time water quality tracking and IoT sensor data">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Safe Sources', count: safeCount, color: 'green', icon: '✅' },
            { label: 'Moderate Risk', count: moderateCount, color: 'yellow', icon: '⚠️' },
            { label: 'Contaminated', count: contaminatedCount, color: 'red', icon: '🚨' },
          ].map(({ label, count, color, icon }) => (
            <motion.div
              key={label}
              whileHover={{ scale: 1.02 }}
              className={`rounded-2xl border p-4 text-center
                ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}
            >
              <div className="text-3xl mb-1">{icon}</div>
              <div className={`text-2xl font-bold text-${color}-400`}>{loading ? '...' : count}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            Manual Entry
          </motion.button>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-slate-700 text-slate-400 hover:text-white transition">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Manual Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}
          >
            <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>📝 Manual Water Data Entry</h3>
            <form onSubmit={submitForm}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Village</label>
                  <select value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} required
                    className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}>
                    <option value="">Select...</option>
                    {VILLAGES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                {[
                  { key: 'ph', label: 'pH Level', placeholder: '7.0', step: '0.1', min: '0', max: '14' },
                  { key: 'turbidity', label: 'Turbidity (NTU)', placeholder: '< 4', step: '0.1', min: '0' },
                  { key: 'dissolvedOxygen', label: 'Dissolved O₂ (mg/L)', placeholder: '6-8', step: '0.1' },
                  { key: 'temperature', label: 'Temperature (°C)', placeholder: '25', step: '0.1' },
                ].map(({ key, label, placeholder, ...rest }) => (
                  <div key={key}>
                    <label className="block text-xs text-slate-400 mb-1">{label}</label>
                    <input type="number" placeholder={placeholder} value={form[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      {...rest}
                      className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-300'}`}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Bacterial Presence</label>
                  <div className="flex gap-2 mt-1">
                    {[true, false].map(v => (
                      <button key={String(v)} type="button"
                        onClick={() => setForm({ ...form, bacterialPresence: v })}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${form.bacterialPresence === v ? v ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300' : isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                        {v ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-6 py-2.5 bg-cyan-500 text-white rounded-xl text-sm font-semibold hover:bg-cyan-600 transition">Submit</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-slate-700 text-slate-400 rounded-xl text-sm hover:border-slate-600 transition">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Data Table */}
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
          <div className="p-4 border-b border-slate-700/30 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Water Quality Records ({data.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-700/50 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  {['Village', 'pH', 'Turbidity', 'Bacterial', 'D.O.', 'Temp', 'Status', 'Source', 'Time'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-8 text-slate-500">Loading...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-slate-500">No data. Click "Simulate IoT Sensors" to generate data.</td></tr>
                ) : data.slice(0, 20).map((row, i) => (
                  <motion.tr
                    key={row._id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`border-b transition-colors ${isDark ? 'border-slate-700/30 hover:bg-slate-700/20' : 'border-slate-100 hover:bg-slate-50'}`}
                  >
                    <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.village}</td>
                    <td className={`px-4 py-3 ${row.ph < 6.5 || row.ph > 8.5 ? 'text-red-400' : 'text-green-400'}`}>{row.ph?.toFixed(1) || '-'}</td>
                    <td className={`px-4 py-3 ${row.turbidity > 4 ? 'text-red-400' : 'text-green-400'}`}>{row.turbidity?.toFixed(1) || '-'}</td>
                    <td className={`px-4 py-3 ${row.bacterialPresence ? 'text-red-400' : 'text-green-400'}`}>{row.bacterialPresence ? '⚠️ Yes' : '✅ No'}</td>
                    <td className="px-4 py-3 text-slate-400">{row.dissolvedOxygen?.toFixed(1) || '-'}</td>
                    <td className="px-4 py-3 text-slate-400">{row.temperature?.toFixed(1) || '-'}°C</td>
                    <td className="px-4 py-3"><WaterStatusBadge status={row.status} /></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${row.source === 'iot_simulated' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {row.source === 'iot_simulated' ? '🔬 IoT' : '📝 Manual'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(row.timestamp).toLocaleTimeString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
