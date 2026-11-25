'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell, Search, Sun, Moon, ExternalLink, AlertTriangle, School, UserRound, LogOut, CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { notificationApi } from '@/api/notificationApi';
import { useNotificationSocket } from '@/lib/useNotificationSocket';
import { EXTRA_TITLES, findActive } from './shell/nav';
import { centerLogoUrl, roleLabel, tariffStatus, type ShellAdmin, type ShellCenter } from './shell/useShellData';
import { Avatar } from './Sidebar';

interface HeaderProps {
  admin: ShellAdmin | null;
  center: ShellCenter | null;
  onSearch: () => void;
  onLogout: () => void;
}

const fmtDateTime = (d: string | number | Date, opts: Intl.DateTimeFormatOptions) => {
  try {
    return new Date(d).toLocaleString('uz-UZ', opts);
  } catch {
    return '';
  }
};

export function usePageTitle() {
  const pathname = usePathname();
  const { section, item, leaf } = findActive(pathname);
  if (leaf) return { section: section?.label, group: item?.label, title: leaf.label };
  if (item) return { section: section?.label, title: item.label };
  const extra = EXTRA_TITLES.find(([p]) => pathname === p || pathname.startsWith(p + '/'));
  return { title: extra?.[1] ?? 'Ilmify Edu' };
}

export default function Header({ admin, center, onSearch, onLogout }: HeaderProps) {
  const { section, group, title } = usePageTitle();
  const tariff = tariffStatus(center);
  const logo = centerLogoUrl(center?.logo);
  const crumb = group && group !== title ? group : section;

  return (
    <>
      {/* Desktop / tablet */}
      <header
        className="lg-chrome fixed top-3 right-3 z-30 hidden h-[60px] items-center gap-3 rounded-[20px] pl-5 pr-2.5 md:flex transition-[left] duration-[260ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ left: 'calc(var(--shell-rail) + 24px)' }}
      >
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-baseline gap-1.5 text-[16.5px] leading-none tracking-[-0.015em]">
            {crumb && (
              <>
                <span className="hidden shrink-0 font-medium text-[var(--muted-foreground)] lg:inline">{crumb}</span>
                <span aria-hidden className="hidden shrink-0 text-[var(--faint)] lg:inline">/</span>
              </>
            )}
            <span className="truncate font-semibold text-[var(--foreground)]">{title}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onSearch}
          className="lg-control flex h-10 items-center gap-2.5 rounded-[13px] pl-3 pr-2 text-[var(--muted-foreground)] lg:w-64"
          aria-label="Sahifa qidirish"
        >
          <Search className="size-[17px] shrink-0" strokeWidth={1.9} />
          <span className="hidden flex-1 text-left text-[13.5px] lg:inline">Sahifa yoki amal qidirish</span>
          <kbd className="hidden rounded-[6px] border border-[var(--border-strong)] bg-[color-mix(in_oklab,var(--card)_70%,transparent)] px-1.5 py-0.5 font-sans text-[11px] font-medium text-[var(--muted-foreground)] lg:inline">
            ⌘K
          </kbd>
        </button>

        {tariff && <TariffChip tariff={tariff} />}
        <Clock />
        <ThemeToggle />
        <Notifications admin={admin} />
      </header>

      {/* Phone */}
      <header className="lg-chrome fixed inset-x-2 top-2 z-30 flex h-14 items-center gap-2.5 rounded-[18px] pl-2.5 pr-1.5 md:hidden">
        <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-[11px] bg-[var(--accent)] text-white">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="size-full object-cover" />
          ) : (
            <School className="size-[18px]" strokeWidth={1.9} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15.5px] font-semibold leading-tight tracking-[-0.012em]">{title}</p>
          {tariff ? (
            <p className={cn('truncate text-[11.5px] font-medium leading-tight', toneText[tariff.tone])}>
              {tariff.expired ? `${tariff.name}: muddat tugagan` : `${tariff.name} · ${tariff.days} kun qoldi`}
            </p>
          ) : center?.name ? (
            <p className="truncate text-[11.5px] leading-tight text-[var(--muted-foreground)]">{center.name}</p>
          ) : null}
        </div>
        <IconButton label="Qidirish" onClick={onSearch}><Search className="size-[18px]" strokeWidth={1.9} /></IconButton>
        <Notifications admin={admin} />
        <MobileProfile admin={admin} onLogout={onLogout} />
      </header>
    </>
  );
}

/* -------------------------------------------------------------------------- */

const toneText = {
  ok: 'text-[var(--ok)]',
  warn: 'text-[var(--warn)]',
  bad: 'text-[var(--bad)]',
} as const;

const toneDot = {
  ok: 'bg-[var(--ok)] shadow-[0_0_0_3px_color-mix(in_oklab,var(--ok)_20%,transparent)]',
  warn: 'bg-[var(--warn)] shadow-[0_0_0_3px_color-mix(in_oklab,var(--warn)_22%,transparent)]',
  bad: 'bg-[var(--bad)] shadow-[0_0_0_3px_color-mix(in_oklab,var(--bad)_22%,transparent)]',
} as const;

function TariffChip({ tariff }: { tariff: NonNullable<ReturnType<typeof tariffStatus>> }) {
  return (
    <div
      className="lg-control hidden h-10 items-center gap-2 rounded-[13px] px-3 text-[13px] lg:flex"
      title="Tarif holati"
    >
      {tariff.expired ? (
        <AlertTriangle className="size-4 text-[var(--bad)]" strokeWidth={2} />
      ) : (
        <span className={cn('size-2 rounded-full', toneDot[tariff.tone])} />
      )}
      <span className="font-semibold text-[var(--foreground)]">{tariff.name}</span>
      <span className={cn('tabular font-medium', toneText[tariff.tone])}>
        {tariff.expired ? 'muddat tugagan' : `${tariff.days} kun`}
      </span>
    </div>
  );
}

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (!now) return null;
  return (
    <div className="hidden flex-col items-end px-2 leading-tight xl:flex" aria-label="Joriy vaqt">
      <span className="tabular text-[13.5px] font-semibold text-[var(--foreground)]">
        {now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
      </span>
      <span className="text-[11.5px] text-[var(--muted-foreground)]">
        {now.toLocaleDateString('uz-UZ', { weekday: 'short', day: 'numeric', month: 'short' })}
      </span>
    </div>
  );
}

function IconButton({
  label, onClick, children, className, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn('lg-control relative grid size-10 shrink-0 place-items-center rounded-[13px] text-[var(--foreground)]', className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === 'dark';
  return (
    <IconButton
      label={dark ? "Yorug' rejim" : "Qorong'i rejim"}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className={className}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={dark ? 'moon' : 'sun'}
          initial={{ opacity: 0, rotate: -70, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 70, scale: 0.6 }}
          transition={{ type: 'spring', stiffness: 520, damping: 32 }}
          className="grid place-items-center"
        >
          {dark ? <Moon className="size-[18px]" strokeWidth={1.9} /> : <Sun className="size-[18px]" strokeWidth={1.9} />}
        </motion.span>
      </AnimatePresence>
    </IconButton>
  );
}

function Notifications({ admin }: { admin: ShellAdmin | null }) {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const fetchNotifs = useCallback(async () => {
    if (!admin?.id) return;
    try {
      const [list, count] = await Promise.all([
        notificationApi.findUser(admin.id as any, 'admin', 1, 10),
        notificationApi.unreadCount(admin.id as any, 'admin'),
      ]);
      setItems(list.data.data || []);
      setUnread(count.data || 0);
    } catch {
      /* the bell stays quiet if the service is unreachable */
    }
  }, [admin?.id]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  useNotificationSocket(
    useCallback((data: any) => {
      setItems((prev) => [{ ...data, is_read: false }, ...prev].slice(0, 50));
      setUnread((n) => n + 1);
    }, []),
  );

  const markAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnread((n) => Math.max(0, n - 1));
    } catch {}
  };

  const markAll = async () => {
    if (!admin?.id) return;
    try {
      await notificationApi.markAllAsRead(admin.id as any, 'admin');
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {}
  };

  const openDetail = (n: any) => {
    setSelected(n);
    setOpen(false);
    if (!n.is_read) markAsRead(n.id);
  };

  return (
    <>
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) fetchNotifs(); }}>
        <PopoverTrigger asChild>
          <IconButton label={unread > 0 ? `Bildirishnomalar, ${unread} ta o'qilmagan` : 'Bildirishnomalar'}>
            <Bell className="size-[18px]" strokeWidth={1.9} />
            <AnimatePresence>
              {unread > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                  className="tabular absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--bad)] px-1 text-[10.5px] font-bold text-white shadow-[0_0_0_2px_var(--ground)]"
                >
                  {unread > 99 ? '99+' : unread}
                </motion.span>
              )}
            </AnimatePresence>
          </IconButton>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={10} className="w-[min(380px,calc(100vw-16px))] p-0">
          <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2.5">
            <p className="text-[15px] font-semibold">Bildirishnomalar</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="flex items-center gap-1 rounded-[8px] px-2 py-1 text-[12.5px] font-medium text-[var(--accent-ink)] hover:bg-[var(--accent-soft)]"
              >
                <CheckCheck className="size-3.5" /> Hammasini o&apos;qilgan qilish
              </button>
            )}
          </div>
          <div className="max-h-[min(420px,60vh)] overflow-y-auto px-2 pb-2">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="grid size-11 place-items-center rounded-full bg-[var(--muted)] text-[var(--faint)]">
                  <Bell className="size-5" strokeWidth={1.7} />
                </span>
                <p className="text-sm font-medium">Yangi xabar yo&apos;q</p>
                <p className="text-xs text-[var(--muted-foreground)]">To&apos;lov, davomat va tizim xabarlari shu yerda paydo bo&apos;ladi.</p>
              </div>
            ) : (
              items.map((n: any) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openDetail(n)}
                  className="flex w-full items-start gap-3 rounded-[12px] px-2.5 py-2.5 text-left transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)]"
                >
                  <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.is_read ? 'bg-transparent' : 'bg-[var(--accent)]')} />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-[13.5px] leading-snug', n.is_read ? 'text-[var(--muted-foreground)]' : 'font-semibold text-[var(--foreground)]')}>
                      {n.title}
                    </span>
                    {n.description && (
                      <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-[var(--muted-foreground)]">{n.description}</span>
                    )}
                    <span className="tabular mt-1 block text-[11.5px] text-[var(--faint)]">
                      {fmtDateTime(n.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
          <div className="border-t border-[var(--border)] p-1.5">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block rounded-[10px] py-2 text-center text-[13.5px] font-medium text-[var(--accent-ink)] hover:bg-[var(--accent-soft)]"
            >
              Barcha bildirishnomalar
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={!!selected} onOpenChange={(v) => { if (!v) setSelected(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.title || 'Bildirishnoma'}</DialogTitle>
            <DialogDescription className="tabular">
              {selected?.createdAt
                ? fmtDateTime(selected.createdAt, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : ''}
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[color-mix(in_oklab,var(--foreground)_85%,transparent)]">
            {selected?.description || 'Tavsif berilmagan.'}
          </p>
          <DialogFooter className="gap-2">
            {selected?.link && (
              <Button onClick={() => { const l = selected.link; setSelected(null); router.push(l); }}>
                <ExternalLink /> Ochish
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelected(null)}>Yopish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MobileProfile({ admin, onLogout }: { admin: ShellAdmin | null; onLogout: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Profil menyusi" className="grid size-10 shrink-0 place-items-center rounded-full">
          <Avatar admin={admin} className="size-[34px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold">{admin?.full_name || 'Admin'}</p>
          <p className="truncate text-xs text-[var(--muted-foreground)]">{roleLabel(admin?.role)}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/me"><UserRound /> Mening profilim</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme(dark ? 'light' : 'dark')}>
          {dark ? <Sun /> : <Moon />} {dark ? "Yorug' rejim" : "Qorong'i rejim"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout} className="text-[var(--bad)] focus:text-[var(--bad)]">
          <LogOut /> Chiqish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
