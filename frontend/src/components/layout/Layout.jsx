import { useAppStore } from '../../store';
import Sidebar from './Sidebar';
import Header from './Header';
import { motion } from 'framer-motion';

export default function Layout({ children, title, subtitle }) {
  const { theme, sidebarOpen } = useAppStore();

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar />
      <motion.main
        animate={{ marginLeft: sidebarOpen ? '256px' : '0px' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
      >
        <Header title={title} subtitle={subtitle} />
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
