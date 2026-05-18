'use client';

import { useEffect, useRef } from 'react';
import api from '@/lib/api';

export default function CenterStatusChecker() {
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const adminData = localStorage.getItem('admin');
        if (!adminData) return;
        const admin = JSON.parse(adminData);
        if (!admin.center_id) return;

        await api.get('/education-centers/verify', {
          headers: { 'x-center-id': String(admin.center_id) },
        });
      } catch (err: any) {
        if (err?.response?.status === 403) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('admin');
          window.location.href = '/login';
        }
      }
    };

    // Har 30 soniyada tekshirish
    checkStatus();
    intervalRef.current = setInterval(checkStatus, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return null;
}
