'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronRight, PanelLeftClose, PanelLeftOpen, School, LogOut, UserRound, Camera,
  ChevronsUpDown, Loader2, ImagePlus, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { filterSections, findActive, itemHref, type NavItem, type NavLeaf } from './shell/nav';
import {
  API_BASE, centerLogoUrl, initials, photoUrl, roleLabel,
  type ShellAdmin, type ShellCenter,
} from './shell/useShellData';

export const LENS_SPRING = { type: 'spring' as const, stiffness: 520, damping: 40, mass: 0.9 };

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  admin: ShellAdmin | null;
  center: ShellCenter | null;
  onAdminChange: (a: ShellAdmin) => void;
  onLogout: () => void;
}

export default function Sidebar({ collapsed, onToggle, admin, center, onAdminChange, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const sections = useMemo(() => filterSections(admin?.role, admin?.permissions ?? null), [admin]);
  const active = findActive(pathname);
  const [open, setOpen] = useState<string[]>([]);
  const [photoOpen, setPhotoOpen] = useState(false);

  // Open the group that holds the current page.
  useEffect(() => {
    if (active.leaf && active.item && !open.includes(active.item.label)) {
      setOpen((prev) => [...prev, active.item!.label]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleGroup = (label: string) =>
    setOpen((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));

  const logo = centerLogoUrl(center?.logo);

  return (
    <TooltipProvider delayDuration={250} skipDelayDuration={100}>
      <aside
        aria-label="Asosiy menyu"
        className={cn(
          'lg-chrome fixed left-3 top-3 bottom-3 z-40 hidden md:flex flex-col rounded-[26px]',
          'transition-[width] duration-[260ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          collapsed ? 'w-[76px]' : 'w-[268px]',
        )}
      >
        {/* Brand */}
        <div className={cn('flex items-center gap-3 px-4 pt-4 pb-3', collapsed && 'flex-col px-0 gap-2')}>
          <div className="relative size-10 shrink-0 overflow-hidden rounded-[12px] bg-[var(--accent)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_4px_12px_-4px_rgb(10_80_200/0.5)] grid place-items-center">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="size-full object-cover" />
            ) : (
              <School className="size-5" strokeWidth={1.9} />
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold leading-tight tracking-[-0.01em] text-[var(--foreground)]">
                {center?.name || 'Ilmify Edu'}
              </p>
              <p className="truncate text-xs leading-tight text-[var(--muted-foreground)] mt-0.5">
                {center ? "O'quv markazi" : "Ta'lim boshqaruvi"}
              </p>
            </div>
          )}
          <SideTip label={collapsed ? 'Menyuni ochish' : 'Menyuni yigʻish'} show>
            <button
              type="button"
              onClick={onToggle}
              aria-label={collapsed ? 'Menyuni ochish' : "Menyuni yig'ish"}
              className="grid size-8 shrink-0 place-items-center rounded-[10px] text-[var(--muted-foreground)] transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)] hover:text-[var(--foreground)]"
            >
              {collapsed ? <PanelLeftOpen className="size-[18px]" strokeWidth={1.8} /> : <PanelLeftClose className="size-[18px]" strokeWidth={1.8} />}
            </button>
          </SideTip>
        </div>

        {/* Navigation */}
        <nav className="lg-fade-y min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((section, si) => (
            <div key={section.label} className={cn(si > 0 && 'mt-4')}>
              {collapsed ? (
                si > 0 && <div className="mx-auto mb-3 h-px w-6 bg-[var(--border-strong)]" />
              ) : (
                <p className="px-3 pb-1.5 text-[11.5px] font-medium text-[var(--faint)]">{section.label}</p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.label}>
                    {item.children ? (
                      <NavGroup
                        item={item}
                        collapsed={collapsed}
                        isOpen={open.includes(item.label)}
                        onToggle={() => toggleGroup(item.label)}
                        activeItem={active.item?.label === item.label}
                        activeLeaf={active.leaf}
                      />
                    ) : (
                      <NavRow
                        href={itemHref(item)}
                        icon={item.icon}
                        label={item.label}
                        active={active.item?.label === item.label && !active.leaf}
                        collapsed={collapsed}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Profile */}
        <div className="px-3 pb-3">
          <div className="mb-2 h-px bg-[var(--border)] mx-2" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'group flex w-full items-center gap-3 rounded-[14px] p-2 text-left transition-colors',
                  'hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] data-[state=open]:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]',
                  collapsed && 'justify-center',
                )}
                aria-label="Profil menyusi"
              >
                <Avatar admin={admin} className="size-9" />
                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold leading-tight text-[var(--foreground)]">
                        {admin?.full_name || 'Admin'}
                      </span>
                      <span className="block truncate text-xs leading-tight text-[var(--muted-foreground)] mt-0.5">
                        {roleLabel(admin?.role)}
                      </span>
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 text-[var(--faint)]" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side={collapsed ? 'right' : 'top'} align={collapsed ? 'end' : 'start'} sideOffset={10} className="w-60">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">{admin?.full_name || 'Admin'}</p>
                <p className="truncate text-xs text-[var(--muted-foreground)]">{admin?.email || admin?.phone_number || roleLabel(admin?.role)}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/me"><UserRound /> Mening profilim</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setPhotoOpen(true)} disabled={!admin?.id}>
                <Camera /> Rasmni o&apos;zgartirish
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onLogout} className="text-[var(--bad)] focus:text-[var(--bad)]">
                <LogOut /> Chiqish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <PhotoDialog open={photoOpen} onOpenChange={setPhotoOpen} admin={admin} onAdminChange={onAdminChange} />
    </TooltipProvider>
  );
}

/* -------------------------------------------------------------------------- */

function SideTip({ label, show, children }: { label: string; show: boolean; children: React.ReactNode }) {
  if (!show) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>{label}</TooltipContent>
    </Tooltip>
  );
}

function Lens({ id = 'nav-lens' }: { id?: string }) {
  return (
    <motion.span
      layoutId={id}
      transition={LENS_SPRING}
      className="lg-lens absolute inset-0 rounded-[12px]"
      aria-hidden
    />
  );
}

function NavRow({
  href, icon: Icon, label, active, collapsed, inset, badge,
}: {
  href: string;
  icon: NavItem['icon'];
  label: string;
  active: boolean;
  collapsed: boolean;
  inset?: boolean;
  badge?: NavLeaf['badge'];
}) {
  const row = (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex items-center rounded-[12px] outline-none',
        'focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0',
        collapsed ? 'mx-auto size-11 justify-center' : inset ? 'h-9 pl-10 pr-2.5' : 'h-10 px-2.5 gap-3',
        !active && 'hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]',
      )}
    >
      {active && <Lens />}
      {!inset && (
        <Icon
          className={cn(
            'relative size-[19px] shrink-0 transition-colors',
            active ? 'text-[var(--accent)]' : 'text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]',
          )}
          strokeWidth={active ? 2.1 : 1.8}
        />
      )}
      {!collapsed && (
        <span
          className={cn(
            'relative min-w-0 flex-1 truncate',
            inset ? 'text-[13.5px]' : 'text-[14px]',
            active ? 'font-semibold text-[var(--foreground)]' : 'font-medium text-[color-mix(in_oklab,var(--foreground)_78%,transparent)] group-hover:text-[var(--foreground)]',
          )}
        >
          {label}
        </span>
      )}
      {!collapsed && badge === 'new' && (
        <span className="relative ml-2 rounded-full bg-[var(--accent-soft)] px-1.5 py-px text-[10.5px] font-semibold text-[var(--accent-ink)]">
          Yangi
        </span>
      )}
    </Link>
  );
  return <SideTip label={label} show={collapsed}>{row}</SideTip>;
}

function NavGroup({
  item, collapsed, isOpen, onToggle, activeItem, activeLeaf,
}: {
  item: NavItem;
  collapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
  activeItem: boolean;
  activeLeaf?: NavLeaf;
}) {
  const router = useRouter();
  const Icon = item.icon;
  const children = item.children ?? [];

  if (collapsed) {
    return (
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={item.label}
                className={cn(
                  'group relative mx-auto grid size-11 place-items-center rounded-[12px] outline-none',
                  'focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                  !activeItem && 'hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] data-[state=open]:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]',
                )}
              >
                {activeItem && <Lens />}
                <Icon
                  className={cn('relative size-[19px]', activeItem ? 'text-[var(--accent)]' : 'text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]')}
                  strokeWidth={activeItem ? 2.1 : 1.8}
                />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12}>{item.label}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent side="right" align="start" sideOffset={14} className="w-56">
          <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
          {children.map((c) => {
            const CIcon = c.icon;
            const on = activeLeaf?.path === c.path;
            return (
              <DropdownMenuItem
                key={c.path}
                onSelect={() => router.push(c.path)}
                className={cn(on && 'bg-[var(--accent-soft)] text-[var(--accent-ink)] focus:bg-[var(--accent-soft)]')}
              >
                <CIcon /> {c.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={cn(
          'group relative flex h-10 w-full items-center gap-3 rounded-[12px] px-2.5 text-left outline-none',
          'hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
          activeItem && !isOpen && 'bg-[var(--accent-soft)]',
        )}
      >
        <Icon
          className={cn('size-[19px] shrink-0', activeItem ? 'text-[var(--accent)]' : 'text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]')}
          strokeWidth={activeItem ? 2.1 : 1.8}
        />
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-[14px]',
            activeItem ? 'font-semibold text-[var(--foreground)]' : 'font-medium text-[color-mix(in_oklab,var(--foreground)_78%,transparent)] group-hover:text-[var(--foreground)]',
          )}
        >
          {item.label}
        </span>
        <ChevronRight
          className={cn('size-4 shrink-0 text-[var(--faint)] transition-transform duration-200 ease-out', isOpen && 'rotate-90')}
          strokeWidth={2}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.ul
            key="sub"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }, opacity: { duration: 0.16 } }}
            className="relative overflow-hidden"
          >
            <span aria-hidden className="absolute left-[21px] top-1 bottom-1 w-px bg-[var(--border-strong)]" />
            <div className="space-y-0.5 py-0.5">
              {children.map((c) => (
                <li key={c.path}>
                  <NavRow
                    href={c.path}
                    icon={c.icon}
                    label={c.label}
                    active={activeLeaf?.path === c.path}
                    collapsed={false}
                    inset
                    badge={c.badge}
                  />
                </li>
              ))}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Avatar({ admin, className }: { admin: ShellAdmin | null; className?: string }) {
  const src = photoUrl(admin?.photo);
  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-full text-[13px] font-semibold text-white',
        'bg-[linear-gradient(160deg,#4f9bff,#0a6cff_60%,#0656d6)] shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_0_0_2px_rgb(255_255_255/0.6)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_0_0_2px_rgb(255_255_255/0.08)]',
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initials(admin?.full_name)
      )}
    </span>
  );
}

function PhotoDialog({
  open, onOpenChange, admin, onAdminChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  admin: ShellAdmin | null;
  onAdminChange: (a: ShellAdmin) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) setFile(null);
  };

  const upload = async () => {
    if (!file || !admin?.id) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Rasm 5 MB dan katta. Kichikroq rasm tanlang.');
      return;
    }
    try {
      setBusy(true);
      const fd = new FormData();
      fd.append('photo', file);
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/admin/${admin.id}/photo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error('Rasm yuklanmadi. Qayta urinib koʻring.');
      const updated = await res.json();
      localStorage.setItem('admin', JSON.stringify({ ...admin, ...updated }));
      onAdminChange({ ...admin, ...updated });
      toast.success('Rasm yangilandi');
      close(false);
    } catch (err: any) {
      toast.error(err?.message || 'Rasmni yangilashda xatolik');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profil rasmi</DialogTitle>
          <DialogDescription>PNG yoki JPG, 5 MB gacha.</DialogDescription>
        </DialogHeader>
        {file && preview ? (
          <div className="flex items-center gap-4 rounded-[16px] border border-[var(--border)] bg-[var(--muted)] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="size-14 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-[var(--muted-foreground)] tabular">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              aria-label="Tanlovni bekor qilish"
              className="grid size-8 place-items-center rounded-full text-[var(--muted-foreground)] hover:bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-[var(--border-strong)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)]">
            <ImagePlus className="size-8" strokeWidth={1.6} />
            <span className="text-sm font-medium">Rasm tanlash uchun bosing</span>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={() => close(false)}>Bekor qilish</Button>
          <Button onClick={upload} disabled={!file || busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Camera />}
            {busy ? 'Yuklanmoqda' : 'Saqlash'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
