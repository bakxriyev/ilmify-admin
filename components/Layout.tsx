'use client';

import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        onCollapsedChange={setSidebarCollapsed} 
        isMobile={isMobile}
        userId="1" // You'll get this from auth context
      />
      <Header 
        sidebarCollapsed={sidebarCollapsed} 
        isMobile={isMobile}
        onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
      
      {/* Mobile menu overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <main
        className={`
          transition-all duration-300
          ${mounted && !isMobile ? (sidebarCollapsed ? 'ml-20' : 'ml-64') : ''}
          ${isMobile ? 'pb-20' : ''}
          min-h-screen
          w-full
        `}
        style={{
          paddingTop: '80px', // Header height
          width: mounted && !isMobile 
            ? `calc(100% - ${sidebarCollapsed ? '80px' : '256px'})` 
            : '100%',
        }}
      >
        {/* Content container - to'liq kenglik */}
        <div className="w-full h-full">
          {children}
        </div>
      </main>

      {/* Global styles for full width */}
      <style jsx global>{`
        html, body {
          overflow-x: hidden;
          width: 100%;
          margin: 0;
          padding: 0;
        }
        
        #__next {
          width: 100%;
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
}