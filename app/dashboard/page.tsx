'use client';

import { ReactNode, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import CenterStatusChecker from '../../components/CenterStatusChecker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, GraduationCap, BookOpen, DoorOpen, Calendar, UserPlus,
  UserCircle, School, BarChart3, TrendingUp, Clock, CheckCircle,
  XCircle, Loader2, RefreshCw, Trophy, ArrowUpRight, Eye, Building, DollarSign, AlertTriangle,
} from 'lucide-react';
import { dashboardApi, type DashboardStats, type ChartData, type TeacherStats, type StudentAttendance, type Activity } from '@/api/dashboard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: ReactNode;
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDashboard, setIsDashboard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [studentGrowth, setStudentGrowth] = useState<ChartData | null>(null);
  const [groupDistribution, setGroupDistribution] = useState<ChartData | null>(null);
  const [topTeachersByGroups, setTopTeachersByGroups] = useState<TeacherStats[]>([]);
  const [topTeachersByStudents, setTopTeachersByStudents] = useState<TeacherStats[]>([]);
  const [bestAttendance, setBestAttendance] = useState<StudentAttendance[]>([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState<ChartData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [adminCenter, setAdminCenter] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');
      if (admin?.center) setAdminCenter(admin.center);
    } catch {}
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const isDash = pathname === '/dashboard' || pathname === '/';
    setIsDashboard(isDash);
    if (isDash) loadAllData();
  }, [pathname]);

  const loadAllData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('Dashboard loadAllData started');
      const results = await Promise.allSettled([
        dashboardApi.getStats(),
        dashboardApi.getStudentGrowth('month'),
        dashboardApi.getGroupDistribution(),
        dashboardApi.getTopTeachersByGroups(5),
        dashboardApi.getTopTeachersByStudents(5),
        dashboardApi.getBestAttendance(10),
        dashboardApi.getMonthlyAttendance(),
        dashboardApi.getRecentActivities(10),
      ]);
      console.log('Dashboard results:', results.map(r => r.status));

      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`Dashboard API #${i} failed:`, r.reason);
        }
      });

      if (results[0].status === 'fulfilled') setStats(results[0].value as DashboardStats);
      else console.error('getStats rejected:', results[0].reason);
      if (results[1].status === 'fulfilled') setStudentGrowth(results[1].value as ChartData);
      if (results[2].status === 'fulfilled') setGroupDistribution(results[2].value as ChartData);
      if (results[3].status === 'fulfilled') setTopTeachersByGroups(results[3].value as TeacherStats[]);
      if (results[4].status === 'fulfilled') setTopTeachersByStudents(results[4].value as TeacherStats[]);
      if (results[5].status === 'fulfilled') setBestAttendance(results[5].value as StudentAttendance[]);
      if (results[6].status === 'fulfilled') setMonthlyAttendance(results[6].value as ChartData);
      if (results[7].status === 'fulfilled') setActivities(results[7].value as Activity[]);

      if (results[0].status === 'rejected') {
        const reason = results[0].reason;
        setError(reason?.response?.data?.message || reason?.message || 'Serverga ulanishda xatolik');
      }
    } catch (err: any) {
      console.error('Dashboard loadAllData crashed:', err);
      setError("Ma'lumotlarni yuklashda kutilmagan xatolik: " + (err?.message || 'unknown'));
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  const today = new Date().toLocaleDateString('uz-UZ', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const renderDashboard = () => {
    if (loading && !stats) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 rounded-xl lg:col-span-2" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      );
    }

    if (!stats) {
      return (
        <div className="space-y-6">
          <Card className="border-0 shadow-lg rounded-xl border-red-200">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mb-3" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Ma'lumot yuklanmadi</h2>
              <p className="text-sm text-gray-500 mb-4">{error || 'Statistika ma\'lumotlari olinmadi'}</p>
              <Button onClick={loadAllData} variant="outline" className="gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Qayta urinish
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    const kpiCards = [
      { label: "Jami o'quvchilar", value: stats.total_students.toLocaleString(), icon: Users, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', sub: `+${stats.students_this_month} shu oyda` },
      { label: "O'qituvchilar", value: stats.total_teachers.toLocaleString(), icon: GraduationCap, color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-600', sub: `Jami` },
      { label: 'Guruhlar', value: stats.total_groups.toLocaleString(), icon: BookOpen, color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-600', sub: `${stats.groups_with_lessons} tasida dars bor` },
      { label: 'Davomat', value: `${stats.attendance_rate}%`, icon: Clock, color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', sub: `${stats.total_lessons} ta dars` },
    ];

    return (
      <div className="space-y-4 md:space-y-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-white mb-0.5">Boshqaruv paneli</h1>
                <p className="text-blue-100 text-sm">Xush kelibsiz! Bugungi platforma holati.</p>
                {adminCenter && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-blue-200 text-xs md:text-sm">
                    <span className="flex items-center gap-1"><Building className="h-3 w-3" /> {adminCenter.name}</span>
                    <span className="w-1 h-1 rounded-full bg-blue-300 hidden md:inline-block" />
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {Number(adminCenter.balance).toLocaleString()} so'm</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <p className="text-xs md:text-sm text-blue-200 hidden sm:block">{today}</p>
                <Button onClick={loadAllData} variant="secondary" size="sm" className="bg-white/20 text-white hover:bg-white/30 border-0 h-8 text-xs">
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                  Yangilash
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {kpiCards.map((kpi, i) => (
            <Card key={i} className="border-0 shadow-md rounded-xl">
              <CardContent className="p-3 md:p-5">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <p className="text-[10px] md:text-sm text-gray-500 font-medium truncate">{kpi.label}</p>
                  <div className={`p-1.5 md:p-2.5 rounded-lg ${kpi.bg}`}>
                    <kpi.icon className={`h-3.5 w-3.5 md:h-5 md:w-5 ${kpi.text}`} />
                  </div>
                </div>
                <p className="text-xl md:text-3xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-[9px] md:text-xs text-gray-400 mt-0.5 md:mt-1 truncate">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="border-0 shadow-md rounded-xl lg:col-span-2">
            <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-base md:text-lg text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                O'quvchilar o'sishi
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 md:px-6">
              {studentGrowth ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={studentGrowth.labels.map((l, i) => ({
                    name: l,
                    yangi: studentGrowth.datasets[0].data[i],
                    jami: studentGrowth.datasets[1].data[i],
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="yangi" name="Yangi o'quvchilar" fill="#3b82f6" radius={[4,4,0,0]} />
                    <Bar dataKey="jami" name="Jami o'quvchilar" fill="#10b981" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Ma'lumot yo'q</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md rounded-xl">
            <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-base md:text-lg text-gray-900 flex items-center gap-2">
                <School className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                Darajalar bo'yicha
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 md:px-6">
              {groupDistribution ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={groupDistribution.labels.map((l, i) => ({
                        name: l,
                        value: groupDistribution.datasets[0].data[i],
                      }))}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      paddingAngle={3} dataKey="value"
                    >
                      {groupDistribution.labels.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Ma'lumot yo'q</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card className="border-0 shadow-md rounded-xl">
            <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-base md:text-lg text-gray-900 flex items-center gap-2">
                <Trophy className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
                Eng ko'p guruhi bor o'qituvchilar
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 md:px-6">
              {topTeachersByGroups.length > 0 ? (
                <div className="overflow-x-auto -mx-2 md:mx-0">
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-1.5 md:px-2 text-gray-500 font-medium">#</th>
                        <th className="text-left py-2 px-1.5 md:px-2 text-gray-500 font-medium">O'qituvchi</th>
                        <th className="text-center py-2 px-1.5 md:px-2 text-gray-500 font-medium">Asosiy</th>
                        <th className="text-center py-2 px-1.5 md:px-2 text-gray-500 font-medium">Yordamchi</th>
                        <th className="text-center py-2 px-1.5 md:px-2 text-gray-500 font-medium">Jami</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topTeachersByGroups.map((t, i) => (
                        <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-1.5 md:px-2 text-gray-400">{i + 1}</td>
                          <td className="py-2 px-1.5 md:px-2">
                            <span className="font-medium text-gray-900 text-xs md:text-sm">{t.first_name} {t.last_name}</span>
                          </td>
                          <td className="py-2 px-1.5 md:px-2 text-center">{t.main_groups}</td>
                          <td className="py-2 px-1.5 md:px-2 text-center">{t.support_groups}</td>
                          <td className="py-2 px-1.5 md:px-2 text-center font-bold text-blue-600">{t.total_groups}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-6 text-sm">Ma'lumot yo'q</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md rounded-xl">
            <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-base md:text-lg text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                Eng ko'p o'quvchisi bor o'qituvchilar
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 md:px-6">
              {topTeachersByStudents.length > 0 ? (
                <div className="overflow-x-auto -mx-2 md:mx-0">
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-1.5 md:px-2 text-gray-500 font-medium">#</th>
                        <th className="text-left py-2 px-1.5 md:px-2 text-gray-500 font-medium">O'qituvchi</th>
                        <th className="text-center py-2 px-1.5 md:px-2 text-gray-500 font-medium">Guruhlar</th>
                        <th className="text-center py-2 px-1.5 md:px-2 text-gray-500 font-medium">O'quvchilar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topTeachersByStudents.map((t, i) => (
                        <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-1.5 md:px-2 text-gray-400">{i + 1}</td>
                          <td className="py-2 px-1.5 md:px-2">
                            <span className="font-medium text-gray-900 text-xs md:text-sm">{t.first_name} {t.last_name}</span>
                          </td>
                          <td className="py-2 px-1.5 md:px-2 text-center">{t.total_groups}</td>
                          <td className="py-2 px-1.5 md:px-2 text-center font-bold text-green-600">{t.total_students}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-6 text-sm">Ma'lumot yo'q</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="border-0 shadow-md rounded-xl lg:col-span-2">
            <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-base md:text-lg text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                Oylik davomat
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 md:px-6">
              {monthlyAttendance ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyAttendance.labels.map((l, i) => ({
                    name: l,
                    keldi: monthlyAttendance.datasets[0].data[i],
                    kelmadi: monthlyAttendance.datasets[1].data[i],
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="keldi" name="Keldi" fill="#10b981" radius={[4,4,0,0]} />
                    <Bar dataKey="kelmadi" name="Kelmadi" fill="#ef4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Ma'lumot yo'q</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md rounded-xl">
            <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-base md:text-lg text-gray-900 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                Eng yaxshi davomat
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[280px] overflow-y-auto px-4 md:px-6">
              {bestAttendance.length > 0 ? (
                <div className="space-y-1.5 md:space-y-2">
                  {bestAttendance.map((s, i) => (
                    <div key={s.id} className="flex items-center justify-between p-2 md:p-2.5 bg-gray-50 rounded-lg gap-2">
                      <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                        <span className="text-[10px] md:text-xs text-gray-400 w-4 md:w-5 shrink-0">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-medium text-gray-900 truncate max-w-[100px] md:max-w-[150px]">{s.first_name} {s.last_name}</p>
                          <p className="text-[10px] md:text-xs text-gray-400 truncate max-w-[100px] md:max-w-[150px]">{s.group_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                        <span className="text-[10px] md:text-xs text-green-600 flex items-center gap-0.5">
                          <CheckCircle className="h-2.5 w-2.5 md:h-3 md:w-3" /> {s.present}
                        </span>
                        <span className="text-[10px] md:text-xs text-red-500 flex items-center gap-0.5">
                          <XCircle className="h-2.5 w-2.5 md:h-3 md:w-3" /> {s.absent}
                        </span>
                        <span className={`text-xs md:text-sm font-bold ${s.attendance_rate >= 80 ? 'text-green-600' : s.attendance_rate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {s.attendance_rate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-6 text-sm">Ma'lumot yo'q</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md rounded-xl">
          <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-base md:text-lg text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              So'nggi harakatlar
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            {activities.length > 0 ? (
              <div className="space-y-1 md:space-y-2">
                {activities.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-1.5 md:p-2 rounded-lg shrink-0 ${
                      a.type === 'student' ? 'bg-blue-50 text-blue-600' :
                      a.type === 'group' ? 'bg-purple-50 text-purple-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {a.icon === 'user' ? <UserPlus className="h-3 w-3 md:h-4 md:w-4" /> :
                       a.icon === 'group' ? <Users className="h-3 w-3 md:h-4 md:w-4" /> :
                       <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm text-gray-900 truncate">{a.message}</p>
                      <p className="text-[10px] md:text-xs text-gray-400">
                        {new Date(a.time).toLocaleDateString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4 md:py-6 text-sm">Hali harakatlar mavjud emas</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <CenterStatusChecker />
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        isMobile={isMobile}
        onLogout={() => {
          ['access_token', 'refresh_token', 'admin', 'teacher'].forEach(k => localStorage.removeItem(k));
          router.push('/login');
        }}
      />
      <Header
        sidebarCollapsed={sidebarCollapsed}
        isMobile={isMobile}
        onMenuClick={() => {}}
      />
      <main
        className="transition-all duration-300 pt-20 pb-6 px-4 sm:px-6"
        style={{
          marginLeft: mounted && !isMobile
            ? (sidebarCollapsed ? '80px' : '240px')
            : '0px',
        }}
      >
        {isDashboard ? renderDashboard() : children}
      </main>
    </div>
  );
}
