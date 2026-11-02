import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff, Shield, Users, User } from 'lucide-react';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { email: 'admin@health.gov', password: 'admin123', role: 'Admin', icon: Shield, color: 'from-purple-500 to-violet-600' },
  { email: 'worker@health.gov', password: 'admin123', role: 'Field Worker', icon: Users, color: 'from-cyan-500 to-blue-600' },
  { email: 'user@village.in', password: 'admin123', role: 'Public User', icon: User, color: 'from-green-500 to-emerald-600' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'public', village: '', phone: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRegister) {
      const result = await register(form);
      if (result.success) {
        toast.success('🎉 Account created successfully!');
        navigate('/dashboard');
      } else {
        toast.error(result.error);
      }
    } else {
      const result = await login(form.email, form.password);
      if (result.success) {
        toast.success('✅ Login successful!');
        navigate('/dashboard');
      } else {
        toast.error(result.error);
      }
    }
  };

  const quickLogin = async (email, password) => {
    const result = await login(email, password);
    if (result.success) {
      toast.success('✅ Demo login successful!');
      navigate('/dashboard');
    } else {
      toast.error('Demo login failed - ensure backend is running');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        {/* Animated background orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">HealthWatch</h1>
              <p className="text-cyan-400 text-sm">Early Warning System</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Smart Community<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Health Monitoring
            </span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Real-time surveillance & early warning system for water-borne disease outbreaks
            across rural communities.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '1,200+', label: 'Villages Monitored' },
              { value: '98%', label: 'Early Detection Rate' },
              { value: '24/7', label: 'Real-time Alerts' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Accounts */}
        <div className="relative z-10">
          <p className="text-slate-400 text-sm mb-3 font-medium">🚀 Quick Demo Access:</p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map(({ email, password, role, icon: Icon, color }) => (
              <motion.button
                key={role}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => quickLogin(email, password)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-left"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{role}</p>
                  <p className="text-slate-500 text-xs truncate">{email}</p>
                </div>
                <span className="text-xs text-cyan-400">Login →</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">HealthWatch</h1>
              <p className="text-cyan-400 text-xs">Early Warning System</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Tabs */}
            <div className="flex bg-slate-800/50 rounded-xl p-1 mb-6">
              {['Login', 'Register'].map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setIsRegister(i === 1)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    isRegister === (i === 1)
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={isRegister ? 'register' : 'login'}
                initial={{ opacity: 0, x: isRegister ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {isRegister && (
                  <>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Enter your name"
                        required
                        className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Role</label>
                      <select
                        value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value })}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                      >
                        <option value="public">Public User (Villager)</option>
                        <option value="field_worker">Field Worker (ASHA/Volunteer)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Village</label>
                        <input
                          type="text"
                          value={form.village}
                          onChange={e => setForm({ ...form, village: e.target.value })}
                          placeholder="Village name"
                          className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          placeholder="+91-XXXXXXXX"
                          className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="Enter your email"
                    required
                    className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Enter your password"
                      required
                      className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!isRegister && (
                  <div className="text-xs text-slate-500 bg-slate-800/30 rounded-lg p-3">
                    Demo: <span className="text-cyan-400">admin@health.gov</span> / <span className="text-cyan-400">admin123</span>
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isRegister ? 'Creating Account...' : 'Signing In...'}
                    </span>
                  ) : (
                    isRegister ? '🚀 Create Account' : '🔐 Sign In'
                  )}
                </motion.button>

                {/* Mobile demo buttons */}
                <div className="lg:hidden">
                  <p className="text-center text-slate-500 text-xs mb-2">Quick Demo:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {DEMO_ACCOUNTS.map(({ email, password, role }) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => quickLogin(email, password)}
                        className="py-2 px-2 text-xs bg-slate-800 text-cyan-400 rounded-lg border border-slate-700 hover:border-cyan-500 transition-colors"
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.form>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
