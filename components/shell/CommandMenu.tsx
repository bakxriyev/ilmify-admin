'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Command } from 'cmdk';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CornerDownLeft, Moon, Plus, Search, Sun, UserPlus, UsersRound, GraduationCap } from 'lucide-react';
import { canSee, filterSections } from './nav';
import type { ShellAdmin } from './useShellData';

const QUICK_ACTIONS = [
  { label: "Yangi student qo'shish", path: '/students/new', icon: UserPlus, permKey: 'students' },
  { label: 'Yangi guruh ochish', path: '/groups/new', icon: UsersRound, permKey: 'groups' },
  { label: "Yangi o'qituvchi qo'shish", path: '/teachers/new', icon: GraduationCap, permKey: 'teachers' },
];

export default function CommandMenu({
  open, onOpenChange, admin,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  admin: ShellAdmin | null;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const role = admin?.role;
  const perms = admin?.permissions ?? null;
  const sections = useMemo(() => filterSections(role, perms), [role, perms]);
  const actions = QUICK_ACTIONS.filter((a) => canSee(a, role, perms));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const go = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  const item =
    'flex h-11 cursor-default select-none items-center gap-3 rounded-[12px] px-3 text-[14px] text-[var(--foreground)] outline-none ' +
    'data-[selected=true]:bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-[var(--muted-foreground)] data-[selected=true]:[&_svg]:text-[var(--accent)]';
  const heading =
    '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[11.5px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[var(--faint)]';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--scrim)] backdrop-blur-[3px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <DialogPrimitive.Content
          className="lg-panel fixed left-1/2 top-[12vh] z-50 w-[calc(100%-24px)] max-w-[620px] -translate-x-1/2 overflow-hidden rounded-[24px] p-0 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97] duration-200"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Sahifa yoki amal qidirish</DialogPrimitive.Title>
          <Command loop label="Sahifa yoki amal qidirish" className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-5">
              <Search className="size-5 shrink-0 text-[var(--muted-foreground)]" strokeWidth={1.9} />
              <Command.Input
                autoFocus
                placeholder="Sahifa yoki amal nomini yozing"
                className="h-14 w-full bg-transparent text-[16px] text-[var(--foreground)] outline-none placeholder:text-[var(--faint)]"
              />
              <kbd className="hidden shrink-0 rounded-[6px] border border-[var(--border-strong)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--muted-foreground)] sm:inline">
                esc
              </kbd>
            </div>
            <Command.List className={`max-h-[min(440px,60vh)] overflow-y-auto overscroll-contain px-2 pb-2 ${heading}`}>
              <Command.Empty className="px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
                Hech narsa topilmadi. Boshqa so&apos;z bilan qidirib ko&apos;ring.
              </Command.Empty>

              {actions.length > 0 && (
                <Command.Group heading="Tezkor amallar">
                  {actions.map((a) => (
                    <Command.Item key={a.path} value={`amal ${a.label}`} onSelect={() => go(a.path)} className={item}>
                      <a.icon strokeWidth={1.9} />
                      <span className="flex-1">{a.label}</span>
                      <Plus className="!size-4 opacity-60" />
                    </Command.Item>
                  ))}
                  <Command.Item
                    value="mavzu rejim theme dark light qorong'i yorug'"
                    onSelect={() => { setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'); onOpenChange(false); }}
                    className={item}
                  >
                    {resolvedTheme === 'dark' ? <Sun strokeWidth={1.9} /> : <Moon strokeWidth={1.9} />}
                    <span className="flex-1">{resolvedTheme === 'dark' ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"}</span>
                  </Command.Item>
                </Command.Group>
              )}

              {sections.map((s) => (
                <Command.Group key={s.label} heading={s.label}>
                  {s.items.flatMap((i) =>
                    i.children
                      ? i.children.map((c) => (
                          <Command.Item key={c.path} value={`${i.label} ${c.label} ${c.path}`} onSelect={() => go(c.path)} className={item}>
                            <c.icon strokeWidth={1.9} />
                            <span className="min-w-0 flex-1 truncate">
                              {c.label !== i.label && <span className="text-[var(--muted-foreground)]">{i.label} · </span>}
                              {c.label}
                            </span>
                            <CornerDownLeft className="!size-3.5 opacity-0 [[data-selected=true]_&]:opacity-60" />
                          </Command.Item>
                        ))
                      : [
                          <Command.Item key={i.path} value={`${i.label} ${i.path}`} onSelect={() => go(i.path!)} className={item}>
                            <i.icon strokeWidth={1.9} />
                            <span className="flex-1">{i.label}</span>
                            <CornerDownLeft className="!size-3.5 opacity-0 [[data-selected=true]_&]:opacity-60" />
                          </Command.Item>,
                        ],
                  )}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
