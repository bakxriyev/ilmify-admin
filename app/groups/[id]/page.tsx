'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import {
  ArrowLeft, Edit, UserPlus, Trash2, Users, User, Mail, Phone,
  Calendar, Clock, BookOpen, DoorOpen, Hash,
  CheckCircle, XCircle, AlertCircle, UserCheck, School, BarChart3,
  Clock3, CalendarDays, Layers, MapPin, ChevronDown,
  ChevronUp, Download, RefreshCw, Loader2, ChevronLeft, ChevronRight,
  Wallet, Bell,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { groupsApi, type Group } from '@/api/groupsApi';
import { groupStudentsApi, type GroupStudent } from '@/api/groupStudentApi';
import { attendanceApi, type MonthlyStats, type AttendanceCell } from '@/api/attendanceApi';
import { paymentsApi, type GroupPaymentSummary } from '@/api/paymentsApi';
import AddStudentsModal from '@/components/addStudentModal';
import GenerateLessonsModal from '@/components/generateLessonsModal';
import toast from 'react-hot-toast';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = Number(params.id);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`group_tab_${groupId}`) || 'overview';
    }
    return 'overview';
  });

  const [group, setGroup] = useState<Group | null>(null);
  const [groupStudents, setGroupStudents] = useState<GroupStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGenerateLessons, setShowGenerateLessons] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  // Payment state
  const [paymentData, setPaymentData] = useState<GroupPaymentSummary[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const now = new Date();
  const [payMonth, setPayMonth] = useState(now.getMonth() + 1);
  const [payYear, setPayYear] = useState(now.getFullYear());

  // Attendance grid state
  const [gridYear, setGridYear] = useState(now.getFullYear());
  const [gridMonth, setGridMonth] = useState(now.getMonth());
  const [gridLessons, setGridLessons] = useState<Array<{ id: number; date: string; start_time: string }>>([]);
  const [gridAttendance, setGridAttendance] = useState<Record<number, Record<number, AttendanceCell>>>({});
  const [studentJoinDates, setStudentJoinDates] = useState<Record<number, string>>({});
  const [gridLoading, setGridLoading] = useState(false);
  const [activeCell, setActiveCell] = useState<{ lessonId: number; studentId: number } | null>(null);
  const [cellReason, setCellReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (groupId) fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      setError(null);
      const groupData = await groupsApi.getById(String(groupId));
      setGroup(groupData);
      await fetchGroupStudents();
    } catch (err: any) {
      setError(err.message || "Ma'lumotlarni yuklashda xatolik");
      toast.error("Guruh ma'lumotlarini yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupStudents = async () => {
    try {
      setStudentsLoading(true);
      const relations = await groupStudentsApi.getStudentsByGroup(groupId);
      setGroupStudents(relations);
    } catch {
      toast.error('Studentlarni yuklashda xatolik');
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance' && group) {
      fetchMonthlyGrid();
    }
    if (activeTab === 'students' && group) {
      fetchPayments();
    }
  }, [activeTab, group, gridYear, gridMonth, payMonth, payYear]);

  const fetchMonthlyGrid = async () => {
    try {
      setGridLoading(true);
      const data = await attendanceApi.getMonthlyGrid(groupId, gridYear, gridMonth + 1);
      setGridLessons(data.lessons);
      setGridAttendance(data.attendance);
      setStudentJoinDates(data.student_join_dates || {});
    } catch {
      setGridLessons([]);
      setGridAttendance({});
      setStudentJoinDates({});
    } finally {
      setGridLoading(false);
    }
  };

  useEffect(() => {
    if (!activeCell) return;
    const handler = (e: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
        setActiveCell(null);
        setShowReasonInput(false);
        setCellReason('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeCell]);

  const markGridAttendance = async (lessonId: number, studentId: number, isPresent: boolean, reason?: string) => {
    setActiveCell(null);
    setShowReasonInput(false);
    setCellReason('');
    try {
      await attendanceApi.markLesson({
        lesson_id: lessonId,
        attendance: [{ student_id: studentId, is_present: isPresent, reason }],
      });
      setGridAttendance(prev => {
        const next = { ...prev };
        if (!next[lessonId]) next[lessonId] = {};
        next[lessonId] = { ...next[lessonId], [studentId]: { is_present: isPresent, reason: reason || undefined } };
        return next;
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Xatolik yuz berdi';
      toast.error(msg);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      setStatsLoading(true);
      const stats = await attendanceApi.getStats(groupId, gridYear, gridMonth + 1);
      setMonthlyStats(stats);
    } catch {
      setMonthlyStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setPaymentLoading(true);
      const data = await paymentsApi.findByGroup(groupId, payMonth, payYear);
      setPaymentData(data);
    } catch {
      setPaymentData([]);
    } finally {
      setPaymentLoading(false);
    }
  };

  const getPaymentForStudent = (studentId: number) => paymentData.find(p => p.student.id === studentId);

  const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']; 
  const activeRelations = groupStudents.filter(r => !r.left_date && r.student);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const isStudentActiveInMonth = (relation: GroupStudent, month: number, year: number) => {
    const monthEnd = new Date(year, month, 0, 23, 59, 59);
    const joined = new Date(relation.joined_date);
    if (joined > monthEnd) return false;
    const now = new Date();
    const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
    if (isCurrentMonth) return !relation.left_date;
    if (!relation.left_date) return true;
    const monthStart = new Date(year, month - 1, 1);
    return new Date(relation.left_date) >= monthStart;
  };

  const monthFilteredStudents = groupStudents.filter(r => isStudentActiveInMonth(r, payMonth, payYear));

  const sortedLessons = group?.lessons
    ?.slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  const upcomingLessons = sortedLessons.filter(l => new Date(l.date) > new Date());
  const nextUpcomingLesson = upcomingLessons[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLesson = sortedLessons.find(l => l.date.split('T')[0] === todayStr);

  const statCards = [
    {
      label: 'Studentlar',
      value: groupStudents.filter(r => !r.left_date).length,
      icon: Users,
      color: 'bg-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      label: 'Darslar',
      value: sortedLessons.length,
      icon: BookOpen,
      color: 'bg-amber-500',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
    {
      label: 'Kelgusi dars',
      value: upcomingLessons.length,
      icon: Clock3,
      color: 'bg-green-500',
      bg: 'bg-green-50',
      text: 'text-green-600',
    },
    {
      label: 'Xona sig\'imi',
      value: group?.room ? `${group.room.occupied_seats}/${group.room.capacity}` : '-',
      icon: DoorOpen,
      color: 'bg-purple-500',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 w-full p-6 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-10 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !group) {
    return (
      <Layout>
        <div className="space-y-6 w-full p-6 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto text-center py-12">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Guruh topilmadi</h2>
              <p className="text-gray-600 mb-6">{error || "Guruh ma'lumotlari mavjud emas"}</p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                <Link href="/groups">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Guruhlar ro'yxatiga qaytish
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 w-full bg-gray-50 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <Button variant="ghost" asChild className="hover:bg-blue-100 text-gray-700 hover:text-blue-600">
              <Link href="/groups">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Guruhlar ro'yxati
              </Link>
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Student qo'shish
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                <Link href={`/groups/${group.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Tahrirlash
                </Link>
              </Button>
            </div>
          </div>

          <Card className="border-0 rounded-xl shadow-xl mb-6 bg-white overflow-hidden">
            <div className="relative h-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <School className="h-32 w-32 text-white" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                <h1 className="text-3xl font-bold text-white mb-1">{group.name}</h1>
                <div className="flex items-center gap-4 text-white/80 text-sm flex-wrap">
                  <span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" /> ID: {group.id}</span>
                  <span className="w-1 h-1 rounded-full bg-white/50" />
                  <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Yaratilgan: {formatDate(group.created_at)}</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {statCards.map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-md rounded-xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      <stat.icon className={`h-6 w-6 ${stat.text}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v);
            localStorage.setItem(`group_tab_${groupId}`, v);
          }} className="space-y-6">
            <TabsList className="bg-white border border-gray-200 p-1 rounded-lg overflow-x-auto flex-nowrap">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap">
                <Layers className="h-4 w-4 mr-1.5" />
                Umumiy
              </TabsTrigger>
              <TabsTrigger value="students" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap">
                <Users className="h-4 w-4 mr-1.5" />
                Studentlar ({groupStudents.filter(r => !r.left_date).length})
              </TabsTrigger>
              <TabsTrigger value="lessons" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap">
                <BookOpen className="h-4 w-4 mr-1.5" />
                Darslar ({sortedLessons.length})
              </TabsTrigger>
              <TabsTrigger value="attendance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap">
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Davomat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 rounded-xl shadow-lg bg-white overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <UserCheck className="h-5 w-5" /> Asosiy o'qituvchi
                    </h3>
                  </div>
                  <CardContent className="p-6">
                    {group.mainTeacher ? (
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-blue-200">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                            {getInitials(group.mainTeacher.first_name, group.mainTeacher.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {group.mainTeacher.first_name} {group.mainTeacher.last_name}
                          </h4>
                          <p className="text-xs text-gray-400">ID: {group.teacher_id}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-3.5 w-3.5 text-gray-400" /> {group.mainTeacher.gmail}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3.5 w-3.5 text-gray-400" /> {group.mainTeacher.phone_number || "Ko'rsatilmagan"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500 py-4">
                        <XCircle className="h-5 w-5" /> <span>Biriktirilmagan</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 rounded-xl shadow-lg bg-white overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Users className="h-5 w-5" /> Yordamchi o'qituvchi
                    </h3>
                  </div>
                  <CardContent className="p-6">
                    {group.supportTeacher ? (
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-indigo-200">
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg">
                            {getInitials(group.supportTeacher.first_name, group.supportTeacher.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {group.supportTeacher.first_name} {group.supportTeacher.last_name}
                          </h4>
                          <p className="text-xs text-gray-400">ID: {group.support_teacher_id}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-3.5 w-3.5 text-gray-400" /> {group.supportTeacher.gmail}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3.5 w-3.5 text-gray-400" /> {group.supportTeacher.phone_number || "Ko'rsatilmagan"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500 py-4">
                        <XCircle className="h-5 w-5" /> <span>Biriktirilmagan</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <Card className="border-0 rounded-xl shadow-lg bg-white overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <DoorOpen className="h-5 w-5" /> Xona ma'lumotlari
                    </h3>
                  </div>
                  <CardContent className="p-6">
                    {group.room ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-teal-100 rounded-lg">
                            <MapPin className="h-6 w-6 text-teal-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-xl">{group.room.name}</h4>
                            <p className="text-sm text-gray-500">ID: {group.room_id}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500">Sig'imi</p>
                            <p className="text-lg font-bold text-gray-900">{group.room.capacity}</p>
                          </div>
                          <div className="text-center p-3 bg-amber-50 rounded-lg">
                            <p className="text-xs text-amber-600">Band</p>
                            <p className="text-lg font-bold text-amber-700">{group.room.occupied_seats}</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-600">Bo'sh</p>
                            <p className="text-lg font-bold text-green-700">{group.room.capacity - group.room.occupied_seats}</p>
                          </div>
                        </div>
                        {group.room.capacity > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-red-500 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((group.room.occupied_seats / group.room.capacity) * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500 py-4">
                        <XCircle className="h-5 w-5" /> <span>Xona biriktirilmagan</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 rounded-xl shadow-lg bg-white overflow-hidden">
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Layers className="h-5 w-5" /> Qo'shimcha ma'lumotlar
                  </h3>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Yaratilgan vaqt</p>
                      <p className="text-gray-900 font-semibold flex items-center gap-1.5 mt-1">
                        <Calendar className="h-4 w-4 text-gray-400" /> {formatDate(group.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Yangilangan vaqt</p>
                      <p className="text-gray-900 font-semibold flex items-center gap-1.5 mt-1">
                        <Clock className="h-4 w-4 text-gray-400" /> {formatDate(group.updated_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Studentlar soni</p>
                      <p className="text-gray-900 font-semibold flex items-center gap-1.5 mt-1">
                        <Users className="h-4 w-4 text-gray-400" /> {groupStudents.filter(r => !r.left_date).length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Darslar soni</p>
                      <p className="text-gray-900 font-semibold flex items-center gap-1.5 mt-1">
                        <BookOpen className="h-4 w-4 text-gray-400" /> {sortedLessons.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students" className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{paymentData.length}</p>
                    <p className="text-xs text-gray-500">Faol studentlar</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-500">{groupStudents.filter(r => r.left_date).length}</p>
                    <p className="text-xs text-gray-500">Chiqib ketganlar</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{groupStudents.length}</p>
                    <p className="text-xs text-gray-500">Jami (tarix)</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{paymentData.filter(p => p.status === 'paid').length}/{paymentData.length}</p>
                    <p className="text-xs text-gray-500">To'lov (oylik)</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <Wallet className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-amber-800 flex-1">
                  {group?.monthly_price ? `Guruh narxi: ${group.monthly_price.toLocaleString()} so'm` : 'Guruh narxi belgilanmagan'}
                  {paymentData.some(p => p.effective_price && p.effective_price !== p.monthly_price) ? ' | Proratsiya faol' : ''}
                  {paymentData.length > 0 && ` | ${paymentData.filter(p => p.status === 'paid').length}/${paymentData.length} to'ladi`}
                </span>
                <div className="flex items-center gap-1">
                  <select value={payMonth} onChange={e => setPayMonth(Number(e.target.value))} className="h-8 text-xs border border-amber-300 rounded bg-white px-2">
                    {monthNames.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
                  </select>
                  <select value={payYear} onChange={e => setPayYear(Number(e.target.value))} className="h-8 text-xs border border-amber-300 rounded bg-white px-2">
                    {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <Button size="sm" onClick={async () => {
                  try {
                    const res = await paymentsApi.checkReminders(groupId);
                    toast.success(`${res.sent} ta studentga eslatma yuborildi`);
                    if (res.total_unpaid > 0 && res.sent === 0) toast('Hamma to\'lov qilgan');
                  } catch { toast.error('Xatolik'); }
                }} className="bg-amber-600 hover:bg-amber-700 text-white h-8 text-xs">
                  <Bell className="h-3.5 w-3.5 mr-1" /> 3 dars eslatmasi
                </Button>
              </div>

              <Card className="border-0 rounded-xl shadow-lg bg-white overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Users className="h-5 w-5" /> Faol studentlar ({paymentData.length})
                  </h3>
                  <Button onClick={() => setShowAddModal(true)} size="sm" className="bg-white text-green-700 hover:bg-green-50">
                    <UserPlus className="h-4 w-4 mr-2" /> Student qo'shish
                  </Button>
                </div>
                <CardContent className="p-6">
                  {studentsLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                    </div>
                  ) : paymentData.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <h4 className="text-lg font-medium text-gray-700 mb-2">Faol studentlar mavjud emas</h4>
                      <p className="text-gray-500 mb-6">Bu guruhga student qo'shilmagan yoki barchasi chiqib ketgan</p>
                      <Button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700 text-white">
                        <UserPlus className="h-4 w-4 mr-2" /> Student qo'shish
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead className="text-gray-700">#</TableHead>
                              <TableHead className="text-gray-700">Student</TableHead>
                              <TableHead className="text-gray-700">Yosh</TableHead>
                              <TableHead className="text-gray-700">Telefon</TableHead>
                              <TableHead className="text-gray-700">To'lov</TableHead>
                              <TableHead className="text-gray-700">Qo'shilgan sana</TableHead>
                              <TableHead className="text-gray-700 text-right">Amallar</TableHead>
                            </TableRow>
                          </TableHeader>
                        <TableBody>
                          {paymentData.map((payItem, idx) => {
                            const student = payItem.student;
                            const relation = groupStudents.find(r => Number(r.student_id) === Number(student.id));
                            const payStatus = payItem.status;
                            const debt = payItem.debt;
                            const overdueDays = payItem.overdue_days;
                            return (
                              <TableRow key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <TableCell className="text-gray-500 font-medium">{idx + 1}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-gray-200">
                                      <AvatarImage src={relation?.student?.photo || ''} />
                                      <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                                        {getInitials(student.first_name, student.last_name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <Link href={`/students/${student.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                        {student.first_name} {student.last_name}
                                      </Link>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-gray-600">{relation?.student?.age ?? '-'} yosh</TableCell>
                                <TableCell className="text-gray-600">{student.phone_number}</TableCell>
                                <TableCell className="text-center">
                                  {paymentLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400 mx-auto" />
                                  ) : payStatus === 'paid' ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <Badge className="bg-green-100 text-green-700 border-green-200">
                                        <CheckCircle className="h-3 w-3 mr-1" /> To'lagan
                                      </Badge>
                                      {payItem.effective_price && payItem.effective_price !== payItem.monthly_price && (
                                        <span className="text-[10px] text-gray-500">
                                          {payItem.effective_price.toLocaleString()} so'm
                                        </span>
                                      )}
                                    </div>
                                  ) : payStatus === 'partial' ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                                        <Clock className="h-3 w-3 mr-1" /> Qisman
                                      </Badge>
                                      <span className="text-xs font-medium">
                                        <span className="text-gray-500">
                                          {payItem.effective_price && payItem.effective_price !== payItem.monthly_price
                                            ? `${payItem.effective_price.toLocaleString()} so'mdan `
                                            : ''}
                                        </span>
                                        <span className="text-amber-600">{Number(debt).toLocaleString()} so'm qarz</span>
                                      </span>
                                      {overdueDays > 0 && (
                                        <span className="text-[10px] text-orange-500 flex items-center gap-0.5">
                                          <CalendarDays className="h-3 w-3" /> {overdueDays} kun
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <Badge className="bg-red-100 text-red-700 border-red-200">
                                        <XCircle className="h-3 w-3 mr-1" /> To'lamagan
                                      </Badge>
                                      <span className="text-xs font-medium">
                                        {payItem.effective_price && payItem.effective_price !== payItem.monthly_price ? (
                                          <>
                                            <span className="text-gray-500 line-through">{payItem.monthly_price.toLocaleString()} so'm</span>
                                            <br />
                                            <span className="text-red-500">{payItem.effective_price.toLocaleString()} so'm to'lov</span>
                                          </>
                                        ) : (
                                          <span className="text-red-500">{Number(debt).toLocaleString()} so'm qarz</span>
                                        )}
                                      </span>
                                      {overdueDays > 0 && (
                                        <span className="text-[10px] text-orange-500 flex items-center gap-0.5">
                                          <CalendarDays className="h-3 w-3" /> {overdueDays} kun
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-gray-600">
                                  {relation ? formatDate(relation.joined_date) : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost" size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                    onClick={async () => {
                                      if (confirm(`${student.first_name} ${student.last_name} ni guruhdan chiqarasizmi?`)) {
                                        try {
                                          await groupStudentsApi.removeStudentFromGroup(groupId, student.id);
                                          toast.success('Student guruhdan chiqarildi');
                                          await fetchGroupStudents();
                                        } catch { toast.error('Xatolik yuz berdi'); }
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {groupStudents.filter(r => r.left_date).length > 0 && (
                <Card className="border-0 rounded-xl shadow-lg bg-white overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-400 to-gray-500 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <DoorOpen className="h-5 w-5" /> Chiqib ketgan studentlar ({groupStudents.filter(r => r.left_date).length})
                    </h3>
                  </div>
                  <CardContent className="p-6">
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="text-gray-700">#</TableHead>
                            <TableHead className="text-gray-700">Student</TableHead>
                            <TableHead className="text-gray-700">Telefon</TableHead>
                            <TableHead className="text-gray-700">Qo'shilgan</TableHead>
                            <TableHead className="text-gray-700">Chiqgan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupStudents.filter(r => r.left_date).map((relation, idx) => {
                            const student = relation.student;
                            if (!student) return null;
                            return (
                              <TableRow key={student.id} className="border-b border-gray-100 bg-gray-50/50">
                                <TableCell className="text-gray-400 font-medium">{idx + 1}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-gray-200 opacity-60">
                                      <AvatarImage src={student.photo || ''} />
                                      <AvatarFallback className="bg-gray-200 text-gray-500 text-xs">
                                        {getInitials(student.first_name, student.last_name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-gray-500 line-through">
                                        {student.first_name} {student.last_name}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-gray-400">{student.phone_number}</TableCell>
                                <TableCell className="text-gray-400 text-sm">
                                  {formatDate(relation.joined_date)}
                                </TableCell>
                                <TableCell className="text-gray-500 text-sm">
                                  <span className="inline-flex items-center gap-1 text-red-500">
                                    <DoorOpen className="h-3 w-3" />
                                    {formatDate(relation.left_date!)}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="lessons" className="space-y-6">
              <Card className="border-0 rounded-xl shadow-lg bg-white overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-orange-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5" /> Darslar jadvali ({sortedLessons.length})
                    </h3>
                    <Button onClick={() => setShowGenerateLessons(true)} size="sm" className="bg-white text-amber-700 hover:bg-amber-50">
                      <Calendar className="h-4 w-4 mr-1" /> Darslar yaratish
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6">
                  {sortedLessons.length > 0 ? (
                    <div className="space-y-6">
                      {upcomingLessons.length > 0 && (
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <Clock3 className="h-5 w-5 text-amber-600" /> Keyingi dars
                          </h4>
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                              <CalendarDays className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-lg">
                                {formatDate(nextUpcomingLesson!.date)}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{nextUpcomingLesson!.time.slice(0, 5)}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <Badge className={nextUpcomingLesson!.parity === 'odd'
                                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                                  : 'bg-gray-100 text-gray-700 border-gray-200'
                                }>
                                  {nextUpcomingLesson!.parity === 'odd' ? 'Toq hafta' : 'Juft hafta'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead className="text-gray-700">Sana</TableHead>
                              <TableHead className="text-gray-700">Vaqt</TableHead>
                              <TableHead className="text-gray-700">Xona</TableHead>
                              <TableHead className="text-gray-700">Hafta</TableHead>
                              <TableHead className="text-gray-700">Holat</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedLessons.map((lesson) => (
                              <TableRow key={lesson.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <TableCell className="font-medium text-gray-900">
                                  {formatDate(lesson.date)}
                                </TableCell>
                                <TableCell className="text-gray-700">
                                  {lesson.start_time?.slice(0, 5) || lesson.time?.slice(0, 5)}
                                  {lesson.end_time ? ` - ${lesson.end_time.slice(0, 5)}` : ''}
                                </TableCell>
                                <TableCell>
                                  {lesson.room_id ? (
                                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                                      Xona #{lesson.room_id}
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={lesson.parity === 'odd'
                                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                  }>
                                    {lesson.parity === 'odd' ? 'Toq' : 'Juft'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${new Date(lesson.date) > new Date() ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    <span className="text-sm text-gray-600">
                                      {new Date(lesson.date) > new Date() ? 'Kutilmoqda' : "O'tgan"}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <h4 className="text-lg font-medium text-gray-700 mb-2">Darslar mavjud emas</h4>
                      <p className="text-gray-500">Bu guruhga hali dars qo'shilmagan</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-6">
              <Card className="border-0 rounded-xl shadow-lg bg-white overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" /> Davomat jadvali
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setGridYear(prev => gridMonth === 0 ? prev - 1 : prev); setGridMonth(prev => prev === 0 ? 11 : prev - 1); }} className="text-white/80 hover:text-white hover:bg-white/10">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-white font-medium text-sm min-w-[120px] text-center">
                        {monthNames[gridMonth]} {gridYear}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => { setGridYear(prev => gridMonth === 11 ? prev + 1 : prev); setGridMonth(prev => prev === 11 ? 0 : prev + 1); }} className="text-white/80 hover:text-white hover:bg-white/10">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <span className="w-px h-6 bg-white/30 mx-1" />
                      <Button size="sm" onClick={() => { const d = new Date(); setGridYear(d.getFullYear()); setGridMonth(d.getMonth()); }} className="bg-white text-emerald-700 hover:bg-emerald-50 text-xs">
                        <RefreshCw className="h-3 w-3 mr-1" /> Bugun
                      </Button>
                    </div>
                  </div>
                </div>
                <CardContent className="p-0">
                  {activeRelations.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">Bu guruhda studentlar mavjud emas</div>
                  ) : gridLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                      <span className="ml-2 text-gray-500">Yuklanmoqda...</span>
                    </div>
                  ) : gridLessons.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-14 w-14 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">Bu oyda darslar mavjud emas</p>
                      <p className="text-sm text-gray-400 mt-1">Boshqa oyni tanlang yoki guruhga dars qo'shing</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto" ref={gridRef}>
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="text-gray-700 sticky left-0 bg-gray-50 z-10 min-w-[160px]">Student</TableHead>
                            {gridLessons.map(lesson => {
                              const d = new Date(lesson.date);
                              const dayNum = d.getDate();
                              const dayName = d.toLocaleDateString('uz-UZ', { weekday: 'short' });
                              const isToday = lesson.date.split('T')[0] === todayStr;
                              return (
                                <TableHead key={lesson.id} className={`text-center text-xs p-1.5 min-w-[36px] ${isToday ? 'bg-emerald-100 text-emerald-800' : 'text-gray-600'}`}>
                                  <div>{dayNum}</div>
                                  <div className="text-[10px] font-normal">{dayName}</div>
                                </TableHead>
                              );
                            })}
                            <TableHead className="text-center text-gray-600 min-w-[60px]">%</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeRelations.map(relation => {
                            const student = relation.student!;
                            let presentCount = 0;
                            let totalCount = 0;
                            return (
                              <TableRow key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <TableCell className="sticky left-0 bg-white z-10 font-medium text-gray-900 text-sm border-r border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-7 w-7 border border-gray-200">
                                      <AvatarFallback className="bg-gray-100 text-gray-600 text-[10px]">
                                        {getInitials(student.first_name, student.last_name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate max-w-[120px]">{student.first_name.split(' ')[0]}</span>
                                  </div>
                                </TableCell>
                                {gridLessons.map(lesson => {
                                  const lessonDateStr = lesson.date.split('T')[0];
                                  const isFuture = lessonDateStr > todayStr;
                                  const joinDate = studentJoinDates[student.id];
                                  const beforeJoin = joinDate ? lessonDateStr < joinDate : false;
                                  const lessonAtt = gridAttendance[lesson.id];
                                  const cell = lessonAtt ? lessonAtt[student.id] : undefined;
                                  const isPresent = cell?.is_present === true;
                                  const isAbsent = cell?.is_present === false;
                                  const reasonText = cell?.reason;
                                  if (cell !== undefined) totalCount++;
                                  if (isPresent) presentCount++;
                                  const isActive = activeCell?.lessonId === lesson.id && activeCell?.studentId === student.id;
                                  const cellKey = `${lesson.id}-${student.id}`;
                                  return (
                                    <TableCell key={cellKey} className="text-center p-0.5 relative">
                                      {beforeJoin ? (
                                        <span className="text-gray-200 text-xs mx-auto block w-8 h-8 flex items-center justify-center" title="Student hali qo'shilmagan">—</span>
                                      ) : isActive ? (
                                        <div className="flex flex-col items-center gap-0.5">
                                          <div className="flex items-center gap-0.5">
                                            <button
                                              onClick={() => markGridAttendance(lesson.id, student.id, true)}
                                              className="w-7 h-7 rounded bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors"
                                              title="Bor"
                                            >B</button>
                                            <button
                                              onClick={() => { setShowReasonInput(true); }}
                                              className="w-7 h-7 rounded bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
                                              title="Yo'q"
                                            >Y</button>
                                          </div>
                                          {showReasonInput && (
                                            <div className="flex gap-0.5 mt-0.5">
                                              <input
                                                type="text"
                                                value={cellReason}
                                                onChange={e => setCellReason(e.target.value)}
                                                placeholder="Sabab..."
                                                className="w-20 h-6 text-[10px] px-1 border border-gray-300 rounded"
                                                autoFocus
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter') markGridAttendance(lesson.id, student.id, false, cellReason || undefined);
                                                  if (e.key === 'Escape') { setShowReasonInput(false); setCellReason(''); }
                                                }}
                                              />
                                              <button
                                                onClick={() => markGridAttendance(lesson.id, student.id, false, cellReason || undefined)}
                                                className="h-6 px-1.5 text-[10px] bg-blue-500 text-white rounded hover:bg-blue-600"
                                              >OK</button>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            if (isFuture) return;
                                            setActiveCell({ lessonId: lesson.id, studentId: student.id });
                                            setShowReasonInput(false);
                                            setCellReason('');
                                          }}
                                          disabled={isFuture}
                                          title={reasonText ? `Sabab: ${reasonText}` : (isFuture ? 'Kun hali kelmagan' : '')}
                                          className={`w-8 h-8 rounded-md flex items-center justify-center transition-all text-sm mx-auto
                                            ${isFuture ? 'cursor-not-allowed opacity-30' : 'cursor-pointer hover:ring-2 hover:ring-emerald-400'}
                                            ${isPresent ? 'bg-green-100 text-green-700' : isAbsent ? 'bg-red-100 text-red-600' : isFuture ? 'bg-gray-50 text-gray-300' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                        >
                                          {isFuture ? '∼' : isPresent ? '✓' : isAbsent ? '✗' : '-'}
                                        </button>
                                      )}
                                    </TableCell>                                  );
                                })}
                                <TableCell className="text-center">
                                  <span className={`text-sm font-semibold ${totalCount > 0 ? (presentCount / totalCount >= 0.7 ? 'text-green-600' : presentCount / totalCount >= 0.4 ? 'text-amber-600' : 'text-red-600') : 'text-gray-400'}`}>
                                    {totalCount > 0 ? `${Math.round(presentCount / totalCount * 100)}%` : '-'}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-0 rounded-xl shadow-lg bg-white overflow-hidden lg:col-span-2">
                  <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" /> Oylik statistika
                      </h3>
                      <Button size="sm" onClick={fetchAttendanceStats} className="bg-white text-violet-700 hover:bg-violet-50 text-xs">
                        <RefreshCw className="h-3 w-3 mr-1" /> Yangilash
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    {statsLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : monthlyStats ? (
                      <div className="space-y-5">
                        <div className="text-center p-5 bg-violet-50 rounded-xl">
                          <p className="text-4xl font-bold text-violet-700">{monthlyStats.presentPercent}%</p>
                          <p className="text-sm text-violet-600 font-medium mt-1">Davomat foizi</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-4 bg-green-50 rounded-xl text-center">
                            <p className="text-2xl font-bold text-green-700">{monthlyStats.present}</p>
                            <p className="text-xs text-green-600 mt-0.5">Keldi</p>
                          </div>
                          <div className="p-4 bg-red-50 rounded-xl text-center">
                            <p className="text-2xl font-bold text-red-700">{monthlyStats.absent}</p>
                            <p className="text-xs text-red-600 mt-0.5">Kelmadi</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-xl text-center">
                            <p className="text-2xl font-bold text-gray-900">{monthlyStats.lessons}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Darslar</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-red-500 via-amber-500 to-green-500"
                            style={{ width: `${Math.min(Number(monthlyStats.presentPercent), 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-sm">Statistika mavjud emas</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 rounded-xl shadow-lg bg-white overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Users className="h-5 w-5" /> Ma'lumot
                    </h3>
                  </div>
                  <CardContent className="p-6 space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Faol studentlar</span>
                      <span className="font-bold text-gray-900">{activeRelations.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Bu oydagi darslar</span>
                      <span className="font-bold text-gray-900">{gridLessons.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Jami darslar</span>
                      <span className="font-bold text-gray-900">{sortedLessons.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">O'tgan darslar</span>
                      <span className="font-bold text-gray-900">{sortedLessons.filter(l => new Date(l.date) <= new Date()).length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Kelgusi darslar</span>
                      <span className="font-bold text-gray-900">{upcomingLessons.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AddStudentsModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        groupId={groupId}
        groupName={group.name}
        onSuccess={fetchGroupStudents}
      />
      <GenerateLessonsModal
        open={showGenerateLessons}
        onOpenChange={setShowGenerateLessons}
        groupId={groupId}
        onSuccess={fetchGroupData}
      />
    </Layout>
  );
}
