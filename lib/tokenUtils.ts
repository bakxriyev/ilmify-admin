import { getLastActivity, setLastActivity, isInactive } from './activityTracker';
import { adminApi } from '@/api/adminApi';

export function decodeToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  if (isInactive()) return true;
  return Date.now() >= payload.exp * 1000;
}

export function logoutAndRedirect() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('admin');
  localStorage.removeItem('teacher');
  localStorage.removeItem('last_activity_at');
  sessionStorage.removeItem('admin');
  const isSuperAdmin = window.location.pathname.startsWith('/super-admin');
  window.location.href = isSuperAdmin ? '/super-admin/login' : '/login';
}

export async function tryRefreshToken(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    if (isInactive()) return false;
    const payload = decodeToken(refreshToken);
    if (!payload || !payload.exp || Date.now() >= payload.exp * 1000) return false;
    const res = await adminApi.refreshToken(refreshToken);
    if (res?.access_token) {
      localStorage.setItem('access_token', res.access_token);
      if (res.refresh_token) localStorage.setItem('refresh_token', res.refresh_token);
      setLastActivity();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function checkTokenAndLogout(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('access_token');
  if (!token) {
    const isOnLoginPage = window.location.pathname === '/login' || window.location.pathname === '/super-admin/login';
    if (!isOnLoginPage) {
      logoutAndRedirect();
      return true;
    }
    return false;
  }
  if (isInactive()) {
    logoutAndRedirect();
    return true;
  }
  setLastActivity();
  return false;
}

export async function silentRefresh(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('access_token');
  if (!token) return false;
  if (isInactive()) return false;
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return false;
  if (Date.now() < payload.exp * 1000) return true;
  return tryRefreshToken();
}
