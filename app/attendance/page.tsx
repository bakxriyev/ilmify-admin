'use client';

import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import {
  Search, Users, Calendar, ChevronLeft, ChevronRight, RefreshCw, Phone, GraduationCap,
  DoorOpen, ChevronDown, Wallet, AlertTriangle, Check, X, CalendarDays, School,
} from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { groupsApi, type Group } from '@/api/groupsApi';
import { groupStudentsApi, type GroupStudent } from '@/api/groupStudentApi';
import { attendanceApi, type MonthlyStats, type AttendanceCell } from '@/api/attendanceApi';
import { paymentsApi } from '@/api/paymentsApi';
import toast from 'react-hot-toast';

/* -------------------------------------------------------------------------- */
/* Types, helpers                                                             */
/* -------------------------------------------------------------------------- */

type TodayStatus = 'marked' | 'partial' | 'unmarked' | 'no_lessons';
type Cells = Record<number, AttendanceCell>; // lessonId -> cell
type ByStudent = Record<number, Cells>; // studentId -> cells
interface LessonMeta { id: number; dateStr: string; day: number; weekday: string; isToday: boolean; isFuture: boolean }
interface PayInfo { debt: number; status: string }

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const weekdayFmt = new Intl.DateTimeFormat('uz-UZ', { weekday: 'short' });
const sumFmt = new Intl.NumberFormat('uz-UZ');
const formatSum = (n: number) => sumFmt.format(Math.floor(Number(n) || 0));
const initials = (f = '', l = '') => `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
const teacherName = (g: Group) =>
  g.mainTeacher ? `${g.mainTeacher.first_name} ${g.mainTeacher.last_name}` : g.teacher_id ? `ID: ${g.teacher_id}` : '—';
const parentPhone = (student: any): string =>
  student?.parent_links?.[0]?.parent?.phone_number || student?.phone_number || '—';

/** Pivot the API's lesson→student map into student→lesson, so one row owns its cells. */
function pivot(att: Record<number, Record<number, AttendanceCell>>): ByStudent {
  const out: ByStudent = {};
  for (const lid in att) {
    const row = att[lid];
    for (const sid in row) (out[sid as any] ||= {})[lid as any] = row[sid];
  }
  return out;
}

function rowStats(cells: Cells | undefined, lessons: LessonMeta[], joinDate?: string) {
  let present = 0, total = 0, absent = 0, streak = 0, maxStreak = 0;
  for (const l of lessons) {
    const c = cells?.[l.id];
    if (c) { total++; if (c.is_present) present++; else absent++; }
    if (l.isFuture) continue;
    if (joinDate && l.dateStr < joinDate) { streak = 0; continue; }
    if (c?.is_present === false) { streak++; if (streak > maxStreak) maxStreak = streak; } else streak = 0;
  }
  return { present, absent, total, maxStreak };
}

const STATUS_CHIP: Record<Exclude<TodayStatus, 'no_lessons'>, { label: string; cls: string }> = {
  marked: { label: 'Bugun qilingan', cls: 'bg-[color-mix(in_oklab,var(--ok)_14%,transparent)] text-[var(--ok)]' },
  partial: { label: 'Qisman', cls: 'bg-[color-mix(in_oklab,var(--warn)_16%,transparent)] text-[var(--warn)]' },
  unmarked: { label: 'Qilinmagan', cls: 'bg-[color-mix(in_oklab,var(--bad)_13%,transparent)] text-[var(--bad)]' },
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AttendancePage() {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const now = useMemo(() => new Date(), []);

  // Groups
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [todayStatus, setTodayStatus] = useState<Record<string, TodayStatus>>({});
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [selected, setSelected] = useState<Group | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Month grid
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [relations, setRelations] = useState<GroupStudent[]>([]);
  const [lessons, setLessons] = useState<MonthlyGridLesson[]>([]);
  const [byStudent, setByStudent] = useState<ByStudent>({});
  const [joinDates, setJoinDates] = useState<Record<number, string>>({});
  const [payments, setPayments] = useState<Record<number, PayInfo>>({});
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [gridLoading, setGridLoading] = useState(false);
  const [active, setActive] = useState<{ sid: number; lid: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);
  const statsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Student modal
  const [modalRel, setModalRel] = useState<GroupStudent | null>(null);
  const [debts, setDebts] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

  /* ---------------- loading ---------------- */

  const loadTodayStatus = useCallback(async () => {
    try {
      const map = await attendanceApi.getTodayStatus(todayStr);
      setTodayStatus(map || {});
    } catch {
      setTodayStatus({}); // badges are a convenience; the page works without them
    }
  }, [todayStr]);

  const loadGroups = useCallback(async () => {
    setGroupsLoading(true);
    // Lessons are not needed for the list any more: today's status comes from one request.
    const [g] = await Promise.allSettled([
      groupsApi.getAll({ page: 1, limit: 100, include: 'mainTeacher,supportTeacher,room' }),
      loadTodayStatus(),
    ]);
    setGroups(g.status === 'fulfilled' ? g.value.data || [] : []);
    if (g.status === 'rejected') toast.error("Guruhlarni yuklab bo'lmadi");
    setGroupsLoading(false);
  }, [loadTodayStatus]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const loadStats = useCallback(async (groupId: number, y: number, m: number, mySeq: number) => {
    try {
      const s = await attendanceApi.getStats(groupId, y, m + 1);
      if (seq.current === mySeq) setStats(s);
    } catch {
      if (seq.current === mySeq) setStats(null);
    }
  }, []);

  // Everything for the selected group and month, in parallel; stale answers are dropped.
  useEffect(() => {
    if (!selected) return;
    const id = Number(selected.id);
    const mySeq = ++seq.current;
    setActive(null);
    setGridLoading(true);
    setStats(null);

    Promise.allSettled([
      groupStudentsApi.getStudentsByGroup(id),
      attendanceApi.getMonthlyGrid(id, year, month + 1),
      paymentsApi.findByGroup(id, month + 1, year),
    ]).then(([rel, grid, pay]) => {
      if (seq.current !== mySeq) return;
      setRelations(rel.status === 'fulfilled' ? rel.value : []);
      if (grid.status === 'fulfilled') {
        setLessons(grid.value.lessons || []);
        setByStudent(pivot(grid.value.attendance || {}));
        setJoinDates(grid.value.student_join_dates || {});
      } else {
        setLessons([]); setByStudent({}); setJoinDates({});
        toast.error("Davomat jadvalini yuklab bo'lmadi");
      }
      const map: Record<number, PayInfo> = {};
      if (pay.status === 'fulfilled') pay.value.forEach((it: any) => { map[it.student.id] = { debt: it.debt || 0, status: it.status }; });
      setPayments(map);
      setGridLoading(false);
    });
    loadStats(id, year, month, mySeq);
  }, [selected, year, month, loadStats]);

  useEffect(() => () => {
    if (statsTimer.current) clearTimeout(statsTimer.current);
    if (statusTimer.current) clearTimeout(statusTimer.current);
  }, []);

  /* ---------------- derived ---------------- */

  const filteredGroups = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      g.mainTeacher?.first_name?.toLowerCase().includes(q) ||
      g.mainTeacher?.last_name?.toLowerCase().includes(q));
  }, [groups, deferredQuery]);

  const lessonMeta = useMemo<LessonMeta[]>(
    () => [...lessons]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => {
        const dateStr = l.date.split('T')[0];
        const d = new Date(l.date);
        return { id: l.id, dateStr, day: d.getDate(), weekday: weekdayFmt.format(d), isToday: dateStr === todayStr, isFuture: dateStr > todayStr };
      }),
    [lessons, todayStr],
  );

  const activeRelations = useMemo(() => relations.filter((r) => !r.left_date && r.student), [relations]);
  const pastLessons = lessonMeta.filter((l) => !l.isFuture).length;

  /* ---------------- actions ---------------- */

  const selectGroup = useCallback((g: Group) => {
    setSelected(g);
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setPickerOpen(false);
  }, [now]);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const mark = useCallback(async (lid: number, sid: number, isPresent: boolean, reason?: string) => {
    setActive(null);
    if (!selected) return;
    const groupId = Number(selected.id);
    let previous: AttendanceCell | undefined;
    // Optimistic: the cell flips immediately, only this student's row re-renders.
    setByStudent((prev) => {
      previous = prev[sid]?.[lid];
      return { ...prev, [sid]: { ...prev[sid], [lid]: { is_present: isPresent, reason: reason || undefined } } };
    });
    try {
      await attendanceApi.markLesson({ lesson_id: lid, attendance: [{ student_id: sid, is_present: isPresent, reason }] });
      const mySeq = seq.current;
      if (statsTimer.current) clearTimeout(statsTimer.current);
      statsTimer.current = setTimeout(() => loadStats(groupId, year, month, mySeq), 700);
      if (statusTimer.current) clearTimeout(statusTimer.current);
      statusTimer.current = setTimeout(loadTodayStatus, 1200);
    } catch (err: any) {
      setByStudent((prev) => {
        const row = { ...prev[sid] };
        if (previous) row[lid] = previous; else delete row[lid];
        return { ...prev, [sid]: row };
      });
      toast.error(err?.response?.data?.message || err?.message || "Saqlanmadi. Qayta urinib ko'ring.");
    }
  }, [selected, year, month, loadStats, loadTodayStatus]);

  const openCell = useCallback((sid: number, lid: number) => setActive({ sid, lid }), []);
  const closeCell = useCallback(() => setActive(null), []);

  const openStudent = useCallback(async (rel: GroupStudent) => {
    setModalRel(rel);
    setDebts(null);
    setModalLoading(true);
    try {
      setDebts(await paymentsApi.getStudentDebts(rel.student!.id));
    } catch {
      setDebts(null);
    } finally {
      setModalLoading(false);
    }
  }, []);

  /* ---------------- render ---------------- */

  const groupList = (
    <GroupList
      groups={filteredGroups}
      loading={groupsLoading}
      selectedId={selected?.id}
      status={todayStatus}
      onSelect={selectGroup}
    />
  );

  return (
    <Layout>
      <div className="mx-auto w-full max-w-[1480px] px-3 pt-2 pb-6 sm:px-4 md:px-1 md:pt-3">
        {/* Page head */}
        <div className="mb-4 flex items-end justify-between gap-3 px-1">
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] md:text-[30px]">Davomat</h1>
            <p className="mt-1 text-[14px] text-[var(--muted-foreground)]">Guruhni tanlang, katakni bosib belgilang.</p>
          </div>
          <Button variant="outline" onClick={loadGroups} disabled={groupsLoading}>
            <RefreshCw className={cn(groupsLoading && 'animate-spin')} />
            <span className="hidden sm:inline">Yangilash</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* Group picker: phone */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              aria-expanded={pickerOpen}
              className="lg-surface flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left"
            >
              <Users className="size-[18px] text-[var(--accent)]" />
              <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{selected ? selected.name : 'Guruh tanlang'}</span>
              <ChevronDown className={cn('size-4 text-[var(--faint)] transition-transform', pickerOpen && 'rotate-180')} />
            </button>
            {pickerOpen && (
              <div className="lg-surface mt-2 overflow-hidden rounded-[20px]">
                <SearchBox value={query} onChange={setQuery} count={filteredGroups.length} />
                <div className="max-h-[55vh] overflow-y-auto">{groupList}</div>
              </div>
            )}
          </div>

          {/* Group picker: desktop */}
          <aside className="hidden lg:block">
            <div className="lg-surface sticky top-[84px] overflow-hidden rounded-[22px]">
              <SearchBox value={query} onChange={setQuery} count={filteredGroups.length} />
              <div className="max-h-[calc(100dvh-190px)] overflow-y-auto">{groupList}</div>
            </div>
          </aside>

          {/* Work area */}
          <div className="min-w-0 space-y-4">
            {!selected ? (
              <div className="lg-surface flex flex-col items-center justify-center rounded-[22px] px-6 py-20 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  <CalendarDays className="size-7" strokeWidth={1.7} />
                </span>
                <h2 className="mt-4 text-[18px] font-semibold">Guruhni tanlang</h2>
                <p className="mt-1 max-w-sm text-[13.5px] text-[var(--muted-foreground)]">
                  Ro&apos;yxatdagi rangli belgi bugungi holatni ko&apos;rsatadi: qilinmagan, qisman yoki qilingan.
                </p>
              </div>
            ) : (
              <>
                {/* Group head + month switcher */}
                <section className="lg-surface flex flex-col gap-3 rounded-[22px] p-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
                  <div className="min-w-0">
                    <h2 className="truncate text-[18px] font-semibold tracking-[-0.015em]">{selected.name}</h2>
                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[var(--muted-foreground)]">
                      <span className="inline-flex items-center gap-1.5"><GraduationCap className="size-3.5" />{teacherName(selected)}</span>
                      <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" /><span className="tabular">{activeRelations.length}</span> ta student</span>
                      {selected.room && <span className="inline-flex items-center gap-1.5"><DoorOpen className="size-3.5" />{selected.room.name}</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button variant="outline" size="icon" className="size-9" onClick={() => shiftMonth(-1)} aria-label="Oldingi oy"><ChevronLeft /></Button>
                    <span className="tabular min-w-[124px] text-center text-[14px] font-semibold">{MONTHS[month]} {year}</span>
                    <Button variant="outline" size="icon" className="size-9" onClick={() => shiftMonth(1)} aria-label="Keyingi oy"><ChevronRight /></Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="ml-1"
                      disabled={year === now.getFullYear() && month === now.getMonth()}
                      onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}
                    >
                      Bu oy
                    </Button>
                  </div>
                </section>

                {/* Grid */}
                <section className="lg-surface overflow-hidden rounded-[22px]">
                  {gridLoading ? (
                    <GridSkeleton />
                  ) : activeRelations.length === 0 ? (
                    <EmptyBlock icon={Users} title="Bu guruhda faol student yo'q" text="Guruhga student qo'shilgach, davomat shu yerda belgilanadi." />
                  ) : lessonMeta.length === 0 ? (
                    <EmptyBlock icon={Calendar} title="Bu oyda dars yo'q" text="Boshqa oyni tanlang yoki guruhga dars jadvalini qo'shing." />
                  ) : (
                    <div ref={gridRef} className="overflow-x-auto overscroll-x-contain">
                      <table className="w-full border-separate border-spacing-0 text-sm">
                        <thead>
                          <tr>
                            <th className="sticky left-0 z-20 min-w-[200px] border-b border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-left text-[12.5px] font-semibold text-[var(--muted-foreground)]">
                              Student
                            </th>
                            {lessonMeta.map((l) => (
                              <th
                                key={l.id}
                                className={cn(
                                  'min-w-[40px] border-b border-[var(--border)] px-0.5 py-2 text-center font-normal',
                                  l.isToday ? 'text-[var(--accent-ink)]' : 'text-[var(--muted-foreground)]',
                                )}
                              >
                                <span className={cn('tabular mx-auto grid size-7 place-items-center rounded-full text-[12.5px] font-semibold', l.isToday && 'bg-[var(--accent)] text-white')}>
                                  {l.day}
                                </span>
                                <span className="mt-0.5 block text-[10.5px] capitalize">{l.weekday}</span>
                              </th>
                            ))}
                            <th className="min-w-[56px] border-b border-[var(--border)] px-2 text-center text-[12.5px] font-semibold text-[var(--muted-foreground)]">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeRelations.map((rel) => {
                            const sid = rel.student!.id;
                            return (
                              <StudentRow
                                key={sid}
                                rel={rel}
                                cells={byStudent[sid]}
                                lessons={lessonMeta}
                                joinDate={joinDates[sid]}
                                pay={payments[sid]}
                                activeLessonId={active?.sid === sid ? active.lid : null}
                                onOpenCell={openCell}
                                onCloseCell={closeCell}
                                onMark={mark}
                                onOpenStudent={openStudent}
                              />
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <section className="lg-surface rounded-[22px] p-4 md:p-5 lg:col-span-2">
                    <h3 className="text-[16px] font-semibold">Oylik statistika</h3>
                    {stats ? (
                      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <Metric label="Davomat" value={`${stats.presentPercent}%`} tone={Number(stats.presentPercent) >= 80 ? 'ok' : Number(stats.presentPercent) >= 60 ? 'warn' : 'bad'} />
                        <Metric label="Keldi" value={stats.present} tone="ok" />
                        <Metric label="Kelmadi" value={stats.absent} tone="bad" />
                        <Metric label="Darslar" value={stats.lessons} />
                        <div className="col-span-2 sm:col-span-4">
                          <div className="h-2 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]">
                            <div
                              className="h-full rounded-full bg-[var(--ok)] transition-[width] duration-500 ease-out"
                              style={{ width: `${Math.min(Number(stats.presentPercent) || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : gridLoading ? (
                      <Skeleton className="mt-4 h-20 w-full" />
                    ) : (
                      <p className="mt-3 text-[13.5px] text-[var(--muted-foreground)]">Bu oy uchun statistika hali yo&apos;q.</p>
                    )}
                  </section>
                  <section className="lg-surface rounded-[22px] p-4 md:p-5">
                    <h3 className="text-[16px] font-semibold">Ma&apos;lumot</h3>
                    <dl className="mt-3 divide-y divide-[var(--border)] text-[13.5px]">
                      <InfoRow label="Faol studentlar" value={activeRelations.length} />
                      <InfoRow label="Bu oydagi darslar" value={lessonMeta.length} />
                      <InfoRow label="O'tgan darslar" value={pastLessons} />
                      <InfoRow label="Kelgusi darslar" value={lessonMeta.length - pastLessons} />
                      <InfoRow label="O'qituvchi" value={teacherName(selected)} />
                    </dl>
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <StudentDialog
        rel={modalRel}
        loading={modalLoading}
        debts={debts}
        cells={modalRel ? byStudent[modalRel.student!.id] : undefined}
        lessons={lessonMeta}
        joinDate={modalRel ? joinDates[modalRel.student!.id] : undefined}
        onClose={() => { setModalRel(null); setDebts(null); }}
      />
    </Layout>
  );
}

type MonthlyGridLesson = { id: number; date: string; start_time: string; end_time?: string };

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

function SearchBox({ value, onChange, count }: { value: string; onChange: (v: string) => void; count: number }) {
  return (
    <div className="border-b border-[var(--border)] p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[13px] font-semibold">Guruhlar</span>
        <span className="tabular text-[12px] text-[var(--muted-foreground)]">{count}</span>
      </div>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--faint)]" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Guruh yoki o'qituvchi"
          aria-label="Guruh qidirish"
          className="h-9 w-full rounded-[11px] border border-[var(--border-strong)] bg-[color-mix(in_oklab,var(--card)_85%,transparent)] pl-9 pr-3 text-[13.5px] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--faint)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
        />
      </label>
    </div>
  );
}

const GroupList = memo(function GroupList({
  groups, loading, selectedId, status, onSelect,
}: {
  groups: Group[];
  loading: boolean;
  selectedId?: string;
  status: Record<string, TodayStatus>;
  onSelect: (g: Group) => void;
}) {
  if (loading) {
    return <div className="space-y-2 p-3">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>;
  }
  if (!groups.length) {
    return (
      <div className="px-6 py-10 text-center text-[13px] text-[var(--muted-foreground)]">
        <School className="mx-auto mb-2 size-8 opacity-40" />
        Guruh topilmadi
      </div>
    );
  }
  return (
    <ul className="p-1.5">
      {groups.map((g) => {
        const on = selectedId === g.id;
        const st = status[String(g.id)];
        const chip = st && st !== 'no_lessons' ? STATUS_CHIP[st] : null;
        return (
          <li key={g.id}>
            <button
              type="button"
              onClick={() => onSelect(g)}
              aria-current={on ? 'true' : undefined}
              className={cn(
                'w-full rounded-[14px] border border-transparent px-3 py-2.5 text-left transition-colors',
                on ? 'lg-lens' : 'hover:bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)]',
              )}
            >
              <span className="flex items-center gap-2">
                <span className={cn('min-w-0 flex-1 truncate text-[14px]', on ? 'font-semibold' : 'font-medium')}>{g.name}</span>
                <span className="tabular shrink-0 rounded-full bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)] px-1.5 py-px text-[11.5px] font-semibold text-[var(--muted-foreground)]">
                  {(g as any).student_count || 0}
                </span>
              </span>
              <span className="mt-1 flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--muted-foreground)]">
                  {teacherName(g)}{g.room ? ` · ${g.room.name}` : ''}
                </span>
                {chip && <span className={cn('shrink-0 rounded-full px-1.5 py-px text-[10.5px] font-semibold', chip.cls)}>{chip.label}</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
});

const StudentRow = memo(function StudentRow({
  rel, cells, lessons, joinDate, pay, activeLessonId, onOpenCell, onCloseCell, onMark, onOpenStudent,
}: {
  rel: GroupStudent;
  cells?: Cells;
  lessons: LessonMeta[];
  joinDate?: string;
  pay?: PayInfo;
  activeLessonId: number | null;
  onOpenCell: (sid: number, lid: number) => void;
  onCloseCell: () => void;
  onMark: (lid: number, sid: number, present: boolean, reason?: string) => void;
  onOpenStudent: (rel: GroupStudent) => void;
}) {
  const s = rel.student!;
  const { present, total, maxStreak } = rowStats(cells, lessons, joinDate);
  const warn = maxStreak >= 3;
  const pct = total ? Math.round((present / total) * 100) : null;
  const rowBg = warn ? 'bg-[color-mix(in_oklab,var(--bad)_7%,var(--card))]' : 'bg-[var(--card)]';

  return (
    <tr className="group/row">
      <td className={cn('sticky left-0 z-10 border-b border-[var(--border)] p-0', rowBg)}>
        <button
          type="button"
          onClick={() => onOpenStudent(rel)}
          className="flex w-full items-center gap-2.5 px-4 py-2 text-left transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)]"
        >
          <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[linear-gradient(160deg,#4f9bff,#0a6cff)] text-[11.5px] font-semibold text-white">
            {s.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.photo} alt="" loading="lazy" className="size-full object-cover" />
            ) : initials(s.first_name, s.last_name)}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1">
              <span className="block max-w-[150px] truncate text-[13.5px] font-medium">{s.first_name} {s.last_name}</span>
              {warn && (
                <span title={`${maxStreak} marta ketma-ket kelmagan`}>
                  <AlertTriangle className="size-3.5 shrink-0 text-[var(--bad)]" />
                </span>
              )}
            </span>
            {pay && pay.debt > 0 ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--bad)]">
                <Wallet className="size-3" /> <span className="tabular">{formatSum(pay.debt)}</span> so&apos;m qarz
              </span>
            ) : (
              <span className="text-[11px] font-medium text-[var(--ok)]">To&apos;lov qilgan</span>
            )}
          </span>
        </button>
      </td>
      {lessons.map((l) => {
        const c = cells?.[l.id];
        const beforeJoin = joinDate ? l.dateStr < joinDate : false;
        return (
          <td key={l.id} className={cn('relative border-b border-[var(--border)] p-1 text-center', l.isToday && 'bg-[color-mix(in_oklab,var(--accent)_5%,transparent)]')}>
            {beforeJoin ? (
              <span className="mx-auto grid size-8 place-items-center text-[var(--faint)] opacity-50">—</span>
            ) : (
              <CellEditor
                open={activeLessonId === l.id}
                onPresent={() => onMark(l.id, s.id, true)}
                onAbsent={(reason) => onMark(l.id, s.id, false, reason)}
                onClose={onCloseCell}
              >
              <button
                type="button"
                disabled={l.isFuture}
                onClick={() => onOpenCell(s.id, l.id)}
                title={c?.reason ? `Sabab: ${c.reason}` : l.isFuture ? 'Kun hali kelmagan' : 'Belgilash'}
                aria-label={`${s.first_name} ${s.last_name}, ${l.day}-sana: ${c ? (c.is_present ? 'keldi' : 'kelmadi') : 'belgilanmagan'}`}
                className={cn(
                  'mx-auto grid size-8 place-items-center rounded-[9px] text-[13px] font-semibold transition-[background-color,box-shadow,transform] duration-100 active:scale-90',
                  l.isFuture && 'cursor-not-allowed opacity-30',
                  !l.isFuture && 'hover:ring-2 hover:ring-[var(--accent)]',
                  c?.is_present === true && 'bg-[color-mix(in_oklab,var(--ok)_16%,transparent)] text-[var(--ok)]',
                  c?.is_present === false && 'bg-[color-mix(in_oklab,var(--bad)_14%,transparent)] text-[var(--bad)]',
                  !c && 'bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] text-[var(--faint)]',
                )}
              >
                {c?.is_present === true ? <Check className="size-4" strokeWidth={2.6} /> : c?.is_present === false ? <X className="size-4" strokeWidth={2.6} /> : l.isFuture ? '·' : '–'}
              </button>
              </CellEditor>
            )}
          </td>
        );
      })}
      <td className="border-b border-[var(--border)] px-2 text-center">
        <span
          className={cn(
            'tabular text-[13px] font-semibold',
            pct == null ? 'text-[var(--faint)]' : pct >= 70 ? 'text-[var(--ok)]' : pct >= 40 ? 'text-[var(--warn)]' : 'text-[var(--bad)]',
          )}
        >
          {pct == null ? '—' : `${pct}%`}
        </span>
      </td>
    </tr>
  );
});

/**
 * Present / absent picker in a portal popover (never clipped by the scrolling grid).
 * Only the open cell mounts a popover; the reason text lives here so typing never re-renders the grid.
 */
function CellEditor({
  open, children, onPresent, onAbsent, onClose,
}: {
  open: boolean;
  children: React.ReactElement;
  onPresent: () => void;
  onAbsent: (reason?: string) => void;
  onClose: () => void;
}) {
  if (!open) return children;
  return (
    <PopoverPrimitive.Root open onOpenChange={(v) => { if (!v) onClose(); }}>
      <PopoverPrimitive.Anchor asChild>{children}</PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="top"
          sideOffset={6}
          collisionPadding={12}
          className="lg-panel z-50 rounded-[14px] p-1.5 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.96] duration-150"
        >
          <EditorBody onPresent={onPresent} onAbsent={onAbsent} onClose={onClose} />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function EditorBody({ onPresent, onAbsent, onClose }: { onPresent: () => void; onAbsent: (reason?: string) => void; onClose: () => void }) {
  const [askReason, setAskReason] = useState(false);
  const [reason, setReason] = useState('');
  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          autoFocus
          onClick={onPresent}
          className="flex h-8 items-center gap-1 rounded-[10px] bg-[var(--ok)] px-2.5 text-[12.5px] font-semibold text-white active:scale-95"
        >
          <Check className="size-3.5" strokeWidth={2.6} /> Keldi
        </button>
        <button
          type="button"
          onClick={() => setAskReason(true)}
          className="flex h-8 items-center gap-1 rounded-[10px] bg-[var(--bad)] px-2.5 text-[12.5px] font-semibold text-white active:scale-95"
        >
          <X className="size-3.5" strokeWidth={2.6} /> Kelmadi
        </button>
        <button type="button" onClick={onClose} aria-label="Yopish" className="grid size-8 place-items-center rounded-[10px] text-[var(--muted-foreground)] hover:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]">
          <X className="size-4" />
        </button>
      </div>
      {askReason && (
        <form
          className="mt-1.5 flex gap-1"
          onSubmit={(e) => { e.preventDefault(); onAbsent(reason.trim() || undefined); }}
        >
          <input
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Sabab (ixtiyoriy)"
            className="h-8 w-36 rounded-[9px] border border-[var(--border-strong)] bg-[var(--card)] px-2 text-[12.5px] outline-none focus:border-[var(--accent)]"
          />
          <button type="submit" className="h-8 rounded-[9px] bg-[var(--accent)] px-2.5 text-[12.5px] font-semibold text-white">Saqlash</button>
        </form>
      )}
    </div>
  );
}

function StudentDialog({
  rel, loading, debts, cells, lessons, joinDate, onClose,
}: {
  rel: GroupStudent | null;
  loading: boolean;
  debts: any;
  cells?: Cells;
  lessons: LessonMeta[];
  joinDate?: string;
  onClose: () => void;
}) {
  const s = rel?.student;
  const st = rowStats(cells, lessons, joinDate);
  return (
    <Dialog open={!!rel} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        {s && (
          <>
            <DialogHeader>
              <DialogTitle>
                <Link href={`/students/${s.id}`} className="hover:text-[var(--accent-ink)] hover:underline underline-offset-4">
                  {s.first_name} {s.last_name}
                </Link>
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-0.5">
                  <p className="flex items-center gap-1.5"><Phone className="size-3.5" /> Shaxsiy: <span className="tabular">{s.phone_number || '—'}</span></p>
                  <p className="flex items-center gap-1.5"><Phone className="size-3.5" /> Ota-ona: <span className="tabular">{parentPhone(s)}</span></p>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-2">
              <Metric label="Kelgan" value={st.total ? `${Math.round((st.present / st.total) * 100)}%` : '—'} tone="ok" small />
              <Metric label="Kelmagan" value={st.absent} tone="bad" small />
              <Metric label="Belgilangan" value={st.total} small />
            </div>

            {st.maxStreak >= 3 && (
              <div className="flex items-center gap-2.5 rounded-[14px] bg-[color-mix(in_oklab,var(--bad)_10%,transparent)] p-3 text-[13px] text-[var(--bad)]">
                <AlertTriangle className="size-5 shrink-0" />
                <span><b className="font-semibold">{st.maxStreak} marta ketma-ket kelmagan.</b> Ota-onasi bilan bog&apos;laning.</span>
              </div>
            )}

            {loading ? (
              <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-24 w-full" /></div>
            ) : debts ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Metric label="Jami qarzdorlik" value={`${formatSum(debts.total_debt)} so'm`} tone={debts.total_debt > 0 ? 'bad' : undefined} small />
                  <Metric label="To'lagan summa" value={`${formatSum(debts.paid_total)} so'm`} tone="ok" small />
                </div>
                <MoneyList title="Qarzdor oylar" rows={debts.debts} tone="bad" empty="Qarzdorlik yo'q" />
                {debts.paid_payments?.length > 0 && <MoneyList title="To'langan oylar" rows={debts.paid_payments} tone="ok" />}
              </div>
            ) : (
              <p className="py-4 text-center text-[13.5px] text-[var(--muted-foreground)]">To&apos;lov ma&apos;lumoti yuklanmadi.</p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MoneyList({ title, rows, tone, empty }: { title: string; rows?: any[]; tone: 'ok' | 'bad'; empty?: string }) {
  return (
    <div>
      <h4 className="mb-1.5 text-[13px] font-semibold">{title}</h4>
      <div className="max-h-44 overflow-y-auto rounded-[14px] border border-[var(--border)]">
        {rows?.length ? rows.map((r: any, i: number) => (
          <div key={r.id ?? i} className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-3 py-2.5 last:border-0">
            <div className="min-w-0">
              <p className="text-[13.5px] font-medium">{r.month_name} {r.year}</p>
              <p className="truncate text-[12px] text-[var(--muted-foreground)]">{r.group_name}</p>
            </div>
            <span className={cn('tabular shrink-0 text-[13.5px] font-semibold', tone === 'ok' ? 'text-[var(--ok)]' : 'text-[var(--bad)]')}>
              {formatSum(r.amount)} so&apos;m
            </span>
          </div>
        )) : <p className="px-3 py-4 text-center text-[13px] text-[var(--muted-foreground)]">{empty}</p>}
      </div>
    </div>
  );
}

function Metric({ label, value, tone, small }: { label: string; value: React.ReactNode; tone?: 'ok' | 'warn' | 'bad'; small?: boolean }) {
  const color = tone === 'ok' ? 'text-[var(--ok)]' : tone === 'warn' ? 'text-[var(--warn)]' : tone === 'bad' ? 'text-[var(--bad)]' : 'text-[var(--foreground)]';
  return (
    <div className={cn('rounded-[14px] bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)]', small ? 'p-3' : 'p-3.5')}>
      <p className="text-[12px] font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className={cn('tabular mt-0.5 font-semibold tracking-[-0.02em]', small ? 'text-[17px]' : 'text-[24px]', color)}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-[var(--muted-foreground)]">{label}</dt>
      <dd className="tabular max-w-[60%] truncate font-semibold">{value}</dd>
    </div>
  );
}

function EmptyBlock({ icon: Icon, title, text }: { icon: typeof Users; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <Icon className="size-10 text-[var(--faint)] opacity-60" strokeWidth={1.6} />
      <p className="mt-3 text-[15px] font-semibold">{title}</p>
      <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">{text}</p>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="space-y-2 p-4" aria-busy="true" aria-label="Yuklanmoqda">
      <Skeleton className="h-10 w-full" />
      {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-11 w-full" />)}
    </div>
  );
}
