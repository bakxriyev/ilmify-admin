'use client';

import { useEffect } from 'react';
import { checkTokenAndLogout } from '@/lib/tokenUtils';

export default function TokenChecker() {
  useEffect(() => {
    // 1. Sahifa yuklanganda tekshirish
    checkTokenAndLogout();

    // 2. Har 30 soniyada token muddatini tekshirish
    const interval = setInterval(() => {
      checkTokenAndLogout();
    }, 30000);

    // 3. Tab fokuslanganda tekshirish
    const handleFocus = () => checkTokenAndLogout();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) checkTokenAndLogout();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return null;
}
