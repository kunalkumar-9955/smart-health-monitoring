import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Reports
export const reportsAPI = {
  getAll: (params) => api.get('/reports', { params }),
  create: (data) => api.post('/reports', data),
  getStats: () => api.get('/reports/stats'),
  updateStatus: (id, status) => api.put(`/reports/${id}/status`, { status }),
};

export const waterAPI = {
  getAll: (params) => api.get('/water', { params }),
  create: (data) => api.post('/water', data),
  getStats: () => api.get('/water/stats'),
};

// Alerts
export const alertsAPI = {
  getAll: () => api.get('/alerts'),
  create: (data) => api.post('/alerts', data),
  markRead: (id) => api.put(`/alerts/${id}/read`),
  getCount: () => api.get('/alerts/count'),
};

// Resources
export const resourcesAPI = {
  getAll: () => api.get('/resources'),
  create: (data) => api.post('/resources', data),
  updateStatus: (id, status) => api.put(`/resources/${id}/status`, { status }),
  delete: (id) => api.delete(`/resources/${id}`),
};

// SMS
export const smsAPI = {
  parse: (message) => api.post('/sms/parse', { message }),
  getLogs: () => api.get('/sms/logs'),
};

// Villages
export const villagesAPI = {
  getAll: () => api.get('/villages'),
  create: (data) => api.post('/villages', data),
  update: (id, data) => api.put(`/villages/${id}`, data),
};

export const aiAPI = {
  predict: (data) => api.post('/ai/predict', data),
};

// Standalone ML prediction (calls Flask model via Node proxy)
export const predictAPI = {
  getRisk: (data) => api.post('/predict-risk', data),
};

export default api;
