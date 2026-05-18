import { Home, GraduationCap, Users, UsersRound, BookOpen, BarChart3, Layers, PenSquare, ClipboardList, Languages, Bell, Clock, User, LogOut, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search, Plus, Eye, Pencil, Trash2, X, AlertCircle, CheckCircle, Server, ShieldCheck, TrendingUp, TrendingDown, Phone, Lock, Mail, ImageIcon, UserPlus, Sparkles, Type as type, LucideIcon } from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  HomeIcon: Home,
  AcademicCapIcon: GraduationCap,
  UserGroupIcon: Users,
  UsersIcon: UsersRound,
  BookOpenIcon: BookOpen,
  ChartBarIcon: BarChart3,
  RectangleStackIcon: Layers,
  PencilSquareIcon: PenSquare,
  ClipboardDocumentListIcon: ClipboardList,
  LanguageIcon: Languages,
  BellIcon: Bell,
  ClockIcon: Clock,
  UserIcon: User,
  ArrowRightOnRectangleIcon: LogOut,
  ChevronLeftIcon: ChevronLeft,
  ChevronRightIcon: ChevronRight,
  ChevronUpIcon: ChevronUp,
  ChevronDownIcon: ChevronDown,
  MagnifyingGlassIcon: Search,
  PlusIcon: Plus,
  EyeIcon: Eye,
  TrashIcon: Trash2,
  XMarkIcon: X,
  ExclamationTriangleIcon: AlertCircle,
  CheckCircleIcon: CheckCircle,
  ServerIcon: Server,
  ShieldCheckIcon: ShieldCheck,
  ArrowTrendingUpIcon: TrendingUp,
  ArrowTrendingDownIcon: TrendingDown,
  ArrowUpIcon: TrendingUp,
  ArrowDownIcon: TrendingDown,
  PhoneIcon: Phone,
  LockClosedIcon: Lock,
  EnvelopeIcon: Mail,
  PhotoIcon: ImageIcon,
  UserPlusIcon: UserPlus,
  SparklesIcon: Sparkles,
  PencilIcon: Pencil,
};

export default function Icon({ name, size = 24, className = '' }: IconProps) {
  const IconComponent = iconMap[name] || Home;
  return <IconComponent size={size} className={className} />;
}
