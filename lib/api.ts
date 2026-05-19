import axios from 'axios';
import { setLastActivity } from './activityTracker';
import { logoutAndRedirect, tryRefreshToken } from './tokenUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

function processQueue(error: any, token: string | null = null) {
  refreshQueue.forEach(p => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  refreshQueue = [];
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      setLastActivity();
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      try {
        const admin = JSON.parse(localStorage.getItem('admin') || '{}');
        if (admin.center_id) config.headers['x-center-id'] = admin.center_id;
      } catch {}
      try {
        const teacherData = JSON.parse(localStorage.getItem('teacher') || '{}');
        if (teacherData.center_id) config.headers['x-center-id'] = teacherData.center_id;
      } catch {}
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.message || '';
    const originalRequest = error.config;

    if (status === 403 && msg === 'MARKAZ_BLOKLANGAN') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('admin');
        const isSuperAdmin = window.location.pathname.startsWith('/super-admin');
        window.location.href = isSuperAdmin ? '/super-admin/login' : '/login';
      }
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest?._retry) {
      if (typeof window === 'undefined') {
        logoutAndRedirect();
        return Promise.reject(error);
      }

      const token = localStorage.getItem('access_token');
      if (!token) {
        logoutAndRedirect();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(newToken => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const success = await tryRefreshToken();
        if (!success) {
          processQueue(new Error('Refresh failed'));
          logoutAndRedirect();
          return Promise.reject(error);
        }
        const newToken = localStorage.getItem('access_token') || '';
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        logoutAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const errorMessage = msg ||
      error.response?.data?.error ||
      error.message ||
      'Network error occurred';

    return Promise.reject({ ...error, message: errorMessage, status });
  }
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'access_token' && !e.newValue) {
      logoutAndRedirect();
    }
  });
}

export default api;
