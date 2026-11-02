import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { resourcesAPI } from '../services/api';
import { useAppStore, useAuthStore } from '../store';
import { Package, Plus, Stethoscope, Droplets, FlaskConical, CheckCircle, Clock, Loader, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const RESOURCE_TYPES = [
  { value: 'doctor', label: 'Doctor', icon: Stethoscope, color: 'from-blue-500 to-cyan-500' },
  { value: 'medical_kit', label: 'Medical Kit', icon: FlaskConical, color: 'from-green-500 to-emerald-500' },
  { value: 'water_treatment', label: 'Water Treatment Unit', icon: Droplets, color: 'from-purple-500 to-violet-500' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Loader },
  completed: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: CheckCircle },
};

const VILLAGES = ['Rampur', 'Ganeshpur', 'Kalyanpur', 'Shivpur', 'Nandgaon', 'Triveni'];

export default function ResourcesPage() {
  const { theme } = useAppStore();
  const { isAdmin } = useAuthStore();
  const isDark = theme === 'dark';

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ village: '', type: 'doctor', quantity: 1, assignedTo: '', notes: '' });

  useEffect(() => { loadResources(); }, []);

  const loadResources = async () => {
    try {
      const { data } = await resourcesAPI.getAll();
      setResources(data.resources || []);
    } catch {
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await resourcesAPI.create(form);
      toast.success('✅ Resource assigned!');
      setShowForm(false);
      await loadResources();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to assign resource');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await resourcesAPI.updateStatus(id, status);
      setResources(res => res.map(r => r._id === id ? { ...r, status } : r));
      toast.success('Status updated!');
    } catch {
      toast.error('Update failed');
    }
  };

  const deleteResource = async (id) => {
    if (!confirm('Delete this resource assignment?')) return;
    try {
      await resourcesAPI.delete(id);
      setResources(res => res.filter(r => r._id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const summaryByType = RESOURCE_TYPES.map(t => ({
    ...t,
    count: resources.filter(r => r.type === t.value).length,
    pending: resources.filter(r => r.type === t.value && r.status === 'pending').length,
  }));

  return (
    <Layout title="Resource Allocation" subtitle="Assign doctors, medical kits, and water treatment units">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryByType.map(({ label, color, icon: Icon, count, pending }) => (
            <motion.div
              key={label}
              whileHover={{ scale: 1.02 }}
              className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{count}</div>
              <div className="text-sm text-slate-500">{label}s Assigned</div>
              {pending > 0 && <div className="text-xs text-yellow-400 mt-1">{pending} pending</div>}
            </motion.div>
          ))}
        </div>

        {/* Assign Form */}
        {isAdmin() && (
          <div>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" />
              Assign New Resource
            </motion.button>

            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mt-4 rounded-2xl border p-5 overflow-hidden ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}
                >
                  <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>📦 New Resource Assignment</h3>
                  <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Village *</label>
                      <select value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} required
                        className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}>
                        <option value="">Select...</option>
                        {VILLAGES.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Resource Type *</label>
                      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                        className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}>
                        <option value="doctor">Doctor</option>
                        <option value="medical_kit">Medical Kit</option>
                        <option value="water_treatment">Water Treatment Unit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Quantity</label>
                      <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) })}
                        className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Assigned To</label>
                      <input type="text" placeholder="Name or team" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                        className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-300'}`} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-slate-400 mb-1">Notes</label>
                      <input type="text" placeholder="Additional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                        className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-300'}`} />
                    </div>
                    <div className="col-span-2 md:col-span-3 flex gap-3">
                      <button type="submit" className="px-6 py-2.5 bg-cyan-500 text-white rounded-xl text-sm font-semibold hover:bg-cyan-600 transition">Assign Resource</button>
                      <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-slate-700 text-slate-400 rounded-xl text-sm hover:border-slate-600 transition">Cancel</button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Resources Table */}
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}>
          <div className="p-4 border-b border-slate-700/30 flex items-center gap-2">
            <Package className="w-4 h-4 text-cyan-400" />
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Assigned Resources ({resources.length})</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : resources.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No resources assigned yet</div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {resources.map((r, i) => {
                const typeConfig = RESOURCE_TYPES.find(t => t.value === r.type);
                const statusConfig = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusConfig.icon;
                return (
                  <motion.div
                    key={r._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`p-4 flex items-center gap-4 ${isDark ? 'hover:bg-slate-700/20' : 'hover:bg-slate-50'} transition-colors`}
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${typeConfig?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center flex-shrink-0`}>
                      {typeConfig?.icon && <typeConfig.icon className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{typeConfig?.label || r.type}</span>
                        <span className="text-xs text-slate-500">×{r.quantity}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" /> {statusConfig.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        📍 {r.village} {r.assignedTo && `→ ${r.assignedTo}`}
                        {r.notes && <span className="text-slate-600"> • {r.notes}</span>}
                      </div>
                    </div>
                    {isAdmin() && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          value={r.status}
                          onChange={e => updateStatus(r._id, e.target.value)}
                          className={`text-xs px-2 py-1.5 rounded-lg border focus:outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button onClick={() => deleteResource(r._id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
