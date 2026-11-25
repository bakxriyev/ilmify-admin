import {
  LayoutGrid, GraduationCap, Users, UserRound, Heart, UsersRound, ClipboardCheck,
  MapPin, CalendarCheck, DoorOpen, Wallet, CalendarDays, Building2, Receipt,
  Link2, Phone, Sparkles, BookOpen, Bell, BellRing, MessageSquare, Bot, Send,
  FileText, MessagesSquare, History, BarChart3, BadgeDollarSign, ShieldCheck,
  Activity, AlertCircle, type LucideIcon,
} from 'lucide-react';

export interface NavLeaf {
  label: string;
  path: string;
  icon: LucideIcon;
  permKey?: string;
  badge?: 'new';
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path?: string;
  permKey?: string;
  roleRequired?: 'director';
  children?: NavLeaf[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Asosiy',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutGrid, permKey: 'dashboard' },
      {
        label: 'Studentlar', icon: GraduationCap, permKey: 'students',
        children: [
          { label: 'Barcha studentlar', path: '/students', icon: Users, permKey: 'students' },
          { label: 'Shubhali studentlar', path: '/students/suspicious', icon: AlertCircle, permKey: 'students', badge: 'new' },
        ],
      },
      { label: "O'qituvchilar", path: '/teachers', icon: UserRound, permKey: 'teachers' },
      { label: 'Ota-onalar', path: '/parents', icon: Heart, permKey: 'parents' },
      { label: 'Guruhlar', path: '/groups', icon: UsersRound, permKey: 'groups' },
    ],
  },
  {
    label: "O'quv jarayoni",
    items: [
      { label: 'Davomat', path: '/attendance', icon: ClipboardCheck, permKey: 'attendance' },
      {
        label: "O'qituvchi davomati", icon: CalendarCheck, permKey: 'attendance',
        children: [
          { label: 'Markaz lokatsiyasi', path: '/teacher-attendance/locations', icon: MapPin, permKey: 'attendance' },
          { label: 'Davomat yozuvlari', path: '/teacher-attendance/records', icon: ClipboardCheck, permKey: 'attendance' },
        ],
      },
      { label: 'Xonalar', path: '/rooms', icon: DoorOpen, permKey: 'rooms' },
    ],
  },
  {
    label: 'Moliya',
    items: [
      {
        label: "To'lovlar", icon: Wallet, permKey: 'payments',
        children: [
          { label: "To'lovlar", path: '/payments', icon: Wallet, permKey: 'payments' },
          { label: "Bugungi to'lovlar", path: '/payments/today', icon: CalendarDays, permKey: 'payments' },
          { label: "Chek ma'lumotlari", path: '/payments/settings', icon: Building2, permKey: 'payments' },
          { label: 'Cheklar tarixi', path: '/payments/receipts', icon: Receipt, permKey: 'payments' },
        ],
      },
      { label: 'Hisobotlar', path: '/reports', icon: BarChart3, permKey: 'reports' },
      { label: 'Ustoz oyliklari', path: '/teacher-salaries', icon: BadgeDollarSign, permKey: 'reports', roleRequired: 'director' },
    ],
  },
  {
    label: 'Aloqa',
    items: [
      {
        label: 'CRM', icon: Link2, permKey: 'crm',
        children: [
          { label: 'Leadlar', path: '/leads', icon: Users, permKey: 'crm' },
          { label: 'Call Center', path: '/leads/call-center', icon: Phone, permKey: 'crm' },
          { label: 'Probniy darslar', path: '/leads/trial', icon: Sparkles, permKey: 'crm' },
          { label: 'Kurslar', path: '/leads/courses', icon: BookOpen, permKey: 'crm' },
          { label: 'Manbalar', path: '/leads/sources', icon: Link2, permKey: 'crm' },
        ],
      },
      {
        label: 'Bildirishnomalar', icon: Bell, permKey: 'notifications',
        children: [
          { label: 'Bildirishnomalar', path: '/notifications', icon: Bell, permKey: 'notifications' },
          { label: 'Avto bildirishnoma', path: '/auto-notification', icon: BellRing, permKey: 'notifications', badge: 'new' },
          { label: 'SMS xabarnoma', path: '/sms', icon: MessageSquare, permKey: 'notifications' },
        ],
      },
      {
        label: 'Telegram Bot', icon: Bot, permKey: 'telegram',
        children: [
          { label: 'Bot ulash', path: '/telegram-bot', icon: Bot, permKey: 'telegram' },
          { label: 'Foydalanuvchilar', path: '/telegram-bot/users', icon: Users, permKey: 'telegram' },
          { label: 'Xabar yuborish', path: '/telegram-bot/send', icon: Send, permKey: 'telegram' },
          { label: 'Shablonlar', path: '/telegram-bot/templates', icon: FileText, permKey: 'telegram' },
          { label: 'Xabarlar', path: '/telegram-bot/inbox', icon: MessagesSquare, permKey: 'telegram' },
          { label: 'Tarix', path: '/telegram-bot/history', icon: History, permKey: 'telegram' },
        ],
      },
    ],
  },
  {
    label: 'Tizim',
    items: [
      { label: 'Adminlar', path: '/admins', icon: ShieldCheck, permKey: 'admins' },
      { label: 'Monitoring', path: '/monitoring', icon: Activity, permKey: 'monitoring' },
    ],
  },
];

/** Bottom tab bar on phones: four destinations plus "Yana". */
export const MOBILE_PRIMARY = ['Dashboard', 'Studentlar', 'Davomat', "To'lovlar"];

export function canSee(
  item: { permKey?: string; roleRequired?: 'director' },
  role: string | undefined,
  perms: Record<string, boolean> | null,
): boolean {
  if (item.roleRequired === 'director' && role !== 'director') return false;
  if (role === 'director') return true;
  if (!item.permKey || !perms) return true;
  return perms[item.permKey] === true;
}

export function filterSections(
  role: string | undefined,
  perms: Record<string, boolean> | null,
): NavSection[] {
  return NAV_SECTIONS
    .map((s) => ({
      ...s,
      items: s.items
        .filter((i) => canSee(i, role, perms))
        .map((i) => (i.children ? { ...i, children: i.children.filter((c) => canSee(c, role, perms)) } : i))
        .filter((i) => !i.children || i.children.length > 0),
    }))
    .filter((s) => s.items.length > 0);
}

export const itemHref = (item: NavItem) => item.path ?? item.children?.[0]?.path ?? '#';

const matches = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(path + '/');

/** Most specific leaf whose path prefixes the current pathname. */
export function findActive(pathname: string): { section?: NavSection; item?: NavItem; leaf?: NavLeaf } {
  let best: { section?: NavSection; item?: NavItem; leaf?: NavLeaf; len: number } = { len: -1 };
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.path && matches(pathname, item.path) && item.path.length > best.len) {
        best = { section, item, len: item.path.length };
      }
      for (const leaf of item.children ?? []) {
        if (matches(pathname, leaf.path) && leaf.path.length > best.len) {
          best = { section, item, leaf, len: leaf.path.length };
        }
      }
    }
  }
  return best;
}

/** Extra titles for routes that live outside the sidebar. */
export const EXTRA_TITLES: Array<[string, string]> = [
  ['/me', 'Mening profilim'],
  ['/stories', 'Storylar'],
  ['/news', 'Yangiliklar'],
  ['/lesson', 'Darajalar va darslar'],
];
