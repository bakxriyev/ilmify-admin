'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';

export function useNotificationSocket(onNotification: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('access_token');
    const adminRaw = localStorage.getItem('admin');

    if (!token || !adminRaw) return;

    let admin: any;
    try { admin = JSON.parse(adminRaw); } catch { return; }

    const userId = admin.id;
    const role = admin.role === 'super_admin' ? 'admin' : 'admin';
    const centerId = admin.center_id;

    const socket = io(SOCKET_URL, {
      query: {
        userId: String(userId),
        role,
        token,
        centerId: centerId ? String(centerId) : '',
      },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[NotificationSocket] Connected');
    });

    socket.on('notification', (data: any) => {
      onNotification(data);
    });

    socket.on('disconnect', () => {
      console.log('[NotificationSocket] Disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('[NotificationSocket] Error:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [onNotification]);

  return socketRef;
}
