'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { notificationApi } from '@/api/notificationApi';
import { useNotificationSocket } from './useNotificationSocket';

interface Notification {
  id: number;
  title: string;
  description?: string;
  link?: string;
  image?: string;
  createdAt: string;
  is_read: boolean;
  sender_type?: string;
  student_id?: number;
  teacher_id?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: any) => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return;
      const adminRaw = localStorage.getItem('admin');
      if (!adminRaw) return;
      const admin = JSON.parse(adminRaw);
      const res = await notificationApi.findUser(admin.id, admin.role === 'super_admin' ? 'admin' : 'admin', 1, 10);
      setNotifications(res.data.data || []);
    } catch {}
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return;
      const adminRaw = localStorage.getItem('admin');
      if (!adminRaw) return;
      const admin = JSON.parse(adminRaw);
      const res = await notificationApi.unreadCount(admin.id, admin.role === 'super_admin' ? 'admin' : 'admin');
      setUnreadCount(res.data || 0);
    } catch {}
  }, []);

  const addNotification = useCallback((data: any) => {
    setNotifications(prev => [{ ...data, is_read: false }, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return;
      const adminRaw = localStorage.getItem('admin');
      if (!adminRaw) return;
      const admin = JSON.parse(adminRaw);
      await notificationApi.markAllAsRead(admin.id, admin.role === 'super_admin' ? 'admin' : 'admin');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  useNotificationSocket(addNotification);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, addNotification,
      markAsRead, markAllAsRead, fetchNotifications, fetchUnreadCount,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
}
