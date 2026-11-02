import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import RiskMap from '../components/map/RiskMap';
import { villagesAPI } from '../services/api';
import { useAppStore } from '../store';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_VILLAGES = [
  { _id: 'v1', name: 'Rampur', district: 'Muzaffarnagar', population: 3500, location: { lat: 29.4, lng: 77.7 }, riskLevel: 'HIGH', riskScore: 28, totalCases: 15, waterStatus: 'contaminated' },
  { _id: 'v2', name: 'Ganeshpur', district: 'Varanasi', population: 2100, location: { lat: 25.3, lng: 82.9 }, riskLevel: 'MODERATE', riskScore: 14, totalCases: 7, waterStatus: 'moderate' },
  { _id: 'v3', name: 'Kalyanpur', district: 'Pune', population: 4200, location: { lat: 18.5, lng: 73.8 }, riskLevel: 'LOW', riskScore: 6, totalCases: 2, waterStatus: 'safe' },
  { _id: 'v4', name: 'Shivpur', district: 'Patna', population: 1800, location: { lat: 25.6, lng: 85.1 }, riskLevel: 'HIGH', riskScore: 32, totalCases: 22, waterStatus: 'contaminated' },
  { _id: 'v5', name: 'Nandgaon', district: 'Nashik', population: 2900, location: { lat: 19.9, lng: 73.8 }, riskLevel: 'MODERATE', riskScore: 12, totalCases: 5, waterStatus: 'moderate' },
  { _id: 'v6', name: 'Krishnapur', district: 'Jaipur', population: 3100, location: { lat: 26.9, lng: 75.8 }, riskLevel: 'LOW', riskScore: 4, totalCases: 1, waterStatus: 'safe' },
  { _id: 'v7', name: 'Triveni', district: 'Allahabad', population: 5000, location: { lat: 25.4, lng: 81.8 }, riskLevel: 'HIGH', riskScore: 24, totalCases: 18, waterStatus: 'contaminated' },
  { _id: 'v8', name: 'Devpur', district: 'Bhopal', population: 1600, location: { lat: 23.2, lng: 77.4 }, riskLevel: 'LOW', riskScore: 5, totalCases: 0, waterStatus: 'safe' },
];

export default function MapPage() {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [villages, setVillages] = useState(DEMO_VILLAGES);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadVillages(); }, []);

  const loadVillages = async () => {
    setLoading(true);
    try {
      const { data } = await villagesAPI.getAll();
      if (data.villages?.length) setVillages(data.villages);
    } catch {
      // Use demo data
    } finally {
      setLoading(false);
    }
  };

  const filteredVillages = villages.filter(v => filter === 'all' || v.riskLevel === filter);

  return (
    <Layout title="Risk Zone Map" subtitle="Interactive map showing disease risk levels across villages">
      <div className="space-y-5">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {[['all', 'All Villages'], ['HIGH', 'HIGH Risk'], ['MODERATE', 'Moderate'], ['LOW', 'Safe']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all
                  ${filter === key
                    ? key === 'HIGH' ? 'bg-red-500/20 border-red-500/40 text-red-300'
                      : key === 'MODERATE' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                      : key === 'LOW' ? 'bg-green-500/20 border-green-500/40 text-green-300'
                      : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    : isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-600'}`}
              >
                {label} ({key === 'all' ? villages.length : villages.filter(v => v.riskLevel === key).length})
              </button>
            ))}
          </div>
          <button onClick={loadVillages} disabled={loading}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs transition disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Map */}
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
          <div className="p-4 border-b border-slate-700/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Village Risk Map — {filteredVillages.length} villages
                </h3>
                <p className="text-xs text-slate-500">Click markers for details</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                {[['HIGH', '#ef4444', '🔴'], ['MODERATE', '#f59e0b', '🟡'], ['LOW', '#22c55e', '🟢']].map(([l, c, emoji]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                    <span className="text-slate-400">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <RiskMap villages={filteredVillages} height="500px" />
        </div>

        {/* Village Table */}
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
          <div className="p-4 border-b border-slate-700/30">
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Village Risk Summary</h3>
          </div>
          <div className="divide-y divide-slate-700/20">
            {filteredVillages.map((v, i) => (
              <motion.div
                key={v._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`p-4 flex items-center gap-4 ${isDark ? 'hover:bg-slate-700/20' : 'hover:bg-slate-50'} transition-colors`}
              >
                <div className={`w-3 h-3 rounded-full flex-shrink-0`}
                  style={{ backgroundColor: v.riskLevel === 'HIGH' ? '#ef4444' : v.riskLevel === 'MODERATE' ? '#f59e0b' : '#22c55e' }} />
                <div className="flex-1 min-w-0">
                  <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{v.name}</span>
                  <span className="text-xs text-slate-500 ml-2">{v.district}</span>
                </div>
                <div className="flex items-center gap-6 text-xs text-slate-400">
                  <span>🏥 {v.totalCases || 0} cases</span>
                  <span>👥 {v.population?.toLocaleString()}</span>
                  <span className={`capitalize ${v.waterStatus === 'contaminated' ? 'text-red-400' : v.waterStatus === 'moderate' ? 'text-yellow-400' : 'text-green-400'}`}>
                    💧 {v.waterStatus}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    v.riskLevel === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                    v.riskLevel === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'}`}>
                    {v.riskLevel}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
