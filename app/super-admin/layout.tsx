'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, BarChart3, Package, LogOut, Menu, X, RefreshCw } from 'lucide-react';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/super-admin/login');
      return;
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin');
    router.replace('/super-admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const navLinks = [
    { href: '/super-admin', label: 'Dashboard', icon: BarChart3 },
    { href: '/super-admin/tariffs', label: 'Tariflar', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen overflow-hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-30 w-64 h-full bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
          <div className="p-5 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-600 rounded-xl"><Shield className="h-6 w-6" /></div>
              <div><h2 className="font-bold text-lg">Super Admin</h2><p className="text-xs text-gray-400">Boshqaruv paneli</p></div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive ? 'bg-purple-600/20 text-purple-300 font-medium' : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-5 w-5" /> {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-700">
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-red-300 hover:bg-red-500/10 transition-colors">
              <LogOut className="h-5 w-5" /> Chiqish
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm border-b px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <h1 className="text-lg font-bold text-gray-900">Super Admin Panel</h1>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
