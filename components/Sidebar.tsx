'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, ChevronRight, Home, Users, UserCircle, BookOpen,
  ChartBar, Layers, FileText, MessageSquare, Cog, ChartPie, Bell,
  Mail, ChevronDown, Camera, LogOut, Settings, User, X, Loader2,
  Sparkles, GraduationCap, School, BookMarked, Library, BadgeCheck,
  BarChart3, Calendar, Clock, Phone, Mail as MailIcon, Globe, MapPin,
  Award, Target, TrendingUp, Activity, Zap, Heart, Star, Moon, Sun,
  Newspaper, Camera as CameraIcon, Building2, Wallet, Link as LinkIcon,
} from 'lucide-react';
import { studentsApi } from '../api/studentApi';
import toast from 'react-hot-toast';

interface SidebarProps {
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  isMobile: boolean;
  userId?: string;
  onLogout?: () => void;
}

interface NavigationItem {
  label: string;
  path?: string;
  icon: keyof typeof iconMap;
  badge?: number;
  badgeColor?: 'blue' | 'red' | 'green' | 'yellow' | 'purple';
  children?: NavigationItem[];
  highlight?: boolean;
}

// Extend iconMap with Newspaper and Camera
const iconMap = {
  HomeIcon: Home,
  AcademicCapIcon: GraduationCap,
  UserGroupIcon: Users,
  UsersIcon: UserCircle,
  BookOpenIcon: BookOpen,
  ChartBarIcon: ChartBar,
  RectangleStackIcon: Layers,
  PencilSquareIcon: FileText,
  ClipboardDocumentListIcon: FileText,
  LanguageIcon: Library,
  ChatBubbleLeftRightIcon: MessageSquare,
  ChartPieIcon: ChartPie,
  Cog6ToothIcon: Cog,
  SparklesIcon: Sparkles,
  SchoolIcon: School,
  BookMarkedIcon: BookMarked,
  BadgeCheckIcon: BadgeCheck,
  BarChart3Icon: BarChart3,
  CalendarIcon: Calendar,
  ClockIcon: Clock,
  PhoneIcon: Phone,
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
};

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'HomeIcon',
    badge: 0,
  },
  {
    label: 'Studentlar',
    path: '/students',
    icon: 'AcademicCapIcon',
    badge: 0,
  },
  {
    label: "O'qituvchilar",
    path: '/teachers',
    icon: 'UserGroupIcon',
    badge: 0,
  },
  {
    label: 'Ota-onalar',
    path: '/parents',
    icon: 'HeartIcon',
    badge: 0,
  },
  {
    label: 'Guruhlar',
    path: '/groups',
    icon: 'UsersIcon',
    badge: 0,
  },
  {
    label: 'Xonalar',
    path: '/rooms',
    icon: 'Building2Icon',
    badge: 0,
  },
  {
    label: "To'lovlar",
    path: '/payments',
    icon: 'WalletIcon',
    badge: 0,
  },
  {
    label: 'CRM',
    icon: 'LinkIcon',
    badge: 0,
    children: [
      { label: 'Leadlar', path: '/leads', icon: 'UsersIcon' },
      { label: 'Call Center', path: '/leads/call-center', icon: 'PhoneIcon' },
      { label: 'Probniy darslar', path: '/leads/trial', icon: 'SparklesIcon' },
      { label: 'Manbalar', path: '/leads/sources', icon: 'LinkIcon' },
    ],
  },
  {
    label: 'Darslar',
    icon: 'BookOpenIcon',
    badge: 0,
    children: [
      { label: 'Darajalar', path: '/lesson/levels', icon: 'ChartBarIcon' },
      { label: 'Bo\'limlar', path: '/lesson/units', icon: 'RectangleStackIcon' },
    ],
  },
  {
    label: 'Yangiliklar',
    path: '/news',
    icon: 'NewspaperIcon',
    badge: 0,
  },
  {
    label: 'Hikoyalar',
    path: '/stories',
    icon: 'CameraIcon',
    badge: 0,
  },
  {
    label: 'Xabarlar',
    path: '/messages',
    icon: 'ChatBubbleLeftRightIcon',
    badge: 0,
  },
  {
    label: 'Hisobotlar',
    path: '/reports',
    icon: 'ChartPieIcon',
    badge: 0,
  },
  {
    label: 'Analitika',
    path: '/analytics',
    icon: 'BarChart3Icon',
    badge: 0,
    highlight: true,
  },
  {
    label: 'Sozlamalar',
    path: '/settings',
    icon: 'Cog6ToothIcon',
    badge: 0,
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

export default function Sidebar({
  isCollapsed = false,
  onCollapsedChange,
  isMobile,
  userId,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [expandedItems, setExpandedItems] = useState<string[]>(['CRM', 'Darslar']);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Dark mode detection (kept for compatibility, but we'll force light blue theme)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      setIsDark(savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches));
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchStudent = async () => {
      try {
        setLoadingProfile(true);
        setProfileError(null);
        const data = await studentsApi.getById(userId);
        setStudent(data);
      } catch (err: any) {
        // Student topilmasa - bu admin bo'lishi mumkin, xatolik ko'rsatilmaydi
        setStudent(null);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchStudent();
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

  const toggleExpand = (label: string) => {
    if (collapsed) {
      setCollapsed(false);
      onCollapsedChange?.(false);
      setTimeout(() => {
        setExpandedItems((prev) =>
          prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
        );
      }, 300);
    } else {
      setExpandedItems((prev) =>
        prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
      );
    }
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
    if (userId) {
      router.push(`/students/${userId}`);
    }
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
      localStorage.removeItem('token');
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
    const formData = new FormData();
    formData.append('photo', selectedFile);
    try {
      setUploadingPhoto(true);
      await studentsApi.update(userId, formData);
      toast.success('Rasm muvaffaqiyatli yangilandi');
      const updated = await studentsApi.getById(userId);
      setStudent(updated);
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
      return (
        <img
          src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${student.photo}`}
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

  // Mobile bottom navigation
  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-blue-700 text-white border-t border-blue-500">
        <div className="flex items-center justify-around h-16 px-2">
          {navigationItems.slice(0, 5).map((item) => {
            const isActive = isItemActive(item);
            return (
              <Link
                key={item.label}
                href={item.path || '#'}
                className={cn(
                  'relative flex flex-col items-center justify-center flex-1 h-full transition-colors',
                  isActive ? 'text-white bg-blue-800' : 'text-blue-100 hover:bg-blue-600'
                )}
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
        </div>
      </nav>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-50 transition-all duration-300 ease-in-out overflow-hidden',
        collapsed ? 'w-20' : 'w-64',
        'bg-blue-700 dark:bg-blue-950 text-white' // solid blue background, white text
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
              <div className="w-12 h-12 rounded-xl  flex items-center justify-center">
                <img src="/logo.jpg" className='rounded-2xl' />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-lg leading-tight flex items-center gap-1">
                  ILMIFY
                  <BadgeCheck className="w-4 h-4 text-blue-200" />
                </span>
                <span className="text-xs text-blue-200 leading-tight">
                  Education Platform
                </span>
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-md mx-auto">
              <School className="w-7 h-7 text-white" />
            </div>
          )}
          
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent">
          <ul className="space-y-2 px-3">
            {navigationItems.map((item) => {
              const isActive = isItemActive(item);
              const isExpanded = expandedItems.includes(item.label);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <li key={item.label}>
                  {hasChildren ? (
                    <>
                      <button
                        onClick={() => toggleExpand(item.label)}
                        className={cn(
                          'flex items-center justify-between w-full h-11 px-3 rounded-xl',
                          isActive ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-600'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('p-2 rounded-lg', isActive ? 'bg-blue-700' : 'bg-blue-600')}>
                            {getIconComponent(item.icon)}
                          </div>
                          {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                        </div>
                        {!collapsed && (
                          <ChevronRight className={cn('w-4 h-4 text-blue-200 transition-transform', isExpanded ? 'rotate-90' : '')} />
                        )}
                      </button>
                      {!collapsed && isExpanded && (
                        <ul className="mt-1 ml-4 space-y-0.5">
                          {item.children?.map((child) => {
                            const isChildActive = pathname === child.path;
                            return (
                              <li key={child.path}>
                                <Link
                                  href={child.path || '#'}
                                  className={cn(
                                    'flex items-center h-9 px-3 rounded-lg',
                                    isChildActive ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-600'
                                  )}
                                >
                                  <div className={cn('p-1.5 rounded-md mr-3', isChildActive ? 'bg-blue-700' : 'bg-blue-600')}>
                                    {getIconComponent(child.icon, 'w-4 h-4')}
                                  </div>
                                  <span className="font-medium text-sm">{child.label}</span>
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
                        'flex items-center h-11 px-3 rounded-xl',
                        isActive ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-600'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', isActive ? 'bg-blue-700' : 'bg-blue-600')}>
                          {getIconComponent(item.icon)}
                        </div>
                        {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                      </div>
                      {item.highlight && !collapsed && (
                        <div className="ml-auto flex items-center gap-1">
                          <Zap className="w-3 h-3 text-yellow-300" />
                          <span className="text-xs text-yellow-200 font-medium">Yangi</span>
                        </div>
                      )}
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
                  href={`/students/${userId}`}
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
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-blue-100 hover:bg-blue-700 transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  <span>Sozlamalar</span>
                </Link>
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
        <div className="p-4 border-t border-blue-500">
          <button
            onClick={handleCollapse}
            className="group flex items-center justify-center w-full h-12 rounded-xl bg-blue-600 border border-blue-400 text-white hover:bg-blue-500 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 mr-2" />
                <span className="font-medium text-sm">Collapse</span>
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