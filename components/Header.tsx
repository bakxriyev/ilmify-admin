'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Bell, Search, Settings, LogOut, User, Calendar, ChevronDown,
  Building, DollarSign, LogOut as LogOutIcon, X, ExternalLink, Clock, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { notificationApi } from '@/api/notificationApi';
import { useNotificationSocket } from '@/lib/useNotificationSocket';

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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [selectedNotif, setSelectedNotif] = useState<any>(null);

  useEffect(() => { setMounted(true); }, []);

  const fetchNotifs = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const adminRaw = localStorage.getItem('admin');
      if (!adminRaw) return;
      const admin = JSON.parse(adminRaw);
      const role = admin.role === 'super_admin' ? 'admin' : 'admin';
      const [notifRes, countRes] = await Promise.all([
        notificationApi.findUser(admin.id, role, 1, 10),
        notificationApi.unreadCount(admin.id, role),
      ]);
      setNotifications(notifRes.data.data || []);
      setUnreadCount(countRes.data || 0);
    } catch {}
  }, []);

  const addNotification = useCallback((data: any) => {
    setNotifications(prev => [{ ...data, is_read: false }, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      if (typeof window === 'undefined') return;
      const adminRaw = localStorage.getItem('admin');
      if (!adminRaw) return;
      const admin = JSON.parse(adminRaw);
      const role = admin.role === 'super_admin' ? 'admin' : 'admin';
      await notificationApi.markAllAsRead(admin.id, role);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  useNotificationSocket(addNotification);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const adminRaw = localStorage.getItem('admin');
      if (!adminRaw) return;
      const adminData = JSON.parse(adminRaw);
      if (!adminData?.full_name && !adminData?.role) return;
      setAdmin(adminData);
      if (adminData.center) {
        setCenter(adminData.center);
      } else if (adminData.center_id) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';
        const token = localStorage.getItem('access_token');
        fetch(`${baseUrl}/education-centers/${adminData.center_id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data) setCenter(data); })
          .catch(() => {});
      }
    } catch {}
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

  const openNotifDetail = (n: any) => {
    setSelectedNotif(n);
    setNotifOpen(false);
    if (!n.is_read) markAsRead(n.id);
  };

  const tariffStatus = (() => {
    if (!center) return null;
    const isTrial = !center.tariff_id;
    const endsAt: string | null | undefined = center.tariff_ends_at || center.trial_ends_at;
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const tariffName = isTrial ? 'BETA' : (center.tariff?.name || 'Tarif');
    return { tariffName, days, isExpired: days <= 0 };
  })();

  if (!mounted) return null;

  return (
    <header className="fixed top-0 right-0 left-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-6"
        style={{ marginLeft: !isMobile ? (sidebarCollapsed ? '80px' : '240px') : '0px' }}>
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right">
              <p className="text-xs sm:text-sm font-medium text-gray-900">{currentTime}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{currentDate}</p>
            </div>
          </div>
          {center && (
            <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-gray-200 min-w-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-blue-50 flex items-center justify-center shrink-0">
                {center.logo ? (
                  <img src={`${process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz'}/uploads/centers/${center.logo}`}
                    className="w-full h-full object-cover" alt={center.name} />
                ) : (
                  <Building className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none">{center.name}</p>
                {tariffStatus && (
                  <p className={`text-[10px] sm:text-xs font-medium leading-tight ${tariffStatus.isExpired ? 'text-red-500' : tariffStatus.days <= 5 ? 'text-amber-500' : 'text-green-500'}`}>
                    {tariffStatus.isExpired ? (
                      <><AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline mr-0.5" />{tariffStatus.tariffName}: muddat tugagan</>
                    ) : (
                      <>{tariffStatus.tariffName}: {tariffStatus.days} kun</>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen(!notifOpen); fetchNotifs(); }}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 text-sm">Bildirishnomalar</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        Hammasini o'qish
                      </button>
                    )}
                    <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <ScrollArea className="max-h-80">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      Bildirishnomalar mavjud emas
                    </div>
                  ) : (
                    notifications.map((n: any) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                        onClick={() => openNotifDetail(n)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.is_read ? 'bg-blue-500' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                              {n.title}
                            </p>
                            {n.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.description}</p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1">
                              {new Date(n.createdAt).toLocaleDateString('uz-UZ', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
                <div className="border-t border-gray-100 p-2">
                  <Link
                    href="/notifications"
                    className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-1.5 rounded-lg hover:bg-blue-50"
                    onClick={() => setNotifOpen(false)}
                  >
                    Barcha xabarlar !
                  </Link>
                </div>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 h-9 hover:bg-gray-100 rounded-lg">
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold">
                  {admin?.photo ? (
                    <img src={admin.photo.startsWith('data:') ? admin.photo : `${process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz'}/uploads/${admin.photo}`} className="w-full h-full object-cover" alt="" />
                  ) : (
                    admin?.full_name?.charAt(0) || 'A'
                  )}
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

      {/* Notification Detail Modal */}
      <Dialog open={!!selectedNotif} onOpenChange={(open) => { if (!open) setSelectedNotif(null); }}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg text-gray-900">
              {selectedNotif?.title || 'Bildirishnoma'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              {selectedNotif?.createdAt ? new Date(selectedNotif.createdAt).toLocaleDateString('uz-UZ', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {selectedNotif?.description || 'Tavsif mavjud emas'}
            </p>
          </div>
          <DialogFooter className="gap-2">
            {selectedNotif?.link && (
              <Button
                onClick={() => { setSelectedNotif(null); router.push(selectedNotif.link); }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" /> Ko'rish
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedNotif(null)}>
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
