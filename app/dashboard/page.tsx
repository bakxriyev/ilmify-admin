'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import {
  RefreshCw, UserPlus, Users, CheckCircle2, AlertTriangle, Wallet, CalendarDays,
  Trophy, ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell,
} from 'recharts';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import CenterStatusChecker from '@/components/CenterStatusChecker';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  dashboardApi, type DashboardStats, type ChartData, type TeacherStats,
  type StudentAttendance, type Activity,
} from '@/api/dashboard';
import { readAdmin } from '@/components/shell/useShellData';

/* Chart palettes per theme: SVG attributes cannot read CSS variables reliably. */
const PALETTE = {
  light: {
    accent: '#0a6cff', accentSoft: '#9cc3ff', ok: '#12a150', bad: '#e5484d',
    grid: 'rgba(15,23,42,0.07)', axis: '#7b8496',
    series: ['#0a6cff', '#12a150', '#e8930c', '#8b5cf6', '#e5484d', '#0ea5b7', '#d9468f', '#64748b'],
  },
  dark: {
    accent: '#3b8bff', accentSoft: '#2a4f8a', ok: '#3ccf7b', bad: '#ff6b6f',
    grid: 'rgba(255,255,255,0.07)', axis: '#8a92a3',
    series: ['#3b8bff', '#3ccf7b', '#f0b43c', '#a78bfa', '#ff6b6f', '#22c3d6', '#f472b6', '#94a3b8'],
  },
};

const nf = new Intl.NumberFormat('uz-UZ');
const fmt = (n: number | string | undefined | null) => nf.format(Number(n) || 0);

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Xayrli tun';
  if (h < 12) return 'Xayrli tong';
  if (h < 18) return 'Xayrli kun';
  return 'Xayrli kech';
}

export default function DashboardPage() {
  const { resolvedTheme } = useTheme();
  const [themeReady, setThemeReady] = useState(false);
  useEffect(() => setThemeReady(true), []);
  const P = themeReady && resolvedTheme === 'dark' ? PALETTE.dark : PALETTE.light;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [growth, setGrowth] = useState<ChartData | null>(null);
  const [distribution, setDistribution] = useState<ChartData | null>(null);
  const [byGroups, setByGroups] = useState<TeacherStats[]>([]);
  const [byStudents, setByStudents] = useState<TeacherStats[]>([]);
  const [bestAttendance, setBestAttendance] = useState<StudentAttendance[]>([]);
  const [monthly, setMonthly] = useState<ChartData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [admin, setAdmin] = useState<ReturnType<typeof readAdmin>>(null);

  useEffect(() => setAdmin(readAdmin()), []);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const r = await Promise.allSettled([
        dashboardApi.getStats(),
        dashboardApi.getStudentGrowth('month'),
        dashboardApi.getGroupDistribution(),
        dashboardApi.getTopTeachersByGroups(5),
        dashboardApi.getTopTeachersByStudents(5),
        dashboardApi.getBestAttendance(10),
        dashboardApi.getMonthlyAttendance(),
        dashboardApi.getRecentActivities(10),
      ]);
      const val = <T,>(i: number) => (r[i].status === 'fulfilled' ? (r[i] as PromiseFulfilledResult<T>).value : null);
      setStats(val<DashboardStats>(0));
      setGrowth(val<ChartData>(1));
      setDistribution(val<ChartData>(2));
      setByGroups(val<TeacherStats[]>(3) || []);
      setByStudents(val<TeacherStats[]>(4) || []);
      setBestAttendance(val<StudentAttendance[]>(5) || []);
      setMonthly(val<ChartData>(6));
      setActivities(val<Activity[]>(7) || []);
      if (r[0].status === 'rejected') {
        const reason: any = r[0].reason;
        setError(reason?.response?.data?.message || reason?.message || 'Serverga ulanib boʻlmadi');
      }
    } catch (err: any) {
      setError("Ma'lumotlarni yuklashda kutilmagan xatolik: " + (err?.message || 'nomaʼlum'));
      toast.error("Ma'lumotlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const firstName = admin?.full_name?.split(' ')[0];
  const center = admin?.center;

  return (
    <Layout>
      <CenterStatusChecker />
      <div className="mx-auto w-full max-w-[1480px] px-3 pt-2 pb-6 sm:px-4 md:px-1 md:pt-3">
        {/* Page head */}
        <div className="mb-5 flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] md:text-[30px]">
              {greeting()}{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-[var(--muted-foreground)]">
              <span className="inline-flex items-center gap-1.5 capitalize"><CalendarDays className="size-4" strokeWidth={1.8} />{today}</span>
              {center?.balance != null && (
                <span className="inline-flex items-center gap-1.5">
                  <Wallet className="size-4" strokeWidth={1.8} />
                  Balans: <span className="tabular font-semibold text-[var(--foreground)]">{fmt(center.balance)} so&apos;m</span>
                </span>
              )}
            </p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading} className="self-start sm:self-auto">
            <RefreshCw className={cn(loading && 'animate-spin')} />
            {loading ? 'Yangilanmoqda' : 'Yangilash'}
          </Button>
        </div>

        {loading && !stats ? (
          <DashboardSkeleton />
        ) : !stats ? (
          <ErrorState message={error} onRetry={load} loading={loading} />
        ) : (
          <div className="space-y-4">
            <KpiStrip stats={stats} P={P} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Panel className="lg:col-span-2" title="O'quvchilar o'sishi" note="Oylar kesimida yangi qo'shilganlar va jami soni">
                {growth?.labels?.length ? (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={growth.labels.map((l, i) => ({ name: l, yangi: growth.datasets[0]?.data[i] ?? 0, jami: growth.datasets[1]?.data[i] ?? 0 }))}
                        margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
                      >
                        <CartesianGrid vertical={false} stroke={P.grid} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: P.axis }} dy={6} />
                        <YAxis yAxisId="l" tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: P.axis }} allowDecimals={false} />
                        <YAxis yAxisId="r" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: P.axis }} allowDecimals={false} width={36} />
                        <Tooltip content={<GlassTooltip />} cursor={{ fill: P.grid }} />
                        <Bar yAxisId="l" dataKey="yangi" name="Yangi" fill={P.accent} radius={[6, 6, 2, 2]} maxBarSize={30} />
                        <Line yAxisId="r" dataKey="jami" name="Jami" stroke={P.ok} strokeWidth={2.25} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} type="monotone" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : <Empty text="O'sish ma'lumoti hali yig'ilmagan" />}
                <Legend items={[{ label: 'Yangi', color: P.accent, kind: 'bar' }, { label: 'Jami (oʻng oʻq)', color: P.ok, kind: 'line' }]} />
              </Panel>

              <Panel title="Darajalar bo'yicha" note="Guruhlar taqsimoti">
                <Distribution data={distribution} P={P} />
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Panel className="lg:col-span-2" title="Oylik davomat" note="Kelgan va kelmagan o'quvchilar">
                {monthly?.labels?.length ? (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthly.labels.map((l, i) => ({ name: l, keldi: monthly.datasets[0]?.data[i] ?? 0, kelmadi: monthly.datasets[1]?.data[i] ?? 0 }))}
                        margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
                      >
                        <CartesianGrid vertical={false} stroke={P.grid} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: P.axis }} dy={6} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: P.axis }} allowDecimals={false} />
                        <Tooltip content={<GlassTooltip />} cursor={{ fill: P.grid }} />
                        <Bar dataKey="keldi" name="Keldi" stackId="a" fill={P.ok} maxBarSize={34} />
                        <Bar dataKey="kelmadi" name="Kelmadi" stackId="a" fill={P.bad} radius={[6, 6, 0, 0]} maxBarSize={34} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <Empty text="Davomat hali belgilanmagan" />}
                <Legend items={[{ label: 'Keldi', color: P.ok, kind: 'bar' }, { label: 'Kelmadi', color: P.bad, kind: 'bar' }]} />
              </Panel>

              <Panel title="Eng yaxshi davomat" note="Yuqori foizli o'quvchilar" action={<PanelLink href="/attendance">Davomat</PanelLink>}>
                {bestAttendance.length ? (
                  <ol className="-mx-2 max-h-[300px] space-y-0.5 overflow-y-auto">
                    {bestAttendance.map((s, i) => (
                      <li key={s.id} className="flex items-center gap-3 rounded-[12px] px-2 py-2 hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)]">
                        <span className="tabular w-5 shrink-0 text-right text-[12.5px] font-medium text-[var(--faint)]">{i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium">{s.first_name} {s.last_name}</span>
                          <span className="block truncate text-[12px] text-[var(--muted-foreground)]">
                            {s.group_name} · <span className="tabular">{s.present}/{s.present + s.absent}</span> dars
                          </span>
                        </span>
                        <RatePill rate={s.attendance_rate} />
                      </li>
                    ))}
                  </ol>
                ) : <Empty text="Hali davomat ma'lumoti yo'q" />}
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <Panel title="Ko'p guruhli o'qituvchilar" note="Asosiy va yordamchi guruhlar" action={<PanelLink href="/teachers">Hammasi</PanelLink>}>
                <TeacherBars
                  rows={byGroups.map((t) => ({ id: t.id, name: `${t.first_name} ${t.last_name}`, value: t.total_groups, sub: `${t.main_groups ?? 0} asosiy · ${t.support_groups ?? 0} yordamchi` }))}
                  unit="guruh"
                  color={P.accent}
                />
              </Panel>
              <Panel title="Ko'p o'quvchili o'qituvchilar" note="Barcha guruhlari bo'yicha" action={<PanelLink href="/teachers">Hammasi</PanelLink>}>
                <TeacherBars
                  rows={byStudents.map((t) => ({ id: t.id, name: `${t.first_name} ${t.last_name}`, value: t.total_students ?? 0, sub: `${t.total_groups} ta guruh` }))}
                  unit="o'quvchi"
                  color={P.ok}
                />
              </Panel>
              <Panel className="lg:col-span-2 xl:col-span-1" title="So'nggi harakatlar" note="Markazdagi oxirgi o'zgarishlar">
                <Activities items={activities} />
              </Panel>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

/* -------------------------------------------------------------------------- */

function Panel({
  title, note, action, className, children,
}: { title: string; note?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn('lg-surface flex min-w-0 flex-col rounded-[22px] p-4 md:p-5', className)}>
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold leading-tight tracking-[-0.012em]">{title}</h2>
          {note && <p className="mt-0.5 text-[12.5px] text-[var(--muted-foreground)]">{note}</p>}
        </div>
        {action}
      </header>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}

function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-0.5 rounded-[9px] px-2 py-1 text-[12.5px] font-medium text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-soft)]"
    >
      {children} <ArrowUpRight className="size-3.5" />
    </Link>
  );
}

function KpiStrip({ stats, P }: { stats: DashboardStats; P: typeof PALETTE.light }) {
  const rate = Math.max(0, Math.min(100, Number(stats.attendance_rate) || 0));
  const rateTone = rate >= 80 ? P.ok : rate >= 60 ? '#e8930c' : P.bad;
  const cells = [
    { label: "Jami o'quvchilar", value: fmt(stats.total_students), sub: <><span className="font-semibold text-[var(--ok)]">+{fmt(stats.students_this_month)}</span> shu oyda</>, href: '/students' },
    { label: "O'qituvchilar", value: fmt(stats.total_teachers), sub: <>{fmt(stats.total_rooms)} ta xona</>, href: '/teachers' },
    { label: 'Guruhlar', value: fmt(stats.total_groups), sub: <>{fmt(stats.groups_with_lessons)} tasida dars bor</>, href: '/groups' },
  ];
  return (
    <section className="lg-surface grid grid-cols-2 overflow-hidden rounded-[22px] lg:grid-cols-4">
      {cells.map((c, i) => (
        <Link
          key={c.label}
          href={c.href}
          className={cn(
            'group relative flex flex-col gap-1 p-4 transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_3%,transparent)] md:p-5',
            i % 2 === 0 && 'border-r border-[var(--border)]',
            i < 2 && 'border-b border-[var(--border)] lg:border-b-0',
            i === 1 && 'lg:border-r',
          )}
        >
          <span className="flex items-center justify-between text-[13px] font-medium text-[var(--muted-foreground)]">
            {c.label}
            <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-70" />
          </span>
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04, ease: [0.2, 0.8, 0.2, 1] }}
            className="tabular text-[28px] font-semibold leading-none tracking-[-0.03em] md:text-[34px]"
          >
            {c.value}
          </motion.span>
          <span className="text-[12.5px] text-[var(--muted-foreground)]">{c.sub}</span>
        </Link>
      ))}
      <Link href="/attendance" className="group flex flex-col gap-1 p-4 transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_3%,transparent)] md:p-5">
        <span className="flex items-center justify-between text-[13px] font-medium text-[var(--muted-foreground)]">
          Davomat
          <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-70" />
        </span>
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12, ease: [0.2, 0.8, 0.2, 1] }}
          className="tabular text-[28px] font-semibold leading-none tracking-[-0.03em] md:text-[34px]"
        >
          {rate}<span className="text-[0.6em] font-medium text-[var(--muted-foreground)]">%</span>
        </motion.span>
        <span className="mt-1 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]" role="meter" aria-valuenow={rate} aria-valuemin={0} aria-valuemax={100} aria-label="Davomat foizi">
          <motion.span
            className="block h-full rounded-full"
            style={{ background: rateTone }}
            initial={{ width: 0 }}
            animate={{ width: `${rate}%` }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay: 0.15 }}
          />
        </span>
        <span className="text-[12.5px] text-[var(--muted-foreground)]">{fmt(stats.total_lessons)} ta dars asosida</span>
      </Link>
    </section>
  );
}

function Distribution({ data, P }: { data: ChartData | null; P: typeof PALETTE.light }) {
  const rows = useMemo(
    () => (data?.labels ?? []).map((l, i) => ({ name: l, value: Number(data?.datasets[0]?.data[i]) || 0 })).filter((r) => r.value > 0),
    [data],
  );
  const total = rows.reduce((a, r) => a + r.value, 0);
  if (!rows.length) return <Empty text="Darajalar bo'yicha guruh yo'q" />;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-[170px] w-[170px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" innerRadius={58} outerRadius={82} paddingAngle={2} cornerRadius={5} stroke="none" startAngle={90} endAngle={-270}>
              {rows.map((_, i) => <Cell key={i} fill={P.series[i % P.series.length]} />)}
            </Pie>
            <Tooltip content={<GlassTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="tabular text-[26px] font-semibold leading-none tracking-[-0.03em]">{fmt(total)}</p>
            <p className="mt-1 text-[12px] text-[var(--muted-foreground)]">guruh</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-1.5">
        {rows.map((r, i) => (
          <li key={r.name} className="flex items-center gap-2.5 text-[13px]">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: P.series[i % P.series.length] }} />
            <span className="min-w-0 flex-1 truncate">{r.name}</span>
            <span className="tabular font-semibold">{fmt(r.value)}</span>
            <span className="tabular w-10 text-right text-[var(--muted-foreground)]">{Math.round((r.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeacherBars({ rows, unit, color }: { rows: Array<{ id: number; name: string; value: number; sub: string }>; unit: string; color: string }) {
  if (!rows.length) return <Empty text="O'qituvchilar bo'yicha ma'lumot yo'q" />;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ol className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.id} className="flex items-center gap-3">
          <span className={cn(
            'grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold tabular',
            i === 0 ? 'bg-[color-mix(in_oklab,#e8930c_18%,transparent)] text-[#b86e00] dark:text-[#f0b43c]' : 'bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] text-[var(--muted-foreground)]',
          )}>
            {i === 0 ? <Trophy className="size-3.5" strokeWidth={2.2} /> : i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[13.5px] font-medium">{r.name}</span>
              <span className="tabular shrink-0 text-[13px] font-semibold">{fmt(r.value)} <span className="font-normal text-[var(--muted-foreground)]">{unit}</span></span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${(r.value / max) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
              />
            </div>
            <p className="mt-1 truncate text-[11.5px] text-[var(--muted-foreground)]">{r.sub}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Activities({ items }: { items: Activity[] }) {
  if (!items.length) return <Empty text="Hali harakatlar yo'q. Yangi student, guruh yoki davomat shu yerda ko'rinadi." />;
  const tone = (t: string) =>
    t === 'student' ? 'text-[var(--accent)] bg-[var(--accent-soft)]'
      : t === 'group' ? 'text-[#7c4ddb] bg-[color-mix(in_oklab,#8b5cf6_14%,transparent)] dark:text-[#b69cff]'
        : 'text-[var(--ok)] bg-[color-mix(in_oklab,var(--ok)_14%,transparent)]';
  return (
    <ol className="relative max-h-[340px] space-y-1 overflow-y-auto">
      {items.map((a, i) => (
        <li key={i} className="flex items-start gap-3 rounded-[12px] px-1 py-1.5">
          <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', tone(a.type))}>
            {a.icon === 'user' ? <UserPlus className="size-4" strokeWidth={2} /> : a.icon === 'group' ? <Users className="size-4" strokeWidth={2} /> : <CheckCircle2 className="size-4" strokeWidth={2} />}
          </span>
          <span className="min-w-0 flex-1 pt-0.5">
            <span className="block text-[13.5px] leading-snug">{a.message}</span>
            <span className="tabular block text-[11.5px] text-[var(--faint)]">
              {new Date(a.time).toLocaleString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function RatePill({ rate }: { rate: number }) {
  const tone = rate >= 80 ? 'var(--ok)' : rate >= 60 ? 'var(--warn)' : 'var(--bad)';
  return (
    <span
      className="tabular shrink-0 rounded-full px-2 py-0.5 text-[12.5px] font-semibold"
      style={{ color: tone, background: `color-mix(in oklab, ${tone} 14%, transparent)` }}
    >
      {rate}%
    </span>
  );
}

function Legend({ items }: { items: Array<{ label: string; color: string; kind: 'bar' | 'line' }> }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[var(--muted-foreground)]">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span className={it.kind === 'line' ? 'h-[3px] w-3.5 rounded-full' : 'size-2.5 rounded-[3px]'} style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="lg-panel min-w-[140px] rounded-[12px] px-3 py-2 text-[12.5px]">
      {label != null && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey ?? p.name} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          <span className="flex-1 text-[var(--muted-foreground)]">{p.name}</span>
          <span className="tabular font-semibold">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="grid h-full min-h-[160px] place-items-center px-6 text-center text-[13px] text-[var(--muted-foreground)]">
      {text}
    </div>
  );
}

function ErrorState({ message, onRetry, loading }: { message: string | null; onRetry: () => void; loading: boolean }) {
  return (
    <section className="lg-surface mx-auto flex max-w-lg flex-col items-center rounded-[24px] px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-[color-mix(in_oklab,var(--bad)_14%,transparent)] text-[var(--bad)]">
        <AlertTriangle className="size-6" strokeWidth={1.9} />
      </span>
      <h2 className="mt-4 text-[18px] font-semibold">Statistika yuklanmadi</h2>
      <p className="mt-1 text-[13.5px] text-[var(--muted-foreground)]">
        {message || "Server javob bermadi."} Internet aloqasini tekshirib, qayta urinib ko&apos;ring.
      </p>
      <Button onClick={onRetry} disabled={loading} className="mt-5">
        <RefreshCw className={cn(loading && 'animate-spin')} /> Qayta urinish
      </Button>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Yuklanmoqda">
      <Skeleton className="h-[120px] w-full rounded-[22px]" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-[340px] rounded-[22px] lg:col-span-2" />
        <Skeleton className="h-[340px] rounded-[22px]" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-[340px] rounded-[22px] lg:col-span-2" />
        <Skeleton className="h-[340px] rounded-[22px]" />
      </div>
    </div>
  );
}
