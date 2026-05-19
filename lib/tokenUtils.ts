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
  return Date.now() >= payload.exp * 1000;
}

export function logoutAndRedirect() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('admin');
  localStorage.removeItem('teacher');
  sessionStorage.removeItem('admin');
  const isSuperAdmin = window.location.pathname.startsWith('/super-admin');
  window.location.href = isSuperAdmin ? '/super-admin/login' : '/login';
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
  if (isTokenExpired(token)) {
    logoutAndRedirect();
    return true;
  }
  return false;
}
