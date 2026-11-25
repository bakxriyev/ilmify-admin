'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutGrid, Ellipsis, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { MOBILE_PRIMARY, filterSections, findActive, itemHref, type NavItem } from './nav';
import type { ShellAdmin } from './useShellData';

const SPRING = { type: 'spring' as const, stiffness: 520, damping: 40, mass: 0.9 };

export default function MobileTabBar({ admin }: { admin: ShellAdmin | null }) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const sections = useMemo(() => filterSections(admin?.role, admin?.permissions ?? null), [admin]);
  const all = sections.flatMap((s) => s.items);
  const primary = MOBILE_PRIMARY.map((l) => all.find((i) => i.label === l)).filter(Boolean) as NavItem[];
  const active = findActive(pathname);
  const activeIsPrimary = primary.some((p) => p.label === active.item?.label);

  useEffect(() => setMore(false), [pathname]);

  return (
    <>
      <nav
        aria-label="Asosiy bo'limlar"
        className="lg-chrome fixed inset-x-3 z-40 flex h-[64px] items-stretch rounded-[32px] p-1.5 md:hidden"
        style={{ bottom: 'calc(10px + env(safe-area-inset-bottom))' }}
      >
        {primary.map((item) => {
          const on = active.item?.label === item.label;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={itemHref(item)}
              aria-current={on ? 'page' : undefined}
              className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[26px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {on && <motion.span layoutId="tab-lens" transition={SPRING} className="lg-lens absolute inset-0 rounded-[26px]" aria-hidden />}
              <Icon className={cn('relative size-[21px]', on ? 'text-[var(--accent)]' : 'text-[var(--muted-foreground)]')} strokeWidth={on ? 2.1 : 1.8} />
              <span className={cn('relative max-w-full truncate px-1 text-[10.5px] leading-none', on ? 'font-semibold text-[var(--foreground)]' : 'font-medium text-[var(--muted-foreground)]')}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMore(true)}
          aria-haspopup="dialog"
          className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[26px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          {!activeIsPrimary && active.item && (
            <motion.span layoutId="tab-lens" transition={SPRING} className="lg-lens absolute inset-0 rounded-[26px]" aria-hidden />
          )}
          <Ellipsis className={cn('relative size-[21px]', !activeIsPrimary && active.item ? 'text-[var(--accent)]' : 'text-[var(--muted-foreground)]')} strokeWidth={1.9} />
          <span className={cn('relative text-[10.5px] leading-none', !activeIsPrimary && active.item ? 'font-semibold text-[var(--foreground)]' : 'font-medium text-[var(--muted-foreground)]')}>
            Yana
          </span>
        </button>
      </nav>

      <Drawer open={more} onOpenChange={setMore} shouldScaleBackground={false}>
        <DrawerContent>
          <div className="px-5 pt-3 pb-1">
            <DrawerTitle className="text-[19px] font-semibold tracking-[-0.015em]">Barcha bo&apos;limlar</DrawerTitle>
            <DrawerDescription className="sr-only">Admin panel bo&apos;limlari ro&apos;yxati</DrawerDescription>
          </div>
          <div className="overflow-y-auto overscroll-contain px-3 pb-4">
            {sections.map((s) => (
              <div key={s.label} className="mt-3">
                <p className="px-3 pb-1.5 text-[12px] font-medium text-[var(--faint)]">{s.label}</p>
                <div className="overflow-hidden rounded-[18px] bg-[color-mix(in_oklab,var(--card)_70%,transparent)] ring-1 ring-[var(--border)]">
                  {s.items.flatMap((i) =>
                    (i.children ?? [{ label: i.label, path: i.path!, icon: i.icon }]).map((c, idx, arr) => {
                      const on = (active.leaf?.path ?? active.item?.path) === c.path;
                      const CIcon = c.icon ?? LayoutGrid;
                      return (
                        <Link
                          key={c.path}
                          href={c.path}
                          className={cn(
                            'flex min-h-12 items-center gap-3 px-4 text-[15px] transition-colors active:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]',
                            on && 'bg-[var(--accent-soft)]',
                          )}
                        >
                          <CIcon className={cn('size-[19px] shrink-0', on ? 'text-[var(--accent)]' : 'text-[var(--muted-foreground)]')} strokeWidth={1.9} />
                          <span className={cn('min-w-0 flex-1 truncate border-b py-3', idx === arr.length - 1 && i === s.items[s.items.length - 1] ? 'border-transparent' : 'border-[var(--border)]', on && 'font-semibold')}>
                            {i.children && c.label !== i.label ? (
                              <><span className="text-[var(--muted-foreground)]">{i.label} · </span>{c.label}</>
                            ) : c.label}
                          </span>
                          <ChevronRight className="size-4 shrink-0 text-[var(--faint)]" />
                        </Link>
                      );
                    }),
                  )}
                </div>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
