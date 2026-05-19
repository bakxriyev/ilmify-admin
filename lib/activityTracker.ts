const ACTIVITY_KEY = 'last_activity_at';
const INACTIVITY_TIMEOUT = 60 * 60 * 1000;

export function getLastActivity(): number {
  if (typeof window === 'undefined') return Date.now();
  const stored = localStorage.getItem(ACTIVITY_KEY);
  return stored ? Number(stored) : Date.now();
}

export function setLastActivity(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
}

export function isInactive(): boolean {
  const last = getLastActivity();
  return Date.now() - last > INACTIVITY_TIMEOUT;
}

export function initActivityTracking(): () => void {
  setLastActivity();
  let lastMousemove = 0;
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  const throttledHandler = () => setLastActivity();
  const mousemoveHandler = () => {
    const now = Date.now();
    if (now - lastMousemove > 5000) {
      lastMousemove = now;
      setLastActivity();
    }
  };
  events.forEach(ev => window.addEventListener(ev, throttledHandler, { passive: true }));
  window.addEventListener('mousemove', mousemoveHandler, { passive: true });
  return () => {
    events.forEach(ev => window.removeEventListener(ev, throttledHandler));
    window.removeEventListener('mousemove', mousemoveHandler);
  };
}
