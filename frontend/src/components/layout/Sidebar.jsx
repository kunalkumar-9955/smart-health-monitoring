import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Droplets, Bell, Package,
  MessageSquare, BookOpen, Map, LogOut, Menu, X,
  Sun, Moon, Globe, Zap, Shield, Activity
} from 'lucide-react';
import { useAuthStore, useAppStore, useTranslation } from '../../store';
import { useState } from 'react';

const navItems = [
  { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
  { key: 'map', path: '/map', icon: Map },
  { key: 'reports', path: '/reports', icon: FileText },
  { key: 'water', path: '/water', icon: Droplets },
  { key: 'alerts', path: '/alerts', icon: Bell },
  { key: 'resources', path: '/resources', icon: Package, adminOnly: true },
  { key: 'sms', path: '/sms', icon: MessageSquare },
  { key: 'awareness', path: '/awareness', icon: BookOpen },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuthStore();
  const { theme, toggleTheme, language, setLanguage, sidebarOpen, toggleSidebar, isMonsoon, toggleMonsoon } = useAppStore();
  const { t } = useTranslation();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter(item => !item.adminOnly || isAdmin());

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed left-0 top-0 h-full w-64 z-30 flex flex-col
          ${theme === 'dark'
            ? 'bg-slate-900 border-r border-slate-700/50'
            : 'bg-white border-r border-slate-200'}
          `}
      >
        {/* Logo */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
            </div>
            <div>
              <p className={`text-xs font-bold leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                HealthWatch
              </p>
              <p className="text-xs text-cyan-500">Early Warning System</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className={`p-4 mx-3 mt-3 rounded-xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {user?.name || 'User'}
              </p>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-cyan-500" />
                <p className="text-xs text-cyan-500 capitalize">
                  {user?.role?.replace('_', ' ') || 'user'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
          {filteredNav.map(({ key, path, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${active
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                      : theme === 'dark'
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-cyan-400' : ''}`} />
                  {t(key)}
                  {key === 'alerts' && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      !
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Controls */}
        <div className={`p-3 border-t space-y-2 ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
          {/* Monsoon Toggle */}
          <button
            onClick={toggleMonsoon}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all
              ${isMonsoon
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}
          >
            <span>{isMonsoon ? '🌧️ Monsoon Active' : '☀️ Dry Season'}</span>
            <div className={`w-8 h-4 rounded-full transition-colors ${isMonsoon ? 'bg-blue-500' : 'bg-slate-600'} relative`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isMonsoon ? 'left-4' : 'left-0.5'}`} />
            </div>
          </button>

          {/* Language */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all
                ${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}
            >
              <Globe className="w-3.5 h-3.5" />
              {language === 'en' ? '🇬🇧 English' : language === 'hi' ? '🇮🇳 हिंदी' : '🌿 Tribal'}
            </button>
            <AnimatePresence>
              {showLangMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className={`absolute bottom-full left-0 right-0 mb-1 rounded-xl border shadow-xl overflow-hidden
                    ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                >
                  {[['en', '🇬🇧 English'], ['hi', '🇮🇳 हिंदी'], ['tribal', '🌿 Tribal']].map(([code, label]) => (
                    <button
                      key={code}
                      onClick={() => { setLanguage(code); setShowLangMenu(false); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-cyan-500/10 transition-colors
                        ${language === code ? 'text-cyan-400' : theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}
                    >
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme + Logout */}
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all
                ${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t('logout')}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Sidebar toggle button for mobile */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-4 left-4 z-40 lg:hidden w-10 h-10 rounded-xl flex items-center justify-center shadow-lg
          ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
    </>
  );
}
