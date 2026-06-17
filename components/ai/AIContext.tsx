'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'table' | 'stats' | 'chart' | 'error';
  data?: any;
  columns?: string[];
  chartType?: 'bar' | 'line' | 'pie';
  timestamp: Date;
}

export interface DashboardStats {
  today_students: number;
  today_payments_total: number;
  today_payments_count: number;
  today_attendance_total: number;
  today_attendance_present: number;
  today_attendance_rate: number;
  debtors_count: number;
  new_leads: number;
  active_groups: number;
  teachers_working: number;
  total_students: number;
  total_teachers: number;
  total_groups: number;
  monthly_revenue: number;
}

interface AIContextValue {
  messages: AIMessage[];
  isOpen: boolean;
  isExpanded: boolean;
  isFullScreen: boolean;
  isLoading: boolean;
  dashboardStats: DashboardStats | null;
  showDashboard: boolean;
  sendMessage: (text: string) => Promise<void>;
  toggleOpen: () => void;
  toggleExpand: () => void;
  toggleFullScreen: () => void;
  closeWidget: () => void;
  dismissDashboard: () => void;
  refreshDashboard: () => Promise<void>;
  unreadCount: number;
}

const AIContext = createContext<AIContextValue | null>(null);

export function useAI() {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error('useAI must be used within AIProvider');
  return ctx;
}

export function AIProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminName, setAdminName] = useState('');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const isLoginPage = window.location.pathname === '/login'
      || window.location.pathname === '/super-admin/login'
      || window.location.pathname === '/';

    if (isLoginPage) return;

    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');
      if (admin.full_name) setAdminName(admin.full_name);
    } catch {}

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const isDashboard = window.location.pathname === '/dashboard' || window.location.pathname === '/';
    if (isDashboard) {
      refreshDashboard();
      setShowDashboard(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isLoginPage = window.location.pathname === '/login'
      || window.location.pathname === '/super-admin/login'
      || window.location.pathname === '/';
    if (isLoginPage) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });

    socket.on('connect', () => {
      socket.emit('join_ai_room', { token });
    });

    socket.on('ai_dashboard_update', () => {
      refreshDashboard();
    });

    socket.on('new_student', () => refreshDashboard());
    socket.on('new_payment', () => refreshDashboard());
    socket.on('new_attendance', () => refreshDashboard());
    socket.on('new_lead', () => refreshDashboard());

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshDashboard();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const refreshDashboard = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const res = await fetch(`${API_URL}/ai/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data.data || data);
      }
    } catch {}
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      type: 'text',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Kechirasiz, so\'rov juda uzoq davom etdi. Iltimos, qisqaroq savol bering yoki keyinroq urinib ko\'ring.',
        type: 'error',
        timestamp: new Date(),
      }]);
    }, 60000);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No auth token');

      const controller = new AbortController();
      const timeoutFetch = setTimeout(() => controller.abort(), 55000);

      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });
      clearTimeout(timeoutFetch);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `Server xatosi: ${res.status}`);
      }

      const data = await res.json();
      const aiMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        type: data.type || 'text',
        data: data.data,
        columns: data.columns,
        chartType: data.chart_type,
        timestamp: new Date(),
      };
      clearTimeout(timeoutId);
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      clearTimeout(timeoutId);
      const errMsg = err.name === 'AbortError'
        ? 'Kechirasiz, so\'rov juda uzoq davom etdi. Iltimos, qisqaroq savol bering yoki keyinroq urinib ko\'ring.'
        : `Kechirasiz, xatolik yuz berdi: ${err.message}`;
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errMsg,
        type: 'error',
        timestamp: new Date(),
      }]);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
    if (isFullScreen) setIsFullScreen(false);
  }, [isFullScreen]);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen(prev => !prev);
    if (isExpanded) setIsExpanded(false);
  }, [isExpanded]);

  const closeWidget = useCallback(() => {
    setIsOpen(false);
    setIsExpanded(false);
    setIsFullScreen(false);
  }, []);

  const dismissDashboard = useCallback(() => {
    setShowDashboard(false);
  }, []);

  const value: AIContextValue = {
    messages,
    isOpen,
    isExpanded,
    isFullScreen,
    isLoading,
    dashboardStats,
    showDashboard,
    sendMessage,
    toggleOpen,
    toggleExpand,
    toggleFullScreen,
    closeWidget,
    dismissDashboard,
    refreshDashboard,
    unreadCount,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}
