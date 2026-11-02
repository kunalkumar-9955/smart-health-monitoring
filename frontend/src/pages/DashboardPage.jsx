import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import RiskMap from '../components/map/RiskMap';
import { reportsAPI, villagesAPI, alertsAPI } from '../services/api';
import { useAppStore, useAuthStore, useTranslation } from '../store';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { AlertTriangle, CheckCircle, Droplets, Users, Zap, TrendingUp, Activity } from 'lucide-react';
import { io } from 'socket.io-client';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1 } }),
};

export default function DashboardPage() {
  const { theme } = useAppStore();
  const { t } = useTranslation();
  const [stats, setStats] = useState({ totalCases: 0, byRisk: [], byVillage: [], trend: [] });
  const [villages, setVillages] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  useEffect(() => {
    loadData();
    
    // Connect to WebSocket for real-time updates
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    
    socket.on('new_report', () => loadData());
    socket.on('new_alert', () => loadData());
    socket.on('new_water_data', () => loadData());
    socket.on('report_status_update', () => loadData());

    return () => socket.disconnect();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, villagesRes, alertsRes] = await Promise.allSettled([
        reportsAPI.getStats(),
        villagesAPI.getAll(),
        alertsAPI.getAll(),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (villagesRes.status === 'fulfilled') setVillages(villagesRes.value.data.villages || []);
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data.alerts || []);
    } finally {
      setLoading(false);
    }
  };

  const highRiskCount = villages.filter(v => v.riskLevel === 'HIGH').length;
  const moderateRiskCount = villages.filter(v => v.riskLevel === 'MODERATE').length;
  const totalCases = stats.totalCases || villages.reduce((sum, v) => sum + (v.totalCases || 0), 0);

  const summaryCards = [
    {
      title: t('totalCases'),
      value: totalCases,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/20',
      change: '+12% this week',
    },
    {
      title: t('highRisk'),
      value: highRiskCount,
      icon: AlertTriangle,
      color: 'from-red-500 to-rose-600',
      glow: 'shadow-red-500/20',
      change: `${moderateRiskCount} moderate`,
    },
    {
      title: t('activeAlerts'),
      value: alerts.filter(a => a.isActive).length,
      icon: Zap,
      color: 'from-orange-500 to-amber-500',
      glow: 'shadow-orange-500/20',
      change: 'Requires attention',
    },
    {
      title: t('waterContamination'),
      value: villages.filter(v => v.waterStatus === 'contaminated').length,
      icon: Droplets,
      color: 'from-purple-500 to-violet-600',
      glow: 'shadow-purple-500/20',
      change: `${villages.length} monitored`,
    },
  ];

  const trendData = stats.trend?.length > 0 ? stats.trend : [];
  const villageData = (stats.byVillage || villages.slice(0, 6)).map(v => ({
    name: v._id || v.name,
    cases: v.cases || v.totalCases || 0,
    risk: v.riskLevel === 'HIGH' ? 3 : v.riskLevel === 'MODERATE' ? 2 : 1,
  }));

  return (
    <Layout title="Dashboard" subtitle="Real-time health surveillance overview">
      {/* High Risk Alert Banner */}
      {highRiskCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 glow-danger"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="text-red-300 font-semibold text-sm">
              🚨 {highRiskCount} village{highRiskCount > 1 ? 's' : ''} in HIGH RISK status — Immediate action required!
            </p>
            <p className="text-red-400/60 text-xs mt-0.5">
              Affected: {villages.filter(v => v.riskLevel === 'HIGH').map(v => v.name).join(', ')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.title}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02, y: -2 }}
            className={`rounded-2xl p-5 shadow-lg ${card.glow} overflow-hidden relative
              ${isDark ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white border border-slate-200'}`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10 rounded-full -translate-y-6 translate-x-6"
              style={{ background: `linear-gradient(to bottom right, ${card.color.includes('blue') ? '#3b82f6' : card.color.includes('red') ? '#ef4444' : card.color.includes('orange') ? '#f97316' : '#8b5cf6'}, transparent)` }} />
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 shadow-lg`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-bold mb-1 text-white">{loading ? '...' : card.value}</div>
            <div className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{card.title}</div>
            <div className="text-xs text-slate-500 mt-1">{card.change}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Map */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className={`xl:col-span-2 rounded-2xl overflow-hidden border
            ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}
        >
          <div className="p-4 flex items-center justify-between">
            <div>
              <h2 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>🗺️ {t('map')}</h2>
              <p className="text-xs text-slate-500">Real-time risk zones across villages</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {[['HIGH', '#ef4444'], ['MODERATE', '#f59e0b'], ['LOW', '#22c55e']].map(([label, color]) => (
                <div key={label} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 pb-4">
            <RiskMap villages={villages} height="350px" />
          </div>
        </motion.div>

        {/* Live Activity Feed */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className={`rounded-2xl border flex flex-col
            ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}
        >
          <div className="p-4 border-b border-slate-700/30">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Live Activity</h2>
              <div className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {alerts.slice(0, 8).map((alert, i) => (
              <motion.div
                key={alert._id || i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-3 rounded-xl border text-xs
                  ${alert.riskLevel === 'HIGH'
                    ? 'bg-red-500/10 border-red-500/20 text-red-300'
                    : alert.riskLevel === 'MODERATE'
                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
                      : 'bg-green-500/10 border-green-500/20 text-green-300'}`}
              >
                <div className="flex items-start gap-2">
                  <span>{alert.riskLevel === 'HIGH' ? '🚨' : alert.riskLevel === 'MODERATE' ? '⚠️' : '✅'}</span>
                  <div>
                    <p className="font-semibold">{alert.village || 'Unknown'}</p>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">{alert.message || alert.title}</p>
                    <p className="text-slate-600 mt-1">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            {alerts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 text-xs py-8">
                <CheckCircle className="w-8 h-8 mb-2 text-green-500/50" />
                <p>No active alerts</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Cases Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`rounded-2xl border p-5
            ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}
        >
          <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Cases Over Time
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="caseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
              <Tooltip
                contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="cases" stroke="#0ea5e9" fill="url(#caseGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Village Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`rounded-2xl border p-5
            ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}
        >
          <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Droplets className="w-4 h-4 text-purple-400" />
            Cases by Village
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={villageData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
              <Tooltip
                contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="cases" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </Layout>
  );
}
