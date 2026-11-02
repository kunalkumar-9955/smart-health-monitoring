import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store';
import { Wifi, WifiOff, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { reportsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Header({ title, subtitle }) {
  const { theme, isOnline, offlineQueue, clearOfflineQueue, setOnlineStatus } = useAppStore();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const onOnline = () => setOnlineStatus(true);
    const onOffline = () => setOnlineStatus(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const syncData = async () => {
    if (!offlineQueue.length) return;
    setSyncing(true);
    try {
      let success = 0;
      for (const report of offlineQueue) {
        try {
          await reportsAPI.create(report);
          success++;
        } catch (e) {}
      }
      clearOfflineQueue();
      toast.success(`✅ Synced ${success} reports successfully!`);
    } catch (e) {
      toast.error('Sync failed. Try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className={`h-16 flex items-center justify-between px-6 border-b flex-shrink-0
      ${theme === 'dark' ? 'bg-slate-900/80 border-slate-700/50 backdrop-blur-sm' : 'bg-white/80 border-slate-200 backdrop-blur-sm'}`}>
      <div>
        <h1 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Offline badge */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-medium"
            >
              <WifiOff className="w-3.5 h-3.5" />
              Offline Mode Active
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sync button when back online with queue */}
        <AnimatePresence>
          {isOnline && offlineQueue.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={syncData}
              disabled={syncing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-all"
            >
              <Upload className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              Sync Data ({offlineQueue.length})
            </motion.button>
          )}
        </AnimatePresence>

        {/* Online indicator */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className={`text-xs ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
            {isOnline ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
}
