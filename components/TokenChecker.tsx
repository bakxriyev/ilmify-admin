'use client';
import { useEffect } from 'react';
import { checkTokenAndLogout, silentRefresh } from '@/lib/tokenUtils';
import { initActivityTracking } from '@/lib/activityTracker';

export default function TokenChecker() {
  useEffect(() => {
    checkTokenAndLogout();
    const cleanup = initActivityTracking();

    const check = async () => {
      if (!checkTokenAndLogout()) {
        await silentRefresh();
      }
    };

    const interval = setInterval(check, 60000);
    const handleFocus = () => { check(); };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) check();
    });
    return () => {
      cleanup();
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  return null;
}
