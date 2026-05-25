'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, BarChart3, Package, Building2, LogOut, Menu, X, MessageSquare } from 'lucide-react';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isLoginPage = pathname === '/super-admin/login';
    if (isLoginPage) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/super-admin/login');
      return;
    }
    setLoading(false);
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin');
    router.replace('/super-admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
          <p className="text-gray-500 text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: '/super-admin', label: 'Dashboard', icon: BarChart3 },
    { href: '/super-admin', label: "Markazlar", icon: Building2, matchFn: (p: string) => p === '/super-admin' || p.startsWith('/super-admin/centers') },
    { href: '/super-admin/tariffs', label: 'Tariflar', icon: Package },
    { href: '/super-admin/applications', label: 'Zayafkalar', icon: MessageSquare },
  ];

  const isActive = (link: typeof navLinks[0]) => {
    if (link.matchFn) return link.matchFn(pathname);
    return pathname === link.href;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-30 w-64 h-full bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
          {/* Logo area */}
          <div className="p-5 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">Super Admin</h2>
                <p className="text-xs text-gray-500">Boshqaruv paneli</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navLinks.map(link => {
              const Icon = link.icon;
              const active = isActive(link);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-purple-600/30 to-purple-700/20 text-purple-300 font-medium border-l-2 border-purple-500'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border-l-2 border-transparent'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 border-l-2 border-transparent hover:border-red-500"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Chiqish</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="hidden md:flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <h1 className="text-lg font-bold text-gray-900">Super Admin Panel</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
