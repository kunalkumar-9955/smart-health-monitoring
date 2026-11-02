import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { alertsAPI } from '../services/api';
import { useAppStore } from '../store';
import { Bell, CheckCircle, AlertTriangle, Clock, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const RiskColors = {
  HIGH: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: '🚨' },
  MODERATE: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: '⚠️' },
  LOW: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: '✅' },
};

export default function AlertsPage() {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAlerts(); }, []);

  const loadAlerts = async () => {
    try {
      const { data } = await alertsAPI.getAll();
      setAlerts(data.alerts || []);
    } catch {
      // Demo alerts
      setAlerts([
        { _id: '1', village: 'Rampur', title: 'HIGH RISK Alert: Rampur', message: 'Risk score 28. Immediate action required.', riskLevel: 'HIGH', riskScore: 28, isRead: false, timestamp: new Date() },
        { _id: '2', village: 'Shivpur', title: 'HIGH RISK Alert: Shivpur', message: 'Risk score 32. Multiple cholera cases.', riskLevel: 'HIGH', riskScore: 32, isRead: false, timestamp: new Date(Date.now() - 3600000) },
        { _id: '3', village: 'Ganeshpur', title: 'MODERATE RISK: Ganeshpur', message: 'Risk score 14. Water quality degrading.', riskLevel: 'MODERATE', riskScore: 14, isRead: true, timestamp: new Date(Date.now() - 7200000) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await alertsAPI.markRead(id);
      setAlerts(alerts.map(a => a._id === id ? { ...a, isRead: true } : a));
      toast.success('Alert marked as read');
    } catch {
      setAlerts(alerts.map(a => a._id === id ? { ...a, isRead: true } : a));
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'unread') return !a.isRead;
    if (filter === 'high') return a.riskLevel === 'HIGH';
    if (filter === 'moderate') return a.riskLevel === 'MODERATE';
    return true;
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <Layout title="Alert Management" subtitle="Monitor and respond to health risk alerts">
      <div className="space-y-5">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Alerts', value: alerts.length, color: 'blue' },
            { label: 'Unread', value: unreadCount, color: 'orange' },
            { label: 'High Risk', value: alerts.filter(a => a.riskLevel === 'HIGH').length, color: 'red' },
            { label: 'Resolved', value: alerts.filter(a => a.isRead).length, color: 'green' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl border p-4 ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
              <div className={`text-2xl font-bold text-${color}-400`}>{value}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {[['all', 'All Alerts'], ['unread', 'Unread'], ['high', 'HIGH Risk'], ['moderate', 'MODERATE Risk']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all
                ${filter === key
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              {label} {key === 'all' && `(${alerts.length})`}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading alerts...</div>
          ) : filteredAlerts.length === 0 ? (
            <div className={`rounded-2xl border p-8 text-center ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
              <CheckCircle className="w-10 h-10 text-green-500/50 mx-auto mb-3" />
              <p className="text-slate-500">No alerts matching this filter</p>
            </div>
          ) : filteredAlerts.map((alert, i) => {
            const style = RiskColors[alert.riskLevel] || RiskColors.LOW;
            return (
              <motion.div
                key={alert._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-2xl border p-5 ${style.bg} ${style.border} ${!alert.isRead ? 'glow-danger' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{alert.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.text} font-bold`}>
                        {alert.riskLevel}
                      </span>
                      {!alert.isRead && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold">NEW</span>
                      )}
                    </div>
                    <p className={`text-sm mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{alert.message}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(alert.timestamp).toLocaleString()}</span>
                      <span>Score: <strong className={style.text}>{alert.riskScore}</strong></span>
                      {alert.village && <span>📍 {alert.village}</span>}
                    </div>
                  </div>
                  {!alert.isRead && (
                    <button
                      onClick={() => markRead(alert._id)}
                      className="flex-shrink-0 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg border border-white/20 transition"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
