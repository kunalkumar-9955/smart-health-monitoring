import { create } from 'zustand';
import { authAPI } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isLoading: false });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authAPI.register(userData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isLoading: false });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  isAuthenticated: () => !!get().token,
  isAdmin: () => get().user?.role === 'admin',
  isFieldWorker: () => get().user?.role === 'field_worker',
}));

export const useAppStore = create((set, get) => ({
  theme: localStorage.getItem('theme') || 'dark',
  language: localStorage.getItem('language') || 'en',
  isMonsoon: false,
  isOnline: navigator.onLine,
  offlineQueue: JSON.parse(localStorage.getItem('offlineQueue') || '[]'),
  sidebarOpen: true,
  alerts: [],
  villages: [],
  recentActivity: [],

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    set({ theme: newTheme });
  },

  setLanguage: (lang) => {
    localStorage.setItem('language', lang);
    set({ language: lang });
  },

  toggleMonsoon: () => set((state) => ({ isMonsoon: !state.isMonsoon })),

  setOnlineStatus: (status) => set({ isOnline: status }),

  addToOfflineQueue: (report) => {
    const queue = [...get().offlineQueue, { ...report, _offlineId: Date.now() }];
    localStorage.setItem('offlineQueue', JSON.stringify(queue));
    set({ offlineQueue: queue });
  },

  clearOfflineQueue: () => {
    localStorage.setItem('offlineQueue', '[]');
    set({ offlineQueue: [] });
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setAlerts: (alerts) => set({ alerts }),
  setVillages: (villages) => set({ villages }),

  addActivity: (activity) => {
    const list = [{ ...activity, id: Date.now(), timestamp: new Date() }, ...get().recentActivity].slice(0, 20);
    set({ recentActivity: list });
  },
}));

import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = () => {
  const language = useAppStore((state) => state.language);
  const { t, i18n } = useI18nTranslation();
  
  if (i18n.language !== language) {
    i18n.changeLanguage(language);
  }
  
  return { t, language };
};
