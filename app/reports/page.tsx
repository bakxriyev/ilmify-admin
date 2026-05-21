'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardApi, type DashboardStats } from '@/api/dashboard';
import { paymentsApi, type GroupPaymentSummary } from '@/api/paymentsApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import {
  TrendingUp, DollarSign, CreditCard, Users, GraduationCap, BookOpen,
  RefreshCw, AlertCircle, Building2, Wallet, Target, Award, Clock,
  UserCheck, UserX, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
const monthShort = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek'];

const formatSum = (n: number) => Math.floor(n).toLocaleString();

interface MonthlyIncome { month: number; total: number; }

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState<MonthlyIncome[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [studentGrowth, setStudentGrowth] = useState<{ labels: string[]; datasets: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [centerBalance, setCenterBalance] = useState(0);

  // Payments page dagi kabi studentsOverview dan qarzdorlik
  const [debtItems, setDebtItems] = useState<GroupPaymentSummary[]>([]);
  const [debtLoading, setDebtLoading] = useState(false);
  // Yil bo'yicha oylik to'lov statistikasi (paid/total)
  const [yearOverview, setYearOverview] = useState<{ month: number; total: number; paid: number; unpaid: number; partial: number }[]>([]);

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
      const adminRaw = localStorage.getItem('admin');
      if (adminRaw) {
        try {
          const admin = JSON.parse(adminRaw);
          if (admin?.center?.balance) setCenterBalance(Number(admin.center.balance));
        } catch {}
      }
    } catch {} finally { setLoading(false); }
  };

  const loadDebt = async () => {
    try {
      setDebtLoading(true);
      const overview = await paymentsApi.getStudentsOverview(month, year);
      setDebtItems(overview);
    } catch {} finally { setDebtLoading(false); }
  };

  useEffect(() => { loadData(); }, [year]);
  useEffect(() => { loadDebt(); }, [month, year]);

  // payments page dagi kabi hisoblash
  const paidCount = debtItems.filter(i => i.status === 'paid').length;
  const unpaidCount = debtItems.filter(i => i.status === 'unpaid').length;
  const partialCount = debtItems.filter(i => i.status === 'partial').length;
  const totalDebt = debtItems.reduce((sum, i) => sum + i.debt, 0);
  const debtorsCount = debtItems.filter(i => i.status !== 'paid').length;

  // Reja: studentlar * monthly_price = maqsad, tanlangan oydagi tushum = erishilgan
  const totalMonthlyPrice = debtItems.reduce((sum, i) => sum + i.monthly_price, 0);
  const currentMonthIncome = monthlyIncome[month - 1]?.total || 0;
  const planAchieved = currentMonthIncome;
  const planTarget = totalMonthlyPrice;
  const planPercent = planTarget > 0 ? Math.min(100, (planAchieved / planTarget) * 100) : 0;

  const incomeData = monthlyIncome.map(m => ({
    name: monthShort[m.month - 1],
    tushum: m.total,
  }));

  const growthData = studentGrowth?.labels?.map((label, i) => ({
    name: label,
    yangi: studentGrowth.datasets[0]?.data[i] || 0,
    jami: studentGrowth.datasets[1]?.data[i] || 0,
  })) || [];

  return (
    <Layout>
      <div className="space-y-6 p-6 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600" /> Moliyaviy hisobot
            </h1>
            <p className="text-gray-500 text-sm mt-1">{year} yil — Markaz faoliyati bo'yicha umumiy statistika</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <Button variant="outline" onClick={() => { loadData(); loadDebt(); }} className="border-gray-200 rounded-xl px-4">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Yangilash
            </Button>
          </div>
        </div>

        {/* Umumiy raqamlar */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-white/60 text-xs font-semibold tracking-widest uppercase">UMUMIY RAQAMLAR</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {debtLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24 rounded-xl bg-white/10" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/5 hover:bg-white/15 transition-all">
                  <p className="text-white/50 text-[11px] font-medium uppercase tracking-wider mb-1">Tushumlar</p>
                  <p className="text-xl font-bold text-emerald-400">{formatSum(totalIncome)} so'm</p>
                  <p className="text-white/30 text-[10px] mt-1">Jami to'langan</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/5 hover:bg-white/15 transition-all">
                  <p className="text-white/50 text-[11px] font-medium uppercase tracking-wider mb-1">Chiqimlar</p>
                  <p className="text-xl font-bold text-red-400">0 so'm</p>
                  <p className="text-white/30 text-[10px] mt-1">Hali kiritilmagan</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/5 hover:bg-white/15 transition-all">
                  <p className="text-white/50 text-[11px] font-medium uppercase tracking-wider mb-1">Foyda</p>
                  <p className="text-xl font-bold text-white">{formatSum(totalIncome)} so'm</p>
                  <p className="text-white/30 text-[10px] mt-1">Tushum - Chiqim</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/5 hover:bg-white/15 transition-all">
                  <p className="text-white/50 text-[11px] font-medium uppercase tracking-wider mb-1">Aktiv balans</p>
                  <p className="text-xl font-bold text-blue-400">{formatSum(centerBalance)} so'm</p>
                  <p className="text-white/30 text-[10px] mt-1">Hisobdagi mablag'</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/5 hover:bg-white/15 transition-all">
                  <p className="text-white/50 text-[11px] font-medium uppercase tracking-wider mb-1">Jami qarzdorlik</p>
                  <p className="text-xl font-bold text-red-400">{formatSum(totalDebt)} so'm</p>
                  <p className="text-white/30 text-[10px] mt-1">{debtorsCount} ta qarzdor</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/5 hover:bg-white/15 transition-all">
                  <p className="text-white/50 text-[11px] font-medium uppercase tracking-wider mb-1">LTV</p>
                  <p className="text-xl font-bold text-purple-400">0 so'm</p>
                  <p className="text-white/30 text-[10px] mt-1">Kelajakdagi funksiya</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reja bajarilishi + Qarzdorlik */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reja */}
          <Card className="border-0 shadow-md lg:col-span-2">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-gray-800 text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" /> {year}, {monthNames[month - 1]} — rejasi
              </CardTitle>
              <div className="flex gap-2">
                <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500">
                  {monthNames.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-48 rounded-xl" />
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 text-center border border-blue-200/50">
                      <p className="text-blue-600 text-[11px] font-semibold uppercase tracking-wider">Erishilgan</p>
                      <p className="text-xl font-bold text-blue-700 mt-1">{formatSum(planAchieved)} so'm</p>
                      <p className="text-blue-500 text-xs mt-1">{planPercent.toFixed(1)}% bajarildi</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-4 text-center border border-amber-200/50">
                      <p className="text-amber-600 text-[11px] font-semibold uppercase tracking-wider">Kutilayotgan</p>
                      <p className="text-xl font-bold text-amber-700 mt-1">{formatSum(planTarget)} so'm</p>
                      <p className="text-amber-500 text-xs mt-1">{debtItems.length} ta student</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-4 text-center border border-purple-200/50">
                      <p className="text-purple-600 text-[11px] font-semibold uppercase tracking-wider">Qarzdorlik</p>
                      <p className="text-xl font-bold text-purple-700 mt-1">{formatSum(totalDebt)} so'm</p>
                      <p className="text-purple-500 text-xs mt-1">{debtorsCount} ta qarzdor</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-4 text-center border border-emerald-200/50">
                      <p className="text-emerald-600 text-[11px] font-semibold uppercase tracking-wider">Joriy oy</p>
                      <p className="text-xl font-bold text-emerald-700 mt-1">{formatSum(currentMonthIncome)} so'm</p>
                      <p className="text-emerald-500 text-xs mt-1">Tushum</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden shadow-inner">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-1000 flex items-center justify-end pr-2" style={{ width: `${Math.min(100, planPercent)}%` }}>
                        <span className="text-[10px] text-white font-bold drop-shadow-sm">{planPercent.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Reja bajarilishi: {planPercent.toFixed(1)}%</span>
                      <span>Maqsad: {formatSum(planTarget)} so'm / {debtItems.length} ta student</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Qarzdorlik */}
          <Card className="border-0 shadow-md border-l-4 border-l-red-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-800 text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" /> Qarzdorlik
              </CardTitle>
            </CardHeader>
            <CardContent>
              {debtLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl p-4 text-center border border-red-200/50">
                    <p className="text-red-500 text-[11px] font-semibold uppercase tracking-wider">Jami qarzdorlik</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">{formatSum(totalDebt)} so'm</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-gray-400 text-[10px] uppercase tracking-wider">To'lagan</p>
                      <p className="text-lg font-bold text-green-600">{paidCount}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-gray-400 text-[10px] uppercase tracking-wider">Qisman</p>
                      <p className="text-lg font-bold text-amber-600">{partialCount}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-gray-400 text-[10px] uppercase tracking-wider">Qarzdor</p>
                      <p className="text-lg font-bold text-red-600">{unpaidCount}</p>
                    </div>
                  </div>
                  <div className="text-center pt-1">
                    <p className="text-xs text-gray-400">Jami studentlar: <span className="font-semibold text-gray-700">{debtItems.length}</span> ta</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* KPI stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Studentlar", value: stats?.total_students || 0, icon: Users, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
            { label: "O'qituvchilar", value: stats?.total_teachers || 0, icon: GraduationCap, color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-600' },
            { label: "Guruhlar", value: stats?.total_groups || 0, icon: BookOpen, color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-600' },
            { label: "Jami tushum", value: `${formatSum(totalIncome)} so'm`, icon: Wallet, color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
          ].map((kpi, i) => (
            <Card key={i} className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${kpi.bg}`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.text}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{kpi.label}</p>
                  {loading ? <Skeleton className="h-7 w-20 mt-1" /> : <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Monthly Income Chart */}
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="pb-2 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50/50">
            <CardTitle className="text-gray-800 text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" /> Oylik tushum ({year})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {loading ? (
              <Skeleton className="h-72 w-full rounded-xl" />
            ) : incomeData.every(d => d.tushum === 0) ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">To'lovlar mavjud emas</p>
                <p className="text-gray-400 text-sm mt-1">Ma'lumot yetarli emas</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={incomeData} barCategoryGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    formatter={(v: number) => `${formatSum(v)} so'm`}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="tushum" fill="url(#incomeGradient)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Kirim hisoboti + Student o'sishi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kirim hisoboti */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="text-gray-800 text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green-600" /> Kirim hisoboti
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-5"><Skeleton className="h-48 rounded-xl" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left py-3.5 px-4 text-gray-500 font-medium text-xs uppercase tracking-wider">Oy</th>
                        <th className="text-right py-3.5 px-4 text-gray-500 font-medium text-xs uppercase tracking-wider">Tushum</th>
                        <th className="text-right py-3.5 px-4 text-gray-500 font-medium text-xs uppercase tracking-wider">To'lovlar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyIncome.map((m, i) => {
                        const mo = yearOverview.find(y => y.month === m.month);
                        const total = mo?.total || 0;
                        const paid = mo?.paid || 0;
                        return (
                        <tr key={m.month} className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors ${i === month - 1 ? 'bg-blue-50/50' : ''}`}>
                          <td className="py-3 px-4">
                            <span className="text-gray-800 font-medium">{monthNames[m.month - 1]}</span>
                            {i === month - 1 && <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Joriy</span>}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-800">{formatSum(m.total)} so'm</td>
                          <td className="py-3 px-4 text-right">
                            {total > 0 ? (
                              <span className="font-medium">
                                <span className="text-green-600">{paid}</span>
                                <span className="text-gray-400">/{total}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student o'sishi */}
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="pb-2 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/50">
              <CardTitle className="text-gray-800 text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" /> Student o'sishi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              {loading ? (
                <Skeleton className="h-64 w-full rounded-xl" />
              ) : growthData.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400">Ma'lumot yo'q</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                    <Line type="monotone" dataKey="yangi" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} name="Yangi o'quvchilar" />
                    <Line type="monotone" dataKey="jami" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="Jami o'quvchilar" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
