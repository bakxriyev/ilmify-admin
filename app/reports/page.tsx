'use client';

import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { dashboardApi, type DashboardStats } from '@/api/dashboard';
import { paymentsApi, type GroupPaymentSummary } from '@/api/paymentsApi';
import { reportsApi, type DailyListItem, type DailyReport, type ReportOverview } from '@/api/reportsApi';
import { expensesApi } from '@/api/expensesApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import {
  TrendingUp, DollarSign, CreditCard, Users, GraduationCap, BookOpen,
  RefreshCw, AlertCircle, Wallet, Target,
  ChevronDown, ChevronUp, Plus, Trash2,
  Calendar, ArrowUpCircle, ArrowDownCircle, Banknote, Landmark,
  PiggyBank, ArrowRightLeft, Search, X, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

const formatSum = (n: number) => {
  if (!n) return '0';
  return Math.floor(n).toLocaleString();
};

const paymentTypeLabel = (type: string | null) => {
  if (!type) return '-';
  const map: any = { click: 'Click', naqt: 'Naqd', karta: 'Karta' };
  return map[type] || type;
};

const paymentTypeColor = (type: string | null) => {
  if (!type) return 'bg-gray-100 text-gray-600';
  const map: any = {
    click: 'bg-blue-100 text-blue-700',
    naqt: 'bg-green-100 text-green-700',
    karta: 'bg-purple-100 text-purple-700',
  };
  return map[type] || 'bg-gray-100 text-gray-600';
};

const formatDateUzbek = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()}-${monthNames[d.getMonth()]} ${d.getFullYear()}`;
};

const formatDateShort = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()}-${monthNames[d.getMonth()]}`;
};

const getDayName = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0,0,0,0);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Bugun';
  if (diff === -1) return 'Kecha';
  const days = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
  return days[d.getDay()];
};

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState<{ month: number; total: number }[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [studentGrowth, setStudentGrowth] = useState<{ labels: string[]; datasets: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const [debtItems, setDebtItems] = useState<GroupPaymentSummary[]>([]);
  const [debtLoading, setDebtLoading] = useState(false);
  const [yearOverview, setYearOverview] = useState<{ month: number; total: number; paid: number; unpaid: number; partial: number }[]>([]);

  const [dailyList, setDailyList] = useState<DailyListItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [reportOverview, setReportOverview] = useState<ReportOverview | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [showAllDays, setShowAllDays] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, mi, sg, yo] = await Promise.all([
        dashboardApi.getStats(),
        paymentsApi.getMonthlyIncome(year),
        dashboardApi.getStudentGrowth('year'),
        paymentsApi.getYearOverview(year),
      ]);
      setStats(s);
      setMonthlyIncome(mi);
      setStudentGrowth(sg);
      setYearOverview(yo);
      const incomeRes = await paymentsApi.getStats();
      setTotalIncome(incomeRes.total_amount);
    } catch {} finally { setLoading(false); }
  };

  const loadDebt = async () => {
    try {
      setDebtLoading(true);
      const overview = await paymentsApi.getStudentsOverview(month, year);
      setDebtItems(overview);
    } catch {} finally { setDebtLoading(false); }
  };

  const loadDaily = useCallback(async () => {
    try {
      setDailyLoading(true);
      const [list, ov] = await Promise.all([
        reportsApi.getDailyList(),
        reportsApi.getOverview(),
      ]);
      setDailyList(list);
      setReportOverview(ov);
      // Preload more days automatically
      if (list.length < 30) {
        const oldest = list.length > 0 ? list[list.length - 1].date : new Date().toISOString().split('T')[0];
        const extraDates: string[] = [];
        const d = new Date(oldest + 'T00:00:00');
        for (let i = 0; i < 25; i++) {
          d.setDate(d.getDate() - 1);
          extraDates.push(d.toISOString().split('T')[0]);
        }
        Promise.all(extraDates.map(date =>
          reportsApi.getDaily(date).catch(() => null)
        )).then(results => {
          const extra: DailyListItem[] = [];
          for (const r of results) {
            if (r) {
              extra.push({
                date: r.date,
                total_income: r.total_income,
                income_count: r.incomes.length,
                total_expense: r.total_expense,
                expense_count: r.expenses.length,
                net: r.net,
              });
            }
          }
          if (extra.length > 0) {
            setDailyList(prev => {
              const existing = new Set(prev.map(x => x.date));
              const newItems = extra.filter(x => !existing.has(x.date));
              return [...prev, ...newItems].sort((a, b) => b.date.localeCompare(a.date));
            });
          }
        });
      }
    } catch {} finally { setDailyLoading(false); }
  }, []);

  const loadDetail = useCallback(async (date: string) => {
    try {
      setDetailLoading(true);
      const report = await reportsApi.getDaily(date);
      setDailyReport(report);
    } catch {} finally { setDetailLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [year]);
  useEffect(() => { loadDebt(); }, [month, year]);
  useEffect(() => { loadDaily(); }, []);
  useEffect(() => { loadDetail(selectedDate); }, [selectedDate]);

  const paidCount = debtItems.filter(i => i.status === 'paid').length;
  const unpaidCount = debtItems.filter(i => i.status === 'unpaid').length;
  const partialCount = debtItems.filter(i => i.status === 'partial').length;
  const totalDebt = debtItems.reduce((sum, i) => sum + i.debt, 0);
  const debtorsCount = debtItems.filter(i => i.status !== 'paid').length;

  const currentMonthIncome = monthlyIncome[month - 1]?.total || 0;
  const planAchieved = currentMonthIncome;
  const planTarget = totalDebt;
  const planPercent = planTarget > 0 ? Math.min(100, (planAchieved / planTarget) * 100) : 0;

  const incomeData = monthlyIncome.map(m => ({ name: monthNames[m.month - 1].slice(0,3), tushum: m.total }));
  const growthData = studentGrowth?.labels?.map((label, i) => ({
    name: label,
    yangi: studentGrowth.datasets[0]?.data[i] || 0,
    jami: studentGrowth.datasets[1]?.data[i] || 0,
  })) || [];

  const handleAddExpense = async () => {
    if (!expenseAmount || !expenseDesc) { toast.error('Summa va izohni kiriting'); return; }
    if (Number(expenseAmount) <= 0) { toast.error('Summa noto\'g\'ri'); return; }
    try {
      setExpenseSubmitting(true);
      await expensesApi.create({ amount: Number(expenseAmount), description: expenseDesc, date: expenseDate });
      toast.success('Chiqim qo\'shildi');
      setExpenseDialog(false);
      setExpenseAmount('');
      setExpenseDesc('');
      loadDetail(selectedDate);
      loadDaily();
    } catch { toast.error('Xatolik yuz berdi'); } finally { setExpenseSubmitting(false); }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await expensesApi.remove(id);
      toast.success('Chiqim o\'chirildi');
      setDeleteConfirm(null);
      loadDetail(selectedDate);
      loadDaily();
    } catch { toast.error('Xatolik yuz berdi'); }
  };

  const goToDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setDateInput('');
  };

  const goToday = () => goToDate(new Date().toISOString().split('T')[0]);

  const navigateDate = (delta: number) => {
    const sorted = [...dailyList].sort((a, b) => b.date.localeCompare(a.date));
    if (sorted.length === 0) return;
    const currentIdx = sorted.findIndex(d => d.date === selectedDate);
    let newIdx = currentIdx === -1 ? 0 : currentIdx + delta;
    if (newIdx < 0) newIdx = 0;
    if (newIdx >= sorted.length) newIdx = sorted.length - 1;
    goToDate(sorted[newIdx].date);
  };

  const loadMore = async () => {
    if (dailyList.length === 0) return;
    const lastDate = dailyList[dailyList.length - 1].date;
    const d = new Date(lastDate + 'T00:00:00');
    const dates: string[] = [];
    for (let i = 0; i < 10; i++) {
      d.setDate(d.getDate() - 1);
      dates.push(d.toISOString().split('T')[0]);
    }
    const results = await Promise.all(dates.map(date =>
      reportsApi.getDaily(date).catch(() => null)
    ));
    const existing = new Set(dailyList.map(x => x.date));
    const newItems: DailyListItem[] = [];
    for (const r of results) {
      if (r && !existing.has(r.date)) {
        newItems.push({
          date: r.date,
          total_income: r.total_income,
          income_count: r.incomes.length,
          total_expense: r.total_expense,
          expense_count: r.expenses.length,
          net: r.net,
        });
        existing.add(r.date);
      }
    }
    if (newItems.length > 0) {
      setDailyList(prev => [...prev, ...newItems].sort((a, b) => b.date.localeCompare(a.date)));
    }
  };

  const handleDateInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dateInput) goToDate(dateInput);
  };

  return (
    <Layout>
      <div className="space-y-5 p-4 md:p-6 w-full max-w-[1600px] mx-auto">
        {/* ========== HEADER ========== */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm">
              <Landmark className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Hisobotlar</h1>
              <p className="text-gray-400 text-xs mt-0.5">Kassa, kirim va chiqimlar</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <Button variant="outline" size="sm" onClick={() => { loadData(); loadDebt(); loadDaily(); loadDetail(selectedDate); }} className="border-gray-200 text-xs h-8">
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* ========== UMUMIY RAQAMLAR ========== */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-emerald-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative px-5 py-5">
            <p className="text-white/40 text-[10px] font-semibold tracking-[0.2em] uppercase mb-4">UMUMIY MOLIYAVIY KO'RSATKICHLAR</p>
            {debtLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-20 rounded-xl bg-white/5" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-all">
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">Tushumlar</p>
                  <p className="text-lg font-extrabold text-emerald-400">{formatSum(totalIncome)}</p>
                  <p className="text-white/20 text-[9px] mt-0.5">so'm</p>
                </div>
                <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-all">
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">Chiqimlar</p>
                  <p className="text-lg font-extrabold text-red-400">{reportOverview ? formatSum(reportOverview.total_expense) : '0'}</p>
                  <p className="text-white/20 text-[9px] mt-0.5">so'm</p>
                </div>
                <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-all">
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">Foyda</p>
                  <p className="text-lg font-extrabold text-white">{reportOverview ? formatSum(reportOverview.net) : formatSum(totalIncome)}</p>
                  <p className="text-white/20 text-[9px] mt-0.5">so'm</p>
                </div>
                <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-all">
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">Kassa</p>
                  <p className="text-lg font-extrabold text-blue-400">{reportOverview ? formatSum(reportOverview.cash_balance) : '0'}</p>
                  <p className="text-white/20 text-[9px] mt-0.5">so'm</p>
                </div>
                <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-all">
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">Qarzdorlik</p>
                  <p className="text-lg font-extrabold text-red-400">{formatSum(totalDebt)}</p>
                  <p className="text-white/20 text-[9px] mt-0.5">{debtorsCount} ta qarzdor</p>
                </div>
                <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-all">
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">Guruhli studentlar</p>
                  <p className="text-lg font-extrabold text-purple-400">{reportOverview?.students_with_group || 0}</p>
                  <p className="text-white/20 text-[9px] mt-0.5">Jami: {stats?.total_students || 0}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========== REJA + QARZDORLIK ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-gray-800 font-bold flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" /> {year}, {monthNames[month - 1]} — rejasi
              </h3>
              <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-gray-50 outline-none">
                {monthNames.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
              </select>
            </div>
            <div className="p-5">
              {loading ? (
                <Skeleton className="h-40 rounded-xl" />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
                      <p className="text-blue-500 text-[10px] font-bold uppercase tracking-wider">Erishilgan</p>
                      <p className="text-xl font-extrabold text-blue-700 mt-1">{formatSum(planAchieved)} so'm</p>
                      <p className="text-blue-400 text-xs font-semibold mt-0.5">{planPercent.toFixed(1)}%</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 text-center border border-amber-200">
                      <p className="text-amber-500 text-[10px] font-bold uppercase tracking-wider">Kutilayotgan</p>
                      <p className="text-xl font-extrabold text-amber-700 mt-1">{formatSum(planTarget)} so'm</p>
                      <p className="text-amber-400 text-xs font-semibold mt-0.5">{debtorsCount} ta qarzdor</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
                      <p className="text-purple-500 text-[10px] font-bold uppercase tracking-wider">Qarzdorlik</p>
                      <p className="text-xl font-extrabold text-purple-700 mt-1">{formatSum(totalDebt)} so'm</p>
                      <p className="text-purple-400 text-xs font-semibold mt-0.5">{debtorsCount} ta</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 text-center border border-emerald-200">
                      <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">Joriy oy</p>
                      <p className="text-xl font-extrabold text-emerald-700 mt-1">{formatSum(currentMonthIncome)} so'm</p>
                      <p className="text-emerald-400 text-xs font-semibold mt-0.5">tushum</p>
                    </div>
                  </div>
                  <div>
                    <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end pr-2.5 transition-all duration-1000" style={{ width: `${Math.min(100, planPercent)}%` }}>
                        <span className="text-[10px] text-white font-extrabold drop-shadow">{planPercent.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                      <span>Bajarilish: {planPercent.toFixed(1)}%</span>
                      <span>Maqsad: {formatSum(planTarget)} so'm</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-l-4 border-l-red-400 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-gray-800 font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" /> Qarzdorlik
              </h3>
            </div>
            <div className="p-5">
              {debtLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 text-center border border-red-200">
                    <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Jami qarzdorlik</p>
                    <p className="text-2xl font-extrabold text-red-600">{formatSum(totalDebt)} so'm</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-gray-400 text-[8px] uppercase tracking-wider font-semibold">To'lagan</p>
                      <p className="text-xl font-extrabold text-green-600">{paidCount}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-gray-400 text-[8px] uppercase tracking-wider font-semibold">Qisman</p>
                      <p className="text-xl font-extrabold text-amber-600">{partialCount}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-gray-400 text-[8px] uppercase tracking-wider font-semibold">Qarzdor</p>
                      <p className="text-xl font-extrabold text-red-600">{unpaidCount}</p>
                    </div>
                  </div>
                  <p className="text-center text-xs text-gray-400">Jami: <span className="font-bold text-gray-700">{debtItems.length} ta</span> student</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========== KPI ========== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Guruhli", value: reportOverview?.students_with_group || 0, icon: Users, clr: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', txt: 'text-blue-600' },
            { label: "O'qituvchilar", value: stats?.total_teachers || 0, icon: GraduationCap, clr: 'from-green-500 to-green-600', bg: 'bg-green-50', txt: 'text-green-600' },
            { label: "Guruhlar", value: stats?.total_groups || 0, icon: BookOpen, clr: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', txt: 'text-purple-600' },
            { label: "Jami tushum", value: `${formatSum(totalIncome)} so'm`, icon: Wallet, clr: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', txt: 'text-emerald-600' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all">
              <div className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${kpi.clr} shadow-sm`}>
                  <kpi.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{kpi.label}</p>
                  {loading ? <Skeleton className="h-7 w-20 mt-1" /> : <p className="text-xl font-extrabold text-gray-900">{kpi.value}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ========== CHART + TABLITSALAR ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Oylik tushum charti */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50/50">
              <h3 className="text-gray-800 font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" /> Oylik tushum ({year})
              </h3>
            </div>
            <div className="p-5">
              {loading ? (
                <Skeleton className="h-64 rounded-xl" />
              ) : incomeData.every(d => d.tushum === 0) ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-semibold">To'lovlar mavjud emas</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={incomeData} barCategoryGap={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(v: number) => `${formatSum(v)} so'm`} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
                    <Bar dataKey="tushum" fill="url(#incGrad)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Kirim hisoboti */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-gray-800 font-bold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green-600" /> Kirim hisoboti
              </h3>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-5"><Skeleton className="h-48 rounded-xl" /></div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left py-3.5 px-4 text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Oy</th>
                      <th className="text-right py-3.5 px-4 text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Tushum</th>
                      <th className="text-right py-3.5 px-4 text-gray-400 text-[10px] font-semibold uppercase tracking-wider">To'lovlar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyIncome.map((m, i) => {
                      const mo = yearOverview.find(y => y.month === m.month);
                      return (
                      <tr key={m.month} className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors ${i === month - 1 ? 'bg-blue-50/50' : ''}`}>
                        <td className="py-3 px-4">
                          <span className="text-gray-800 font-semibold text-sm">{monthNames[m.month - 1]}</span>
                          {i === month - 1 && <span className="ml-2 text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">Joriy</span>}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-gray-800">{formatSum(m.total)} so'm</td>
                        <td className="py-3 px-4 text-right">
                          {mo && mo.total > 0 ? (
                            <span className="font-bold">
                              <span className="text-green-600">{mo.paid}</span>
                              <span className="text-gray-300">/{mo.total}</span>
                            </span>
                          ) : <span className="text-gray-300">-</span>}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Student o'sishi */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden lg:col-span-2">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/50">
              <h3 className="text-gray-800 font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" /> Student o'sishi
              </h3>
            </div>
            <div className="p-5">
              {loading ? (
                <Skeleton className="h-56 rounded-xl" />
              ) : growthData.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Ma'lumot yo'q</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                    <Line type="monotone" dataKey="yangi" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 2 }} name="Yangi" />
                    <Line type="monotone" dataKey="jami" stroke="#10b981" strokeWidth={2.5} dot={{ r: 2 }} name="Jami" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ========== KUNLIK KIRIM/CHIQIM ========== */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 md:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base">Kunlik kirim/chiqim</h2>
                  <p className="text-blue-100 text-xs mt-0.5">Sana bo'yicha operatsiyalar</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setShowStats(true)} className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs h-8 backdrop-blur">
                  <Users className="h-3.5 w-3.5 mr-1" /> Studentlar
                </Button>
                <Button size="sm" onClick={() => setExpenseDialog(true)} className="bg-red-500 hover:bg-red-600 text-white border-0 text-xs h-8 shadow-sm">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Chiqim
                </Button>
              </div>
            </div>
          </div>

          {reportOverview && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-px bg-gray-100">
              {[
                { label: "Kassadagi pul", value: `${formatSum(reportOverview.cash_balance)} so'm`, cls: 'text-emerald-600' },
                { label: "Jami kirim", value: `${formatSum(reportOverview.total_income)} so'm`, cls: 'text-blue-600' },
                { label: "Jami chiqim", value: `${formatSum(reportOverview.total_expense)} so'm`, cls: 'text-red-500' },
                { label: "Sof foyda", value: `${formatSum(reportOverview.net)} so'm`, cls: reportOverview.net >= 0 ? 'text-emerald-600' : 'text-red-500' },
                { label: "Oy boshidan", value: `${formatSum(reportOverview.current_month_income)} so'm`, cls: 'text-amber-600' },
                { label: "Guruhli studentlar", value: `${reportOverview.students_with_group} ta`, cls: 'text-blue-600' },
                { label: "Jami studentlar", value: `${reportOverview.total_students} ta`, cls: 'text-gray-500' },
              ].map((item, i) => (
                <div key={i} className="bg-white p-3 md:p-4 flex flex-col justify-center min-h-[70px]">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">{item.label}</p>
                  <p className={`text-sm md:text-base font-bold ${item.cls} leading-tight`}>{item.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-gray-50 border-b border-gray-100 px-4 md:px-6 py-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => navigateDate(1)} className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50">
                  <ChevronUp className="h-4 w-4 rotate-270" />
                </Button>
                <div className="text-center min-w-[140px]">
                  <p className="text-sm font-bold text-gray-800">{formatDateUzbek(selectedDate)}</p>
                  <p className="text-[10px] text-blue-500 font-medium">{getDayName(selectedDate)}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigateDate(-1)} className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50">
                  <ChevronDown className="h-4 w-4 rotate-270" />
                </Button>
                <Button size="sm" variant="ghost" onClick={goToday} className="text-xs h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium px-3">
                  Bugun
                </Button>
              </div>
              <form onSubmit={handleDateInputSubmit} className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dateInput || selectedDate}
                  onChange={e => { setDateInput(e.target.value); goToDate(e.target.value); }}
                  className="h-8 text-xs w-[140px] border-gray-200 bg-white"
                />
              </form>
            </div>
          </div>

          <div className="px-4 md:px-6 py-4">
            {detailLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            ) : dailyReport ? (
              <div className="space-y-4">
                {(dailyReport.incomes.length > 0 || dailyReport.expenses.length > 0) ? (
                  <>
                    {/* Kunlik jami tushum va chiqim */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-4 border border-emerald-200 shadow-sm">
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                          <ArrowUpCircle className="h-3 w-3" /> Kunlik tushum
                        </p>
                        <p className="text-xl font-extrabold text-emerald-600 mt-1">+{formatSum(dailyReport.total_income)} so'm</p>
                        <p className="text-[10px] text-emerald-400">{dailyReport.incomes.length} ta to'lov</p>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-white rounded-xl p-4 border border-red-200 shadow-sm">
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1">
                          <ArrowDownCircle className="h-3 w-3" /> Kunlik chiqim
                        </p>
                        <p className="text-xl font-extrabold text-red-500 mt-1">-{formatSum(dailyReport.total_expense)} so'm</p>
                        <p className="text-[10px] text-red-400">{dailyReport.expenses.length} ta chiqim</p>
                      </div>
                    </div>

                    {/* Vaqt bo'yicha aralash grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                      {[...dailyReport.incomes.map(i => ({ ...i, _type: 'income' as const })), ...dailyReport.expenses.map(e => ({ ...e, _type: 'expense' as const }))]
                        .sort((a, b) => {
                          const ta = a._type === 'income' ? (a as any).created_at : (a as any).created_at;
                          const tb = b._type === 'income' ? (b as any).created_at : (b as any).created_at;
                          if (!ta && !tb) return 0;
                          if (!ta) return 1;
                          if (!tb) return -1;
                          return new Date(ta).getTime() - new Date(tb).getTime();
                        })
                        .map((item) => item._type === 'income' ? (
                          <div key={(item as any).id} className="bg-gradient-to-r from-emerald-50 to-white rounded-xl p-3 md:p-4 border border-emerald-100 shadow-sm hover:shadow transition-all">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">Kirim</span>
                                  <span className="font-bold text-gray-800 text-sm">{(item as any).student_name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 flex-wrap">
                                  <span>{(item as any).student_phone}</span>
                                  <span className="text-gray-300">|</span>
                                  <span className="font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{(item as any).group_name}</span>
                                  <span className={`px-1.5 py-0.5 rounded font-semibold ${paymentTypeColor((item as any).payment_type)}`}>
                                    {paymentTypeLabel((item as any).payment_type)}
                                  </span>
                                </div>
                                {(item as any).created_at && (
                                  <p className="text-[9px] text-gray-300 mt-1">
                                    {new Date((item as any).created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-base font-bold text-emerald-600">+{formatSum((item as any).amount)}</p>
                                <p className="text-[8px] text-emerald-400 font-medium uppercase tracking-wider">so'm</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div key={(item as any).id} className="bg-gradient-to-r from-red-50 to-white rounded-xl p-3 md:p-4 border border-red-100 shadow-sm hover:shadow transition-all group">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">Chiqim</span>
                                  <span className="font-semibold text-gray-800 text-sm">{(item as any).description}</span>
                                </div>
                                {(item as any).created_at && (
                                  <p className="text-[9px] text-gray-300 mt-1">
                                    {new Date((item as any).created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <div className="text-right">
                                  <p className="text-base font-bold text-red-500">-{formatSum((item as any).amount)}</p>
                                  <p className="text-[8px] text-red-400 font-medium uppercase tracking-wider">so'm</p>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm((item as any).id); }}
                                  className="p-1.5 rounded-lg text-gray-200 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Kun yakuni */}
                    <div className={`rounded-2xl p-4 text-center border-2 ${
                      dailyReport.net >= 0
                        ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300'
                        : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300'
                    }`}>
                      <p className="text-xs font-semibold opacity-60 uppercase tracking-wider">Kun yakuni</p>
                      <p className={`text-2xl font-extrabold ${dailyReport.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {dailyReport.net >= 0 ? '+' : ''}{formatSum(dailyReport.net)} so'm
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100">
                      <Banknote className="h-8 w-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-sm font-semibold">Bu kunda operatsiyalar mavjud emas</p>
                    <p className="text-gray-300 text-xs mt-1">Na kirim, na chiqim qayd etilmagan</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="border-t border-gray-100">
            <div className="px-4 md:px-6 py-3 bg-gray-50/50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Boshqa kunlar</p>
            </div>
            {dailyLoading ? (
              <div className="p-4 space-y-2">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
              </div>
            ) : dailyList.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {dailyList.slice(0, showAllDays ? undefined : 3).map((item) => (
                  <button
                    key={item.date}
                    onClick={() => goToDate(item.date)}
                    className={`w-full flex items-center justify-between px-4 md:px-6 py-3.5 transition-all hover:bg-blue-50/50 ${
                      selectedDate === item.date ? 'bg-blue-50 border-l-3 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${
                        selectedDate === item.date
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {new Date(item.date + 'T00:00:00').getDate()}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-800">{formatDateShort(item.date)}</p>
                        <p className="text-[10px] text-gray-400">{getDayName(item.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-600">+{formatSum(item.total_income)}</p>
                        {item.total_expense > 0 && (
                          <p className="text-xs font-bold text-red-500">-{formatSum(item.total_expense)}</p>
                        )}
                      </div>
                      <div className={`text-right min-w-[60px] ${
                        item.net >= 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        <p className="text-xs font-extrabold">{item.net >= 0 ? '+' : ''}{formatSum(item.net)}</p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider">sof</p>
                      </div>
                    </div>
                  </button>
                ))}
                {dailyList.length > 3 && (
                  <button
                    onClick={() => setShowAllDays(!showAllDays)}
                    className="w-full py-3 text-center text-xs font-semibold transition-colors hover:bg-gray-50 flex items-center justify-center gap-1.5"
                  >
                    {showAllDays ? (
                      <><ChevronUp className="h-3.5 w-3.5" /> Yopish</>
                    ) : (
                      <><ChevronDown className="h-3.5 w-3.5" /> Ko'proq ko'rish ({dailyList.length} ta)</>
                    )}
                  </button>
                )}
                {showAllDays && (
                  <button
                    onClick={loadMore}
                    className="w-full py-3 text-center text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50/50 transition-colors font-semibold"
                  >
                    Ko'proq yuklash
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <ArrowRightLeft className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Ma'lumot topilmadi</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== DIALOGLAR ========== */}
      <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 rounded-lg"><ArrowDownCircle className="h-4 w-4 text-red-500" /></div>
              Chiqim qo'shish
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Summa (so'm)</label>
              <Input type="number" placeholder="50000" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="h-11 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Izoh</label>
              <Input placeholder="Nima uchun chiqim?" value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} className="h-11 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Sana</label>
              <Input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="h-11 text-sm" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExpenseDialog(false)} className="text-sm h-11">Bekor qilish</Button>
            <Button onClick={handleAddExpense} disabled={expenseSubmitting} className="bg-red-500 hover:bg-red-600 text-white text-sm h-11 px-6">
              {expenseSubmitting ? "Qo'shilmoqda..." : "Chiqimni qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Chiqimni o'chirish</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">Bu chiqimni o'chirishni xohlaysizmi? Pul kassaga qaytariladi.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="text-sm h-10">Bekor qilish</Button>
            <Button onClick={() => deleteConfirm && handleDeleteExpense(deleteConfirm)} className="bg-red-500 hover:bg-red-600 text-white text-sm h-10">O'chirish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg"><Users className="h-4 w-4 text-blue-500" /></div>
              Studentlar statistikasi
            </DialogTitle>
          </DialogHeader>
          {reportOverview ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-5 text-center border border-emerald-200">
                  <p className="text-emerald-400 text-[9px] font-bold uppercase tracking-wider">Guruhli studentlar</p>
                  <p className="text-3xl font-extrabold text-emerald-700 mt-1">{reportOverview.students_with_group}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 text-center border border-blue-200">
                  <p className="text-blue-400 text-[9px] font-bold uppercase tracking-wider">Jami studentlar</p>
                  <p className="text-3xl font-extrabold text-blue-700 mt-1">{reportOverview.total_students}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 text-center border border-amber-200">
                  <p className="text-amber-400 text-[9px] font-bold uppercase tracking-wider">Guruhsiz studentlar</p>
                  <p className="text-3xl font-extrabold text-amber-700 mt-1">{reportOverview.students_without_group}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 text-center border border-purple-200">
                  <p className="text-purple-400 text-[9px] font-bold uppercase tracking-wider">Kassadagi pul</p>
                  <p className="text-3xl font-extrabold text-purple-700 mt-1">{formatSum(reportOverview.cash_balance)} so'm</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-gray-400 text-[9px] uppercase tracking-wider font-semibold">Jami tushum</p>
                    <p className="text-lg font-extrabold text-emerald-600">{formatSum(reportOverview.total_income)} so'm</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[9px] uppercase tracking-wider font-semibold">Jami chiqim</p>
                    <p className="text-lg font-extrabold text-red-500">{formatSum(reportOverview.total_expense)} so'm</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400 text-sm">Yuklanmoqda...</div>
          )}
          <DialogFooter><Button onClick={() => setShowStats(false)} className="text-sm h-10">Yopish</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
