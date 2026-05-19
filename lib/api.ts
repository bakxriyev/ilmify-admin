// api/api.ts
import axios from 'axios';
import { isTokenExpired, logoutAndRedirect } from './tokenUtils';

// API ning asosiy URL'i
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';

// Axios instance yaratish
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 soniya
});

api.interceptors.request.use(
  (config) => {
    // Faqat client side'da ishlaydi
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');

      if (token) {
        // JWT muddatini tekshirish
        if (isTokenExpired(token)) {
          logoutAndRedirect();
          return Promise.reject(new Error('Token muddati tugagan'));
        }
        config.headers.Authorization = `Bearer ${token}`;
      }

      // center_id ni qo'shish (agar admin biriktirilgan bo'lsa)
      try {
        const admin = JSON.parse(localStorage.getItem('admin') || '{}');
        if (admin.center_id) {
          config.headers['x-center-id'] = admin.center_id;
        }
      } catch {}
      // Teacher uchun center_id ni tekshirish
      try {
        const teacherData = JSON.parse(localStorage.getItem('teacher') || '{}');
        if (teacherData.center_id) {
          config.headers['x-center-id'] = teacherData.center_id;
        }
      } catch {}
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - har bir javobni handle qilish
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.message || '';

    // Markaz bloklanganligini tekshirish
    if (status === 403 && msg === 'MARKAZ_BLOKLANGAN') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('admin');
        const isSuperAdmin = window.location.pathname.startsWith('/super-admin');
        window.location.href = isSuperAdmin ? '/super-admin/login' : '/login';
      }
    }

    // Agar token expired yoki invalid bo'lsa
    if (status === 401) {
      logoutAndRedirect();
    }
    
    // Error message'ni chiqarish
    const errorMessage = msg || 
                        error.response?.data?.error || 
                        error.message || 
                        'Network error occurred';
    
    return Promise.reject({
      ...error,
      message: errorMessage,
      status
    });
  }
);

// localStorage o'zgarishlarini kuzatish (token o'chirilsa logout)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'access_token' && !e.newValue) {
      logoutAndRedirect();
    }
  });
}

export default api;