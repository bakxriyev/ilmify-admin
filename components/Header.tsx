'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Bell, Search, Settings, LogOut, User, Calendar, ChevronDown,
  Building, DollarSign, LogOut as LogOutIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  sidebarCollapsed?: boolean;
  isMobile: boolean;
  onMenuClick?: () => void;
}

export default function Header({ sidebarCollapsed, isMobile, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [center, setCenter] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (typeof window !== 'undefined') {
        try {
          const adminData = JSON.parse(localStorage.getItem('admin') || '{}');
          if (adminData?.full_name || adminData?.role) {
            setAdmin(adminData);
            if (adminData.center) {
              setCenter(adminData.center);
            } else if (adminData.center_id) {
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz'}/education-centers/${adminData.center_id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
              });
              if (res.ok) setCenter(await res.json());
            }
          } else {
            const teacherData = JSON.parse(localStorage.getItem('teacher') || '{}');
            if (teacherData?.first_name) {
              setAdmin({
                full_name: `${teacherData.first_name} ${teacherData.last_name || ''}`,
                role: 'teacher',
                phone_number: teacherData.phone_number,
              });
            }
          }
        } catch {}
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin');
    localStorage.removeItem('teacher');
    router.push('/login');
  };

  if (!mounted) return null;

  return (
    <header className="fixed top-0 right-0 left-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-6"
        style={{ marginLeft: !isMobile ? (sidebarCollapsed ? '80px' : '240px') : '0px' }}>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{currentTime}</p>
              <p className="text-xs text-gray-500">{currentDate}</p>
            </div>
          </div>
          {center && (
            <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-blue-50 flex items-center justify-center shrink-0">
                {center.logo ? (
                  <img src={`${process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz'}/uploads/centers/${center.logo}`}
                    className="w-full h-full object-cover" alt={center.name} />
                ) : (
                  <Building className="h-4 w-4 text-blue-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{center.name}</p>
                <p className="text-xs text-gray-500">
                  <DollarSign className="h-3 w-3 inline" /> {Number(center.balance).toLocaleString()} so'm
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 h-9 hover:bg-gray-100 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {admin?.full_name?.charAt(0) || 'A'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{admin?.full_name || 'Admin'}</p>
                  <p className="text-xs text-gray-500 leading-tight">{admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 rounded-xl shadow-xl">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{admin?.full_name || 'Admin'}</p>
                <p className="text-xs text-gray-500">{admin?.phone_number || ''}</p>
              </div>
              <DropdownMenuItem onClick={() => router.push('/me')} className="text-gray-700">
                <User className="h-4 w-4 mr-2" /> Profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="text-red-600">
                <LogOutIcon className="h-4 w-4 mr-2" /> {isLoggingOut ? 'Chiqilmoqda...' : 'Chiqish'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
