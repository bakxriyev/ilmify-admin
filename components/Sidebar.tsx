'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, ChevronRight, Home, Users, UserCircle,
  FileText, MessageSquare, Cog, ChartPie, Bell,
  Mail, ChevronDown, Camera, LogOut, Settings, User, X, Loader2,
  Sparkles, GraduationCap, School, BookMarked, Library, BadgeCheck,
  BarChart3, Calendar, Clock, Phone, Mail as MailIcon, Globe, MapPin,
  Award, Target, TrendingUp, Activity, Zap, Heart, Star, Moon, Sun,
  Newspaper, Camera as CameraIcon, Building2, Wallet, Link as LinkIcon,
  PhoneIcon, Bot, PrinterIcon, ReceiptIcon,
  SparklesIcon, CheckCircle, AlertCircle,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { educationCentersApi, type EducationCenter } from '../api/educationCentersApi';
import toast from 'react-hot-toast';

interface SidebarProps {
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  isMobile: boolean;
  userId?: string;
  onLogout?: () => void;
  adminRole?: string;
  permissions?: Record<string, boolean> | null;
}

interface NavigationItem {
  label: string;
  path?: string;
  icon: keyof typeof iconMap;
  badge?: number;
  badgeColor?: 'blue' | 'red' | 'green' | 'yellow' | 'purple';
  children?: NavigationItem[];
  highlight?: boolean;
  permKey?: string;
  roleRequired?: 'director';
}

// Extend iconMap with Newspaper and Camera
const iconMap = {
  HomeIcon: Home,
  UserGroupIcon: Users,
  AcademicCapIcon: GraduationCap,
  UsersIcon: UserCircle,
  PencilSquareIcon: FileText,
  ClipboardDocumentListIcon: FileText,
  LanguageIcon: Library,
  ChatBubbleLeftRightIcon: MessageSquare,
  MessageSquareIcon: MessageSquare,
  BellIcon: Bell,
  ChartPieIcon: ChartPie,
  Cog6ToothIcon: Cog,
  SchoolIcon: School,
  BookMarkedIcon: BookMarked,
  BadgeCheckIcon: BadgeCheck,
  BarChart3Icon: BarChart3,
  CalendarIcon: Calendar,
  ClockIcon: Clock,
  MailIcon: MailIcon,
  GlobeIcon: Globe,
  MapPinIcon: MapPin,
  AwardIcon: Award,
  TargetIcon: Target,
  TrendingUpIcon: TrendingUp,
  ActivityIcon: Activity,
  ZapIcon: Zap,
  HeartIcon: Heart,
  StarIcon: Star,
  MoonIcon: Moon,
  SunIcon: Sun,
  NewspaperIcon: Newspaper,   // for News
  CameraIcon: Camera,         // for Stories
  Building2Icon: Building2,   // for Rooms
  WalletIcon: Wallet,         // for Payments
  LinkIcon: LinkIcon,         // for Lead Sources
  SparklesIcon: Sparkles,     // for Trial Lessons
  PhoneIcon: Phone,           // for Call Center
  BotIcon: Bot,               // for Telegram Bot
  AutoBellIcon: Bell,         // for Auto Notification
  ClipboardCheckIcon: CheckCircle, // for Attendance
  PrinterIcon: PrinterIcon,        // for Printer settings
  ReceiptIcon: ReceiptIcon,        // for Receipt history
  AlertCircle: AlertCircle,        // for Suspicious
};

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'HomeIcon',
    badge: 0,
    permKey: 'dashboard',
  },
  {
    label: 'Studentlar',
    icon: 'AcademicCapIcon',
    badge: 0,
    permKey: 'students',
    children: [
      { label: 'Barcha studentlar', path: '/students', icon: 'UsersIcon', permKey: 'students' },
      { label: 'Shubhali studentlar', path: '/students/suspicious', icon: 'AlertCircle', permKey: 'students', highlight: true },
    ],
  },
  {
    label: "O'qituvchilar",
    path: '/teachers',
    icon: 'UserGroupIcon',
    badge: 0,
    permKey: 'teachers',
  },
  {
    label: 'Ota-onalar',
    path: '/parents',
    icon: 'HeartIcon',
    badge: 0,
    permKey: 'parents',
  },
  {
    label: 'Guruhlar',
    path: '/groups',
    icon: 'UsersIcon',
    badge: 0,
    permKey: 'groups',
  },
  {
    label: 'Davomat',
    path: '/attendance',
    icon: 'ClipboardCheckIcon',
    badge: 0,
    permKey: 'attendance',
  },
  {
    label: "O'qituvchi davomati",
    path: '/teacher-attendance/locations',
    icon: 'UserGroupIcon',
    badge: 0,
    permKey: 'attendance',
    children: [
      { label: 'Markaz lokatsiyasi', path: '/teacher-attendance/locations', icon: 'MapPinIcon', permKey: 'attendance' },
      { label: 'Davomat yozuvlari', path: '/teacher-attendance/records', icon: 'ClipboardCheckIcon', permKey: 'attendance' },
    ],
  },
  {
    label: 'Xonalar',
    path: '/rooms',
    icon: 'Building2Icon',
    badge: 0,
    permKey: 'rooms',
  },
  {
    label: "To'lovlar",
    icon: 'WalletIcon',
    badge: 0,
    permKey: 'payments',
    children: [
      { label: "To'lovlar", path: '/payments', icon: 'WalletIcon', permKey: 'payments' },
      { label: 'Bugungi to\'lovlar', path: '/payments/today', icon: 'CalendarIcon', permKey: 'payments' },
      { label: "Chek ma'lumotlari", path: '/payments/settings', icon: 'Building2Icon', permKey: 'payments' },
      { label: 'Cheklar tarixi', path: '/payments/receipts', icon: 'ReceiptIcon', permKey: 'payments' },
    ],
  },
  {
    label: 'CRM',
    icon: 'LinkIcon',
    badge: 0,
    permKey: 'crm',
    children: [
      { label: 'Leadlar', path: '/leads', icon: 'UsersIcon', permKey: 'crm' },
      { label: 'Call Center', path: '/leads/call-center', icon: 'PhoneIcon', permKey: 'crm' },
      { label: 'Probniy darslar', path: '/leads/trial', icon: 'SparklesIcon', permKey: 'crm' },
      { label: 'Manbalar', path: '/leads/sources', icon: 'LinkIcon', permKey: 'crm' },
    ],
  },
  {
    label: 'Bildirishnomalar',
    icon: 'BellIcon',
    permKey: 'notifications',
    children: [
      { label: 'Bildirishnomalar', path: '/notifications', icon: 'BellIcon', permKey: 'notifications' },
      { label: 'Avto bildirishnoma', path: '/auto-notification', icon: 'AutoBellIcon', permKey: 'notifications', highlight: true },
      { label: 'SMS xabarnoma', path: '/sms', icon: 'MessageSquareIcon', permKey: 'notifications' },
    ],
  },
  {
    label: 'Telegram Bot',
    icon: 'BotIcon',
    permKey: 'telegram',
    children: [
      { label: 'Bot ulash', path: '/telegram-bot', icon: 'BotIcon', permKey: 'telegram' },
      { label: 'Foydalanuvchilar', path: '/telegram-bot/users', icon: 'UsersIcon', permKey: 'telegram' },
      { label: 'Xabar yuborish', path: '/telegram-bot/send', icon: 'MailIcon', permKey: 'telegram' },
      { label: 'Shablonlar', path: '/telegram-bot/templates', icon: 'PencilSquareIcon', permKey: 'telegram' },
      { label: 'Xabarlar', path: '/telegram-bot/inbox', icon: 'ChatBubbleLeftRightIcon', permKey: 'telegram' },
      { label: 'Tarix', path: '/telegram-bot/history', icon: 'ClockIcon', permKey: 'telegram' },
    ],
  },
  {
    label: 'Hisobotlar',
    path: '/reports',
    icon: 'BarChart3Icon',
    badge: 0,
    permKey: 'reports',
  },
  {
    label: 'Adminlar',
    path: '/admins',
    icon: 'UsersIcon',
    badge: 0,
    permKey: 'admins',
  },
  {
    label: 'Monitoring',
    path: '/monitoring',
    icon: 'ActivityIcon',
    badge: 0,
    permKey: 'monitoring',
  },
];

const getBadgeColor = (color?: string) => {
  switch (color) {
    case 'blue': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50';
    case 'red': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-800/50';
    case 'green': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200/50 dark:border-green-800/50';
    case 'yellow': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-800/50';
    case 'purple': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/50';
    default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200/50 dark:border-gray-800/50';
  }
};

const CENTER_LOGO_CACHE: Record<string, { name: string; logo: string | null }> = {};

export default function Sidebar({
  isCollapsed = false,
  onCollapsedChange,
  isMobile,
  userId,
  onLogout,
  adminRole,
  permissions,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [centerInfo, setCenterInfo] = useState<{ name: string; logo: string | null } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Dark mode detection (kept for compatibility, but we'll force light blue theme)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      setIsDark(savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches));
    }
  }, []);

  // Center info ni yuklash (admin localStorage dan; agar yo'q bo'lsa API orqali)
  useEffect(() => {
    const loadCenter = async () => {
      try {
        const adminRaw = localStorage.getItem('admin');
        if (!adminRaw) return;
        const adminData = JSON.parse(adminRaw);
        const cacheKey = `center_${adminData.center_id || 'none'}`;

        if (adminData.center) {
          setCenterInfo({ name: adminData.center.name, logo: adminData.center.logo });
          CENTER_LOGO_CACHE[cacheKey] = { name: adminData.center.name, logo: adminData.center.logo };
          return;
        }
        if (adminData.center_id) {
          if (CENTER_LOGO_CACHE[cacheKey]) {
            setCenterInfo(CENTER_LOGO_CACHE[cacheKey]);
            return;
          }
          const c = await educationCentersApi.getById(adminData.center_id);
          if (c) {
            const info = { name: c.name, logo: c.logo };
            CENTER_LOGO_CACHE[cacheKey] = info;
            setCenterInfo(info);
          }
        }
      } catch {}
    };
    loadCenter();
  }, []);

  useEffect(() => {
    const adminRaw = localStorage.getItem('admin');
    if (adminRaw) {
      try {
        const adminData = JSON.parse(adminRaw);
        setStudent({
          id: adminData.id,
          first_name: adminData.full_name?.split(' ')[0] || 'Admin',
          last_name: adminData.full_name?.split(' ').slice(1).join(' ') || '',
          email: adminData.email || '',
          photo: adminData.photo || null,
          phone_number: adminData.phone_number || '',
        });
      } catch {}
    }
    setLoadingProfile(false);
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Auto-expand parent items when a child route is active
  useEffect(() => {
    if (collapsed) return;
    const activeParents = navigationItems
      .filter(item => item.children?.some(child => child.path && (pathname === child.path || pathname.startsWith(child.path + '/'))))
      .map(item => item.label);
    if (activeParents.length > 0) {
      setExpandedItems(prev => {
        const needed = activeParents.filter(p => !prev.includes(p));
        if (needed.length === 0) return prev;
        return [...prev, ...needed];
      });
    }
  }, [pathname, collapsed]);

  useEffect(() => {
    if (isMobile && !collapsed) {
      const newCollapsed = true;
      setCollapsed(newCollapsed);
      onCollapsedChange?.(newCollapsed);
    }
  }, [isMobile, collapsed, onCollapsedChange]);

  const handleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
    if (newCollapsed) {
      setExpandedItems([]);
      setDropdownOpen(false);
    }
  };

  const toggleExpand = (label: string, children?: NavigationItem[]) => {
    if (collapsed) {
      if (children && children.length > 0 && children[0].path) {
        router.push(children[0].path);
      }
      return;
    }
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const isItemActive = (item: NavigationItem): boolean => {
    if (item.path) return pathname === item.path;
    if (item.children) {
      return item.children.some((child) => pathname === child.path);
    }
    return false;
  };

  const getIconComponent = (iconName: keyof typeof iconMap, className?: string) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className={cn("w-5 h-5", className)} /> : null;
  };

  const handleProfileClick = () => {
    router.push('/me');
  };

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen((prev) => !prev);
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      ['access_token', 'refresh_token', 'admin', 'teacher'].forEach(k => localStorage.removeItem(k));
      router.push('/login');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile || !userId) return;
    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('photo', selectedFile);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${baseUrl}/admin/${userId}/photo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Rasm yuklanmadi');
      const updatedAdmin = await res.json();
      localStorage.setItem('admin', JSON.stringify(updatedAdmin));
      setStudent({
        id: updatedAdmin.id,
        first_name: updatedAdmin.full_name?.split(' ')[0] || 'Admin',
        last_name: updatedAdmin.full_name?.split(' ').slice(1).join(' ') || '',
        email: updatedAdmin.email || '',
        photo: updatedAdmin.photo || null,
        phone_number: updatedAdmin.phone_number || '',
      });
      toast.success('Rasm muvaffaqiyatli yangilandi');
      setPhotoModalOpen(false);
      setSelectedFile(null);
    } catch (err: any) {
      toast.error(err.message || 'Rasmni yangilashda xatolik');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const renderAvatar = (size: 'sm' | 'md' = 'md') => {
    const dimensions = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
    if (loadingProfile) {
      return <div className={cn(dimensions, 'rounded-full bg-blue-300 shimmer')} />;
    }
    if (student?.photo) {
      const photoSrc = student.photo.startsWith('data:')
        ? student.photo
        : `${process.env.NEXT_PUBLIC_API_URL}/uploads/${student.photo}`;
      return (
        <img
          src={photoSrc}
          alt={student.first_name}
          className={cn(dimensions, 'rounded-full object-cover ring-2 ring-white shadow-lg')}
        />
      );
    }
    const initials = student
      ? `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`
      : 'U';
    return (
      <div
        className={cn(
          dimensions,
          'rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg'
        )}
      >
        {initials}
      </div>
    );
  };

  // Sidebarni permission asosida filtrla — localStorage'dan sinxron o'qiymiz
  const getLocalPerms = () => {
    if (typeof window === 'undefined') return { role: undefined as string | undefined, perms: null as Record<string, boolean> | null };
    try {
      const raw = localStorage.getItem('admin');
      if (!raw) return { role: undefined, perms: null };
      const d = JSON.parse(raw);
      return { role: d.role, perms: d.permissions || null };
    } catch { return { role: undefined, perms: null }; }
  };
  const localData = getLocalPerms();
  const effectiveRole = adminRole || localData.role;
  const effectivePerms = permissions !== undefined ? permissions : localData.perms;

  // Hydration error kelmasligi uchun: serverda hamma itemlarni ko'rsat,
  // mount bo'lgandan keyin permission asosida filtrla
  const visibleItems = !mounted
    ? navigationItems
    : navigationItems.filter(item => {
        if (effectiveRole === 'director') return true;
        if (!item.permKey || !effectivePerms) return true;
        return effectivePerms[item.permKey] === true;
      });

  // Priority labels for mobile: always show these + "..." for rest
  const priorityLabels = ['Dashboard', 'Studentlar', "O'qituvchilar", 'Davomat', "O'qituvchi davomati", "To'lovlar"];
  const priorityItems = visibleItems.filter(item => priorityLabels.includes(item.label));
  const restItems = visibleItems.filter(item => !priorityLabels.includes(item.label));

  // Mobile bottom navigation
  if (isMobile) {
    return (
      <>
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-blue-700 text-white border-t border-blue-500">
          <div className="flex items-center justify-around h-16 px-2">
            {priorityItems.map((item) => {
              const isActive = isItemActive(item);
              const linkPath = item.path || (item.children && item.children.length > 0 ? item.children[0].path : '#');
              return (
                <Link
                  key={item.label}
                  href={linkPath || '#'}
                  className={cn(
                    'relative flex flex-col items-center justify-center flex-1 h-full transition-colors',
                    isActive ? 'text-white bg-blue-800' : 'text-blue-100 hover:bg-blue-600'
                  )}
                  onClick={() => setShowMoreMenu(false)}
                >
                  <div className="relative p-1">
                    {getIconComponent(item.icon, cn('w-5 h-5'))}
                    {item.badge! > 0 && (
                      <span className={cn(
                        "absolute -top-1 -right-1 min-w-4 h-4 px-1 text-[10px] font-bold rounded-full flex items-center justify-center bg-white text-blue-800 border border-blue-400"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium mt-1">{item.label}</span>
                </Link>
              );
            })}
            {/* More button */}
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 h-full transition-colors',
                showMoreMenu ? 'text-white bg-blue-800' : 'text-blue-100 hover:bg-blue-600'
              )}
            >
              <div className="relative p-1">
                <div className="flex items-center justify-center w-5 h-5">
                  <span className="text-lg font-bold leading-none">...</span>
                </div>
              </div>
              <span className="text-[10px] font-medium mt-1">Yana</span>
            </button>
          </div>
        </nav>

        {/* More menu overlay */}
        {showMoreMenu && (
          <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)}>
            <div
              className="fixed bottom-16 left-2 right-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 max-h-[60vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="grid grid-cols-4 gap-2">
                {restItems.map(item => {
                  const isActive = isItemActive(item);
                  const hasChildren = item.children && item.children.length > 0;
                  if (hasChildren) {
                    return (
                      <div key={item.label} className="col-span-4 mb-1">
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 px-1">{item.label}</div>
                        <div className="grid grid-cols-4 gap-2">
                          {item.children!.map(child => {
                            const isChildActive = pathname === child.path;
                            return (
                              <Link
                                key={child.path}
                                href={child.path || '#'}
                                onClick={() => setShowMoreMenu(false)}
                                className={cn(
                                  'flex flex-col items-center gap-1 p-2 rounded-xl transition-colors',
                                  isChildActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                )}
                              >
                                <div className={cn('p-2 rounded-lg', isChildActive ? 'bg-blue-100' : 'bg-gray-100')}>
                                  {getIconComponent(child.icon, 'w-5 h-5')}
                                </div>
                                <span className="text-[9px] font-medium text-center leading-tight">{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={item.label}
                      href={item.path || '#'}
                      onClick={() => setShowMoreMenu(false)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-xl transition-colors',
                        isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <div className={cn('p-2 rounded-lg', isActive ? 'bg-blue-100' : 'bg-gray-100')}>
                        {getIconComponent(item.icon, 'w-5 h-5')}
                      </div>
                      <span className="text-[9px] font-medium text-center leading-tight">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-50 transition-[width] duration-200 ease-out overflow-hidden shadow-xl shadow-blue-900/20',
        collapsed ? 'w-20' : 'w-64',
        'bg-blue-700 text-white' // solid blue background, white text
      )}
    >
      <div className="flex flex-col h-full relative">
        {/* Logo Section */}
        <div
          className={cn(
            'flex items-center border-b border-blue-500 px-4 transition-all',
            collapsed ? 'justify-center h-20' : 'justify-between h-20'
          )}
        >
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center overflow-hidden bg-blue-600 shrink-0">
                {centerInfo?.logo ? (
                  <img src={`${process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz'}/uploads/centers/${centerInfo.logo}`}
                    className="w-full h-full object-cover" alt={centerInfo.name} />
                ) : (
                  <School className="w-5 h-5 md:w-7 md:h-7 text-white" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white text-sm leading-tight max-w-[130px] truncate">
                  {centerInfo?.name || "ILMIFY"}
                </span>
                <span className="text-[10px] text-blue-200 leading-tight">
                  {centerInfo ? "O'quv markazi" : "Education Platform"}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md mx-auto overflow-hidden">
              {centerInfo?.logo ? (
                <img src={`${process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz'}/uploads/centers/${centerInfo.logo}`}
                  className="w-full h-full object-cover" alt={centerInfo.name} />
              ) : (
                <School className="w-5 h-5 text-white" />
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent">
          <ul className="space-y-1 px-2">
            {visibleItems.map((item) => {
              const isActive = isItemActive(item);
              const isExpanded = expandedItems.includes(item.label);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <li key={item.label}>
                  {hasChildren ? (
                    <>
                      <button
                        onClick={() => toggleExpand(item.label, item.children)}
                        className={cn(
                          'flex items-center justify-between w-full h-10 px-3 rounded-lg transition-colors duration-150',
                          isActive ? 'bg-white/15 text-white' : 'text-blue-100 hover:bg-white/10'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center shrink-0">
                            {getIconComponent(item.icon)}
                          </div>
                          {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                        </div>
                        {!collapsed && (
                          <ChevronRight className={cn('w-3.5 h-3.5 text-blue-300 transition-transform duration-150', isExpanded ? 'rotate-90' : '')} />
                        )}
                      </button>
                      {!collapsed && isExpanded && (
                        <ul className="mt-0.5 ml-3 space-y-0.5 border-l border-white/10 pl-2">
                          {item.children?.map((child) => {
                            const isChildActive = pathname === child.path;
                            return (
                              <li key={child.path}>
                                <Link
                                  href={child.path || '#'}
                                  className={cn(
                                    'flex items-center h-8 px-3 rounded-lg transition-colors duration-150 text-sm',
                                    isChildActive ? 'bg-white/15 text-white font-medium' : 'text-blue-200 hover:bg-white/10 hover:text-white'
                                  )}
                                >
                                  <div className="w-5 h-5 flex items-center justify-center mr-2 shrink-0">
                                    {getIconComponent(child.icon, 'w-3.5 h-3.5')}
                                  </div>
                                  <span>{child.label}</span>
                                  {child.highlight && (
                                    <span className="ml-auto text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-full">Yangi</span>
                                  )}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.path || '#'}
                      className={cn(
                        'flex items-center h-10 px-3 rounded-lg transition-colors duration-150',
                        isActive ? 'bg-white/15 text-white' : 'text-blue-100 hover:bg-white/10'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center shrink-0">
                          {getIconComponent(item.icon)}
                        </div>
                        {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                      </div>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Profile Section */}
        {userId && (
          <div className="p-4 border-t border-blue-500">
            <div
              ref={profileRef}
              className={cn(
                'relative flex items-center gap-3 p-2 rounded-xl transition-colors cursor-pointer group',
                collapsed ? 'justify-center' : 'justify-between',
                dropdownOpen ? 'bg-blue-800' : 'hover:bg-blue-600'
              )}
              onClick={handleProfileClick}
            >
              <div className="flex items-center gap-3 min-w-0">
                {renderAvatar(collapsed ? 'sm' : 'md')}
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    {loadingProfile ? (
                      <>
                        <div className="h-4 w-20 bg-blue-500 rounded shimmer mb-1"></div>
                        <div className="h-3 w-16 bg-blue-500 rounded shimmer"></div>
                      </>
                    ) : student ? (
                      <>
                        <p className="text-sm font-medium text-white truncate flex items-center gap-1">
                          {student.first_name} {student.last_name}
                          <BadgeCheck className="w-3 h-3 text-blue-200" />
                        </p>
                        <p className="text-xs text-blue-200 truncate flex items-center gap-1">
                          <MailIcon className="w-3 h-3" />
                          {student.email || 'Email yo\'q'}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-red-300">Yuklashda xatolik</p>
                    )}
                  </div>
                )}
              </div>
              {!collapsed && !loadingProfile && student && (
                <button
                  onClick={handleDropdownToggle}
                  className="p-1 rounded-full hover:bg-blue-500 transition"
                >
                  <ChevronDown className={cn("w-4 h-4 text-blue-200 transition-transform", dropdownOpen && "rotate-180")} />
                </button>
              )}
              {collapsed && !loadingProfile && student && (
                <button
                  onClick={handleDropdownToggle}
                  className="absolute -right-1 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-blue-600 shadow-md border border-blue-400 hover:bg-blue-500 transition"
                >
                  <ChevronDown className={cn("w-3 h-3 text-white transition-transform", dropdownOpen && "rotate-180")} />
                </button>
              )}
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div
                ref={dropdownRef}
                className={cn(
                  'absolute z-50 mt-2 w-48 rounded-xl bg-blue-800 text-white shadow-xl border border-blue-500 py-2',
                  collapsed ? 'left-16 bottom-20' : 'left-4 right-4 bottom-20'
                )}
              >
                <div className="px-3 py-2 border-b border-blue-500 mb-1">
                  <p className="text-xs font-medium text-blue-200">Kirgan</p>
                  <p className="text-sm font-bold text-white truncate">{student?.first_name} {student?.last_name}</p>
                </div>
                <Link
                  href="/me"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-blue-100 hover:bg-blue-700 transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User className="w-4 h-4" />
                  <span>Mening profilim</span>
                </Link>
                <button
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-blue-100 hover:bg-blue-700 transition"
                  onClick={() => {
                    setDropdownOpen(false);
                    setPhotoModalOpen(true);
                  }}
                >
                  <Camera className="w-4 h-4" />
                  <span>Rasmni o'zgartirish</span>
                </button>
                <div className="border-t border-blue-500 my-1"></div>
                <button
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-200 hover:bg-blue-700 transition"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Chiqish</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Collapse Button */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleCollapse}
            className="flex items-center justify-center w-full h-10 rounded-lg bg-white/5 text-blue-200 hover:bg-white/10 hover:text-white transition-colors duration-150"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span className="font-medium text-xs">Yig'ish</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Photo Upload Modal (unchanged, but styled consistently) */}
      {photoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-500" />
                Change Profile Photo
              </h3>
              <button
                onClick={() => {
                  setPhotoModalOpen(false);
                  setSelectedFile(null);
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <Camera className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Click to select an image</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setPhotoModalOpen(false);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePhotoUpload}
                  disabled={!selectedFile || uploadingPhoto}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}