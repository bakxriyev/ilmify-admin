'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGroup, MotionConfig } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import TokenChecker from './TokenChecker';
import MobileTabBar from './shell/MobileTabBar';
import CommandMenu from './shell/CommandMenu';
import AssistantPanel from './shell/AssistantPanel';
import { useShellData } from './shell/useShellData';

const RAIL_KEY = 'ilmify.sidebar.collapsed';

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { admin, setAdmin, center } = useShellData();
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Remembered per viewer; tablets start with the compact rail.
  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(RAIL_KEY); } catch {}
    setCollapsed(stored != null ? stored === '1' : window.innerWidth < 1280);
  }, []);

  const toggleRail = useCallback(() => {
    setCollapsed((c) => {
      try { localStorage.setItem(RAIL_KEY, c ? '0' : '1'); } catch {}
      return !c;
    });
  }, []);

  const logout = useCallback(() => {
    ['access_token', 'refresh_token', 'admin', 'teacher'].forEach((k) => localStorage.removeItem(k));
    router.push('/login');
  }, [router]);

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="relative min-h-dvh w-full"
        style={{ ['--shell-rail' as string]: collapsed ? '76px' : '268px' }}
      >
        <div className="lg-ground" aria-hidden />
        <TokenChecker />

        <LayoutGroup id="shell">
          <Sidebar
            collapsed={collapsed}
            onToggle={toggleRail}
            admin={admin}
            center={center}
            onAdminChange={setAdmin}
            onLogout={logout}
          />
        </LayoutGroup>
        <Header admin={admin} center={center} onSearch={() => setSearchOpen(true)} onLogout={logout} />
        <MobileTabBar admin={admin} />
        <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} admin={admin} />
        <AssistantPanel />

        <main
          className={[
            'relative z-10 min-h-dvh w-full',
            'pt-[68px] pb-[calc(92px+env(safe-area-inset-bottom))]',
            'md:pt-[80px] md:pb-6 md:pr-3 md:pl-[calc(var(--shell-rail)+24px)]',
            'md:transition-[padding-left] md:duration-[260ms] md:ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          ].join(' ')}
        >
          <div data-shell-content className="w-full min-w-0">
            {children}
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}
