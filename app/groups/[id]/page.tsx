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
  Wallet, Bell, Pencil, GraduationCap, Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { groupsApi, type Group } from '@/api/groupsApi';
import { groupStudentsApi, type GroupStudent } from '@/api/groupStudentApi';
import { attendanceApi, type MonthlyStats, type AttendanceCell } from '@/api/attendanceApi';
import { paymentsApi, type GroupPaymentSummary } from '@/api/paymentsApi';
import { lessonsApi } from '@/api/lessonsApi';
import AddStudentsModal from '@/components/addStudentModal';
import GenerateLessonsModal from '@/components/generateLessonsModal';
import toast from 'react-hot-toast';

const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

const getInitials = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

const formatPhone = (phone?: string) => {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '').replace(/(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, '+$1 $2 $3 $4 $5');
};

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = Number(params.id);
  const now = new Date();

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
  const [showDeleteLessons, setShowDeleteLessons] = useState(false);
  const [deletingLessons, setDeletingLessons] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [paymentData, setPaymentData] = useState<GroupPaymentSummary[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [payMonth, setPayMonth] = useState(now.getMonth() + 1);
  const [payYear, setPayYear] = useState(now.getFullYear());

  const [editingDateStudentId, setEditingDateStudentId] = useState<number | null>(null);
  const [editingDateValue, setEditingDateValue] = useState('');
  const [savingDate, setSavingDate] = useState(false);
  const [confirmDateStudent, setConfirmDateStudent] = useState<{ relationId: number; studentId: number; studentName: string; firstLessonDate: string } | null>(null);
  const [bulkJoinDate, setBulkJoinDate] = useState(now.toISOString().split('T')[0]);
  const [showBulkJoinDate, setShowBulkJoinDate] = useState(false);
  const [bulkJoinDateLoading, setBulkJoinDateLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [showCloseGroup, setShowCloseGroup] = useState(false);
  const [closeDate, setCloseDate] = useState(now.toISOString().split('T')[0]);
  const [closingGroup, setClosingGroup] = useState(false);

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

  const handleSaveJoinedDate = async (relationId: number, studentId: number) => {
    try {
      setSavingDate(true);
      await groupStudentsApi.update(relationId, { joined_date: editingDateValue });
      toast.success('Qo\'shilgan sana yangilandi');
      setEditingDateStudentId(null);
      await fetchGroupStudents();
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setSavingDate(false);
    }
  };

  const handleBulkSetJoinDate = async () => {
    try {
      setBulkJoinDateLoading(true);
      const res = await groupStudentsApi.bulkUpdateJoinDate(groupId, bulkJoinDate);
      toast.success(`${res.updated} ta studentning qo'shilgan sanasi yangilandi`);
      setShowBulkJoinDate(false);
      await fetchGroupStudents();
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setBulkJoinDateLoading(false);
    }
  };

  const handleSetJoinedToFirstLesson = async () => {
    if (!confirmDateStudent) return;
    try {
      setSavingDate(true);
      await groupStudentsApi.update(confirmDateStudent.relationId, { joined_date: confirmDateStudent.firstLessonDate });
      toast.success('Qo\'shilgan sana birinchi dars sanasiga o\'rnatildi');
      setConfirmDateStudent(null);
      await fetchGroupStudents();
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setSavingDate(false);
    }
  };

  const handleDeleteAllLessons = async () => {
    try {
      setDeletingLessons(true);
      const res = await lessonsApi.deleteAllByGroup(groupId);
      toast.success(res.message);
      fetchGroupData();
    } catch {
      toast.error('Darslarni o\'chirishda xatolik');
    } finally {
      setDeletingLessons(false);
      setShowDeleteLessons(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance' && group) fetchMonthlyGrid();
    if (activeTab === 'students' && group) fetchPayments();
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

  const activeRelations = groupStudents.filter(r => !r.left_date && r.student).sort((a, b) => {
    const al = (a.student?.last_name || '').toLowerCase();
    const bl = (b.student?.last_name || '').toLowerCase();
    if (al < bl) return -1;
    if (al > bl) return 1;
    const af = (a.student?.first_name || '').toLowerCase();
    const bf = (b.student?.first_name || '').toLowerCase();
    return af < bf ? -1 : af > bf ? 1 : 0;
  });

  const isStudentActiveInMonth = (relation: GroupStudent, month: number, year: number) => {
    const monthEnd = new Date(year, month, 0, 23, 59, 59);
    const joined = new Date(relation.joined_date);
    if (joined > monthEnd) return false;
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

  const handleTabChange = (v: string) => {
    setActiveTab(v);
    localStorage.setItem(`group_tab_${groupId}`, v);
  };

  if (loading) {
    return (
      <Layout>
        <div className="w-full min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-white">
          <div className="w-full h-full p-6 md:p-8 lg:p-10">
            <div className="max-w-[1600px] mx-auto space-y-7">
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-56 w-full rounded-2xl" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-[104px] rounded-xl" />)}
              </div>
              <Skeleton className="h-12 w-96 rounded-lg" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !group) {
    return (
      <Layout>
        <div className="w-full min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-white">
          <div className="w-full h-full p-6 md:p-8 lg:p-10">
            <div className="max-w-[1600px] mx-auto">
              <div className="text-center py-16">
                <div className="inline-block p-5 bg-gradient-to-br from-red-100 to-rose-100 rounded-full mb-5">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Guruh topilmadi</h2>
                <p className="text-gray-500 text-sm mb-6">{error || "Guruh ma'lumotlari mavjud emas"}</p>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md h-9 text-sm">
                  <Link href="/groups">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Guruhlar ro'yxatiga qaytish
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full h-full p-6 md:p-8 lg:p-10">
          <div className="max-w-[1600px] mx-auto space-y-7">

            {/* Back + Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Button variant="ghost" asChild className="hover:bg-blue-50 text-gray-600 hover:text-blue-600 h-9 text-sm -ml-2">
                <Link href="/groups">
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Guruhlar ro'yxati
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <Button onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md h-10 text-sm">
                  <UserPlus className="h-4 w-4 mr-1.5" /> Student qo'shish
                </Button>
                <Button asChild
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md h-10 text-sm">
                  <Link href={`/groups/${group.id}/edit`}>
                    <Edit className="h-4 w-4 mr-1.5" /> Tahrirlash
                  </Link>
                </Button>
                {!group.closed_at && (
                  <Button onClick={() => setShowCloseGroup(true)}
                    className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-md h-10 text-sm">
                    <XCircle className="h-4 w-4 mr-1.5" /> Guruhni yopish
                  </Button>
                )}
              </div>
            </div>

            {/* Banner */}
            <Card className="border-0 rounded-2xl shadow-lg overflow-hidden">
              <div className="relative h-56 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.05]">
                  <School className="h-48 w-48 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        {group.name}
                        {group.closed_at && (
                          <Badge className="ml-3 bg-red-500/80 text-white border-0 text-sm px-3 py-1 align-middle">
                            <XCircle className="h-4 w-4 mr-1" /> Yopilgan
                          </Badge>
                        )}
                      </h1>
                      <div className="flex items-center gap-3 text-white/70 text-sm flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5" /> ID: {group.id}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/40" />
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" /> Yaratilgan: {formatDate(group.created_at)}
                        </span>
                        {group.closed_at && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-white/40" />
                            <span className="flex items-center gap-1.5">
                              <XCircle className="h-3.5 w-3.5" /> Yopilgan: {formatDate(group.closed_at)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {[
                { label: 'Studentlar', value: activeRelations.length, icon: Users, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', border: 'border-blue-100/50' },
                { label: 'Darslar', value: sortedLessons.length, icon: BookOpen, gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', border: 'border-amber-100/50' },
                { label: 'Kelgusi dars', value: upcomingLessons.length, icon: Clock3, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100/50' },
                { label: "Xona sig'imi", value: group?.room ? `${group.room.occupied_seats}/${group.room.capacity}` : '-', icon: DoorOpen, gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', border: 'border-purple-100/50' },
              ].map((stat, idx) => (
                <Card key={idx} className={`border ${stat.border} ${stat.bg}/80 shadow-md rounded-xl`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-0.5">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-md`}>
                        <stat.icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="bg-white/90 border border-gray-200/80 p-1.5 rounded-xl shadow-sm overflow-x-auto flex-nowrap gap-1.5">
                {[
                  { value: 'overview', icon: Layers, label: 'Umumiy' },
                  { value: 'students', icon: Users, label: `Studentlar (${activeRelations.length})` },
                  { value: 'lessons', icon: BookOpen, label: `Darslar (${sortedLessons.length})` },
                  { value: 'attendance', icon: CheckCircle, label: 'Davomat' },
                ].map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg text-xs sm:text-sm h-9 px-3 sm:px-4 whitespace-nowrap transition-all duration-200">
                    <tab.icon className="h-4 w-4 mr-1.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ==================== OVERVIEW TAB ==================== */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Main Teacher */}
                  <Card className="border border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-md rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <UserCheck className="h-5 w-5" /> Asosiy o'qituvchi
                      </h3>
                    </div>
                    <CardContent className="p-6">
                      {group.mainTeacher ? (
                        <div className="flex items-center gap-5">
                          <Avatar className="h-16 w-16 border-2 border-blue-100 shadow-md">
                            <AvatarImage src={group.mainTeacher.photo || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-base">
                              {getInitials(group.mainTeacher.first_name, group.mainTeacher.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 text-base">
                              {group.mainTeacher.first_name} {group.mainTeacher.last_name}
                            </h4>
                            <p className="text-xs text-gray-400 mt-0.5">ID: {group.teacher_id}</p>
                            <div className="mt-3 space-y-1.5">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{group.mainTeacher.gmail}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <span>{formatPhone(group.mainTeacher.phone_number) || "Ko'rsatilmagan"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 text-gray-400 py-4">
                          <div className="p-2 bg-gray-100 rounded-lg"><XCircle className="h-5 w-5" /></div>
                          <span className="text-sm">Biriktirilmagan</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Support Teacher */}
                  <Card className="border border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-md rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Users className="h-5 w-5" /> Yordamchi o'qituvchi
                      </h3>
                    </div>
                    <CardContent className="p-6">
                      {group.supportTeacher ? (
                        <div className="flex items-center gap-5">
                          <Avatar className="h-16 w-16 border-2 border-indigo-100 shadow-md">
                            <AvatarImage src={group.supportTeacher.photo || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-base">
                              {getInitials(group.supportTeacher.first_name, group.supportTeacher.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 text-base">
                              {group.supportTeacher.first_name} {group.supportTeacher.last_name}
                            </h4>
                            <p className="text-xs text-gray-400 mt-0.5">ID: {group.support_teacher_id}</p>
                            <div className="mt-3 space-y-1.5">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{group.supportTeacher.gmail}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <span>{formatPhone(group.supportTeacher.phone_number) || "Ko'rsatilmagan"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 text-gray-400 py-4">
                          <div className="p-2 bg-gray-100 rounded-lg"><XCircle className="h-5 w-5" /></div>
                          <span className="text-sm">Biriktirilmagan</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Room */}
                  <Card className="border border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-md rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <DoorOpen className="h-5 w-5" /> Xona ma'lumotlari
                      </h3>
                    </div>
                    <CardContent className="p-6">
                      {group.room ? (
                        <div className="space-y-5">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
                              <MapPin className="h-6 w-6 text-teal-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-base">{group.room.name}</h4>
                              <p className="text-xs text-gray-400">ID: {group.room_id}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                            <div className="text-center p-4 bg-gray-50 rounded-xl">
                              <p className="text-[11px] text-gray-500 font-medium">Sig'imi</p>
                              <p className="text-xl font-bold text-gray-900">{group.room.capacity}</p>
                            </div>
                            <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-100/50">
                              <p className="text-[11px] text-amber-600 font-medium">Band</p>
                              <p className="text-xl font-bold text-amber-700">{group.room.occupied_seats}</p>
                            </div>
                            <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100/50">
                              <p className="text-[11px] text-emerald-600 font-medium">Bo'sh</p>
                              <p className="text-xl font-bold text-emerald-700">{group.room.capacity - group.room.occupied_seats}</p>
                            </div>
                          </div>
                          {group.room.capacity > 0 && (
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((group.room.occupied_seats / group.room.capacity) * 100, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 text-gray-400 py-4">
                          <div className="p-2 bg-gray-100 rounded-lg"><XCircle className="h-5 w-5" /></div>
                          <span className="text-sm">Xona biriktirilmagan</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Additional Info */}
                  <Card className="border border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-md rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Layers className="h-5 w-5" /> Qo'shimcha ma'lumotlar
                      </h3>
                    </div>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 gap-5">
                        {[
                          { label: 'Yaratilgan vaqt', value: formatDate(group.created_at), icon: Calendar, color: 'text-blue-600 bg-blue-50' },
                          { label: 'Yangilangan vaqt', value: formatDate(group.updated_at), icon: Clock, color: 'text-amber-600 bg-amber-50' },
                          { label: 'Studentlar soni', value: `${activeRelations.length} ta`, icon: Users, color: 'text-emerald-600 bg-emerald-50' },
                          { label: 'Darslar soni', value: `${sortedLessons.length} ta`, icon: BookOpen, color: 'text-purple-600 bg-purple-50' },
                        ].map((item, idx) => (
                          <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100/50">
                            <p className="text-[11px] font-medium text-gray-500 mb-1.5">{item.label}</p>
                            <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                              <span className={`p-1.5 rounded ${item.color}`}><item.icon className="h-3.5 w-3.5" /></span>
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ==================== STUDENTS TAB ==================== */}
              <TabsContent value="students" className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Faol studentlar', value: paymentData.length, color: 'emerald', border: 'border-emerald-100/50', bg: 'bg-emerald-50' },
                    { label: 'Chiqib ketganlar', value: groupStudents.filter(r => r.left_date).length, color: 'gray', border: 'border-gray-200', bg: 'bg-gray-50' },
                    { label: 'Jami (tarix)', value: groupStudents.length, color: 'blue', border: 'border-blue-100/50', bg: 'bg-blue-50' },
                    { label: "To'lov (oylik)", value: `${paymentData.filter(p => p.status === 'paid').length}/${paymentData.length}`, color: 'emerald', border: 'border-emerald-100/50', bg: 'bg-emerald-50' },
                  ].map((stat, idx) => (
                    <Card key={idx} className={`border ${stat.border} ${stat.bg}/80 shadow-md rounded-xl`}>
                      <CardContent className="p-5 text-center">
                        <p className={`text-2xl font-bold text-${stat.color}-700`}>{stat.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Payment filter bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-amber-50/80 border border-amber-200/80 rounded-xl shadow-md">
                  <Wallet className="h-6 w-6 text-amber-600 flex-shrink-0" />
                  <span className="text-sm text-amber-800 flex-1">
                    {group?.monthly_price
                      ? `Guruh narxi: ${group.monthly_price.toLocaleString()} so'm`
                      : 'Guruh narxi belgilanmagan'}
                    {paymentData.some(p => p.effective_price && p.effective_price !== p.monthly_price) ? ' | Proratsiya faol' : ''}
                    {paymentData.length > 0 && ` | ${paymentData.filter(p => p.status === 'paid').length}/${paymentData.length} to'ladi`}
                  </span>
                  <div className="flex items-center gap-2">
                    <select value={payMonth} onChange={e => setPayMonth(Number(e.target.value))}
                      className="h-9 text-sm border border-amber-300 rounded-lg bg-white px-3 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none">
                      {monthNames.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
                    </select>
                    <select value={payYear} onChange={e => setPayYear(Number(e.target.value))}
                      className="h-9 text-sm border border-amber-300 rounded-lg bg-white px-3 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none">
                      {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <Button size="sm" onClick={async () => {
                    try {
                      const res = await paymentsApi.checkReminders(groupId);
                      toast.success(`${res.sent} ta studentga eslatma yuborildi`);
                      if (res.total_unpaid > 0 && res.sent === 0) toast('Hamma to\'lov qilgan');
                    } catch { toast.error('Xatolik'); }
                  }} className="bg-amber-600 hover:bg-amber-700 text-white h-9 text-xs shadow-md">
                    <Bell className="h-4 w-4 mr-1" /> 3 dars eslatmasi
                  </Button>
                </div>

                {/* Active students */}
                <Card className="border border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-md rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-green-700 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Users className="h-5 w-5" /> Faol studentlar ({paymentData.length})
                    </h3>
                    <Button onClick={() => setShowAddModal(true)} size="sm"
                      className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-sm text-xs h-9">
                      <UserPlus className="h-4 w-4 mr-1.5" /> Student qo'shish
                    </Button>
                  </div>
                  <CardContent className="p-0">
                    {studentsLoading ? (
                      <div className="p-6 space-y-3">
                        {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                      </div>
                    ) : paymentData.length === 0 ? (
                      <div className="text-center py-20">
                        <div className="inline-block p-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
                          <Users className="h-12 w-12 text-gray-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-1">Faol studentlar mavjud emas</h4>
                        <p className="text-sm text-gray-500 mb-5">Bu guruhga student qo'shilmagan yoki barchasi chiqib ketgan</p>
                        <Button onClick={() => setShowAddModal(true)}
                          className="bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md h-10 text-sm">
                          <UserPlus className="h-4 w-4 mr-1.5" /> Student qo'shish
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <div className="p-3 border-b border-gray-100">
                          <Input
                            placeholder="Ism, familiya yoki telefon raqam bilan qidirish..."
                            value={studentSearch}
                            onChange={e => setStudentSearch(e.target.value)}
                            className="h-9 text-sm max-w-sm"
                          />
                        </div>
                        <Table>
                          <TableHeader className="bg-gray-50/80">
                            <TableRow>
                              <TableHead className="text-gray-500 font-semibold text-[11px] uppercase tracking-wider">#</TableHead>
                              <TableHead className="text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Student</TableHead>
                              <TableHead className="text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Yosh</TableHead>
                              <TableHead className="text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Telefon</TableHead>
                              <TableHead className="text-gray-500 font-semibold text-[11px] uppercase tracking-wider">To'lov</TableHead>
                              <TableHead className="text-gray-500 font-semibold text-[11px] uppercase tracking-wider">
                                <div className="flex items-center gap-1">
                                  <span>Qo'shilgan sana</span>
                                  <button onClick={() => setShowBulkJoinDate(!showBulkJoinDate)}
                                    className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                                    title="Barchasiga sana o'rnatish">
                                    <Calendar className="h-3 w-3" />
                                  </button>
                                </div>
                                {showBulkJoinDate && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Input type="date" value={bulkJoinDate}
                                      onChange={e => setBulkJoinDate(e.target.value)}
                                      className="h-6 w-[120px] text-[10px] rounded" />
                                    <Button size="sm" className="h-6 text-[10px] px-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                                      onClick={handleBulkSetJoinDate} disabled={bulkJoinDateLoading}>
                                      {bulkJoinDateLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Qo\'llash'}
                                    </Button>
                                  </div>
                                )}
                              </TableHead>
                              <TableHead className="text-right text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Amallar</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              const search = studentSearch.toLowerCase().trim();
                              const sorted = [...paymentData].sort((a, b) => {
                                const al = (a.student?.last_name || '').toLowerCase();
                                const bl = (b.student?.last_name || '').toLowerCase();
                                if (al < bl) return -1;
                                if (al > bl) return 1;
                                const af = (a.student?.first_name || '').toLowerCase();
                                const bf = (b.student?.first_name || '').toLowerCase();
                                return af < bf ? -1 : af > bf ? 1 : 0;
                              });
                              const filtered = search
                                ? sorted.filter(p => {
                                    const fn = (p.student?.first_name || '').toLowerCase().replace(/[''`´"]/g, '');
                                    const ln = (p.student?.last_name || '').toLowerCase().replace(/[''`´"]/g, '');
                                    const fullName = `${fn} ${ln}`;
                                    const reversedName = `${ln} ${fn}`;
                                    const ph = (p.student?.phone_number || '').replace(/\D/g, '');
                                    const cleanSearch = search.replace(/[''`´"]/g, '');
                                    const searchDigits = cleanSearch.replace(/\D/g, '');
                                    if (fullName.includes(cleanSearch)) return true;
                                    if (reversedName.includes(cleanSearch)) return true;
                                    const words = cleanSearch.split(/\s+/).filter(Boolean);
                                    if (words.length >= 2) {
                                      const allMatch = words.every(w => fn.includes(w) || ln.includes(w));
                                      if (allMatch) return true;
                                    }
                                    if (searchDigits && ph.includes(searchDigits)) return true;
                                    return fn.includes(cleanSearch) || ln.includes(cleanSearch);
                                  })
                                : sorted;
                              return filtered.map((payItem, idx) => {
                              const student = payItem.student;
                              const relation = groupStudents.find(r => Number(r.student_id) === Number(student.id));
                              const payStatus = payItem.status;
                              const debt = payItem.debt;
                              const overdueDays = payItem.overdue_days;
                              return (
                                <TableRow key={student.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-emerald-50/40 hover:to-green-50/40 transition-all duration-200 group">
                                  <TableCell className="text-gray-400 font-mono text-sm py-4">{idx + 1}</TableCell>
                                  <TableCell className="py-4">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-10 w-10 border-2 border-gray-100 shadow-sm">
                                        <AvatarImage src={relation?.student?.photo || ''} />
                                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-[11px] font-bold">
                                          {getInitials(student.first_name, student.last_name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <Link href={`/students/${student.id}`}
                                          className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-sm">
                                          {student.first_name} {student.last_name}
                                        </Link>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-gray-600 text-sm py-4">{relation?.student?.age ?? '-'} yosh</TableCell>
                                  <TableCell className="text-gray-600 text-sm py-4">{formatPhone(student.phone_number)}</TableCell>
                                  <TableCell className="py-4">
                                    {paymentLoading ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                    ) : payStatus === 'paid' ? (
                                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-medium px-3 py-1">
                                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> To'lagan
                                      </Badge>
                                    ) : payStatus === 'partial' ? (
                                      <div className="flex flex-col items-start gap-0.5">
                                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-medium px-3 py-1">
                                          <Clock className="h-3.5 w-3.5 mr-1" /> Qisman
                                        </Badge>
                                        <span className="text-[11px] text-amber-600 font-medium">
                                          {Number(debt).toLocaleString()} so'm qarz
                                          {overdueDays > 0 && ` | ${overdueDays} kun`}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-start gap-0.5">
                                        <Badge className="bg-red-50 text-red-700 border-red-200 text-xs font-medium px-3 py-1">
                                          <XCircle className="h-3.5 w-3.5 mr-1" /> To'lamagan
                                        </Badge>
                                        <span className="text-[11px] text-red-600 font-medium">
                                          {Number(debt).toLocaleString()} so'm qarz
                                          {overdueDays > 0 && ` | ${overdueDays} kun`}
                                        </span>
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-gray-600 text-sm py-4">
                                    {editingDateStudentId === Number(student.id) ? (
                                      <div className="flex items-center gap-1">
                                        <Input type="date" value={editingDateValue}
                                          onChange={e => setEditingDateValue(e.target.value)}
                                          className="h-8 w-[140px] text-xs rounded-lg" />
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-emerald-600"
                                          onClick={() => handleSaveJoinedDate(relation!.id, Number(student.id))} disabled={savingDate}>
                                          {savingDate ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400"
                                          onClick={() => setEditingDateStudentId(null)}>
                                          <XCircle className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <button className="text-xs text-gray-600 hover:text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                                          onClick={() => {
                                            if (relation) {
                                              setEditingDateValue(relation.joined_date ? new Date(relation.joined_date).toISOString().split('T')[0] : '');
                                              setEditingDateStudentId(Number(student.id));
                                            }
                                          }}>
                                          {relation ? formatDate(relation.joined_date) : '-'}
                                          <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                        {sortedLessons.length > 0 && relation && (
                                          <button onClick={() => {
                                            const firstDate = new Date(sortedLessons[0].date).toISOString().split('T')[0];
                                            setConfirmDateStudent({
                                              relationId: relation.id,
                                              studentId: Number(student.id),
                                              studentName: `${student.first_name} ${student.last_name}`,
                                              firstLessonDate: firstDate,
                                            });
                                          }}
                                            className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Birinchi dars sanasiga o'rnatish">
                                            <Calendar className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right py-4">
                                    <Button variant="ghost" size="sm"
                                      className="text-red-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 p-0 rounded-lg"
                                      onClick={async () => {
                                        if (confirm(`${student.first_name} ${student.last_name} ni guruhdan chiqarasizmi?`)) {
                                          try {
                                            await groupStudentsApi.removeStudentFromGroup(groupId, student.id);
                                            toast.success('Student guruhdan chiqarildi');
                                            await fetchGroupStudents();
                                          } catch { toast.error('Xatolik yuz berdi'); }
                                        }
                                      }}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })})()}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Left students */}
                {groupStudents.filter(r => r.left_date).length > 0 && (
                  <Card className="border border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-md rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-400 to-gray-500 px-6 py-4">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <DoorOpen className="h-5 w-5" /> Chiqib ketgan studentlar ({groupStudents.filter(r => r.left_date).length})
                      </h3>
                    </div>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-gray-50/80">
                            <TableRow>
                              <TableHead className="text-gray-500 font-semibold text-[11px] uppercase tracking-wider">#</TableHead>
                              <TableHead className="text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Student</TableHead>
                              <TableHead className="text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Telefon</TableHead>
                              <TableHead className="text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Qo'shilgan</TableHead>
                              <TableHead className="text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Chiqgan</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              const leftStudents = [...groupStudents].filter(r => r.left_date).sort((a, b) => {
                                const al = (a.student?.last_name || '').toLowerCase();
                                const bl = (b.student?.last_name || '').toLowerCase();
                                if (al < bl) return -1;
                                if (al > bl) return 1;
                                const af = (a.student?.first_name || '').toLowerCase();
                                const bf = (b.student?.first_name || '').toLowerCase();
                                return af < bf ? -1 : af > bf ? 1 : 0;
                              });
                              return leftStudents.map((relation, idx) => {
                              const student = relation.student;
                              if (!student) return null;
                              return (
                                <TableRow key={student.id} className="border-b border-gray-100 bg-gray-50/30">
                                  <TableCell className="text-gray-400 font-mono text-sm py-4">{idx + 1}</TableCell>
                                  <TableCell className="py-4">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-10 w-10 border-2 border-gray-200 opacity-60">
                                        <AvatarImage src={student.photo || ''} />
                                        <AvatarFallback className="bg-gray-200 text-gray-500 text-[11px] font-bold">
                                          {getInitials(student.first_name, student.last_name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <p className="font-medium text-gray-500 line-through text-sm">
                                        {student.first_name} {student.last_name}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-gray-400 text-sm py-4">{formatPhone(student.phone_number)}</TableCell>
                                  <TableCell className="text-gray-400 text-sm py-4">{formatDate(relation.joined_date)}</TableCell>
                                  <TableCell className="text-sm py-4">
                                    <span className="inline-flex items-center gap-1 text-red-500 font-medium">
                                      <DoorOpen className="h-3.5 w-3.5" /> {formatDate(relation.left_date!)}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              );
                            })})()}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ==================== LESSONS TAB ==================== */}
              <TabsContent value="lessons" className="space-y-6">
                <Card className="border border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-md rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-600 to-orange-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5" /> Darslar jadvali ({sortedLessons.length})
                      </h3>
                      <div className="flex items-center gap-2">
                        {sortedLessons.length > 0 && (
                          <Button onClick={() => setShowDeleteLessons(true)} size="sm" variant="outline"
                            className="bg-red-500/20 text-white border-white/30 hover:bg-red-500/40 hover:text-white text-xs h-9">
                            <Trash2 className="h-4 w-4 mr-1" /> Darslarni o'chirish
                          </Button>
                        )}
                        <Button onClick={() => setShowGenerateLessons(true)} size="sm"
                          className="bg-white text-amber-700 hover:bg-amber-50 shadow-sm text-xs h-9">
                          <Plus className="h-4 w-4 mr-1" /> Darslar yaratish
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    {sortedLessons.length > 0 ? (
                      <div className="space-y-6">
                        {nextUpcomingLesson && (
                          <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/80">
                            <h4 className="font-medium text-gray-800 text-sm mb-3 flex items-center gap-2">
                              <div className="p-1.5 bg-amber-100 rounded"><Clock3 className="h-5 w-5 text-amber-600" /></div>
                              Keyingi dars
                            </h4>
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-sm">
                                <CalendarDays className="h-6 w-6 text-amber-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-base">{formatDate(nextUpcomingLesson.date)}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{nextUpcomingLesson.start_time?.slice(0, 5) || nextUpcomingLesson.time?.slice(0, 5)}</span>
                                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                                  <Badge className={
                                    nextUpcomingLesson.parity === 'odd'
                                      ? 'bg-amber-100 text-amber-700 border-amber-200 text-[11px] px-2 py-0.5'
                                      : nextUpcomingLesson.parity === 'everyday'
                                      ? 'bg-green-100 text-green-700 border-green-200 text-[11px] px-2 py-0.5'
                                      : 'bg-gray-100 text-gray-700 border-gray-200 text-[11px] px-2 py-0.5'
                                  }>
                                    {nextUpcomingLesson.parity === 'odd' ? 'Toq hafta' : nextUpcomingLesson.parity === 'everyday' ? 'Har kuni' : 'Juft hafta'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {sortedLessons.map((lesson) => {
                            const lessonDate = new Date(lesson.date);
                            const dateStr = lesson.date.split('T')[0];
                            const isToday = dateStr === todayStr;
                            const isPast = dateStr < todayStr;
                            const dayOfWeek = lessonDate.toLocaleDateString('uz-UZ', { weekday: 'long' });
                            return (
                              <div key={lesson.id}
                                className={`group relative rounded-xl border transition-all duration-300 overflow-hidden ${
                                  isToday
                                    ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-white shadow-md ring-2 ring-emerald-400/30 scale-[1.02] z-10'
                                    : isPast
                                      ? 'border-gray-200 bg-white/80 hover:shadow-md hover:border-gray-300'
                                      : 'border-gray-200 bg-white hover:shadow-lg hover:border-amber-300 hover:-translate-y-0.5'
                                }`}>
                                {/* Top accent bar */}
                                <div className={`h-1.5 w-full ${
                                  isToday
                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                    : isPast
                                      ? 'bg-gray-200'
                                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                                }`} />

                                <div className="p-4">
                                  {/* Date header */}
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl border-2 ${
                                        isToday
                                          ? 'bg-emerald-500 border-emerald-500 text-white'
                                          : isPast
                                            ? 'bg-gray-100 border-gray-200 text-gray-600'
                                            : 'bg-amber-50 border-amber-200 text-amber-700'
                                      }`}>
                                        <span className="text-lg font-bold leading-none">{lessonDate.getDate()}</span>
                                        <span className="text-[9px] font-medium mt-0.5 opacity-80">
                                          {monthNames[lessonDate.getMonth()].slice(0, 3)}
                                        </span>
                                      </div>
                                      <div>
                                        <p className={`text-sm font-semibold ${isToday ? 'text-emerald-800' : 'text-gray-900'}`}>
                                          {lessonDate.getDate()} {monthNames[lessonDate.getMonth()]}
                                        </p>
                                        <p className={`text-[11px] mt-0.5 ${isToday ? 'text-emerald-600' : 'text-gray-400'}`}>
                                          {dayOfWeek}
                                        </p>
                                      </div>
                                    </div>
                                    {/* Today badge */}
                                    {isToday && (
                                      <div className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                                        Bugun
                                      </div>
                                    )}
                                    {isPast && (
                                      <div className="px-2 py-0.5 bg-gray-200 text-gray-500 text-[10px] font-medium rounded-full">
                                        O'tgan
                                      </div>
                                    )}
                                    {!isPast && !isToday && (
                                      <div className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded-full">
                                        Kelasi
                                      </div>
                                    )}
                                  </div>

                                  {/* Divider */}
                                  <div className={`h-px mb-3 ${isToday ? 'bg-emerald-200' : 'bg-gray-100'}`} />

                                  {/* Info rows */}
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                      <Clock className={`h-3.5 w-3.5 ${isToday ? 'text-emerald-500' : 'text-gray-400'}`} />
                                      <span className="font-medium">{lesson.start_time?.slice(0, 5) || lesson.time?.slice(0, 5)}{lesson.end_time ? ` - ${lesson.end_time.slice(0, 5)}` : ''}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                      <DoorOpen className="h-3.5 w-3.5 text-gray-400" />
                                      {lesson.room ? (
                                        <span className="font-medium">{lesson.room.name}</span>
                                      ) : lesson.room_id ? (
                                        <span className="font-medium">Xona #{lesson.room_id}</span>
                                      ) : (
                                        <span className="text-gray-400">Xonasiz</span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                        lesson.parity === 'odd'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                          : lesson.parity === 'everyday'
                                          ? 'bg-green-50 text-green-700 border border-green-200'
                                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                                      }`}>
                                        <Layers className="h-3 w-3" />
                                        {lesson.parity === 'odd' ? 'Toq hafta' : lesson.parity === 'everyday' ? 'Har kuni' : 'Juft hafta'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="inline-block p-5 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full mb-4">
                          <Calendar className="h-12 w-12 text-amber-500" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-1">Darslar mavjud emas</h4>
                        <p className="text-sm text-gray-500 mb-5">Bu guruhga hali dars qo'shilmagan</p>
                        <Button onClick={() => setShowGenerateLessons(true)}
                          className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md h-10 text-sm">
                          <Plus className="h-4 w-4 mr-1.5" /> Darslar yaratish
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ==================== ATTENDANCE TAB ==================== */}
              <TabsContent value="attendance" className="space-y-6">
                <Card className="border border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-md rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" /> Davomat jadvali
                      </h3>
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm"
                          onClick={() => { setGridYear(prev => gridMonth === 0 ? prev - 1 : prev); setGridMonth(prev => prev === 0 ? 11 : prev - 1); }}
                          className="text-white/80 hover:text-white hover:bg-white/10 h-9 w-9 p-0 rounded-lg">
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <span className="text-white font-semibold text-sm min-w-[120px] text-center select-none">
                          {monthNames[gridMonth]} {gridYear}
                        </span>
                        <Button variant="ghost" size="sm"
                          onClick={() => { setGridYear(prev => gridMonth === 11 ? prev + 1 : prev); setGridMonth(prev => prev === 11 ? 0 : prev + 1); }}
                          className="text-white/80 hover:text-white hover:bg-white/10 h-9 w-9 p-0 rounded-lg">
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                        <span className="w-px h-6 bg-white/30 mx-1" />
                        <Button size="sm" onClick={() => { const d = new Date(); setGridYear(d.getFullYear()); setGridMonth(d.getMonth()); }}
                          className="bg-white text-emerald-700 hover:bg-emerald-50 text-xs h-8 shadow-sm">
                          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Bugun
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-0">
                    {activeRelations.length === 0 ? (
                      <div className="text-center py-10 text-gray-500 text-sm">Bu guruhda studentlar mavjud emas</div>
                    ) : gridLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                        <span className="ml-2.5 text-gray-500 text-sm">Yuklanmoqda...</span>
                      </div>
                    ) : gridLessons.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="inline-block p-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
                          <Calendar className="h-12 w-12 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">Bu oyda darslar mavjud emas</p>
                        <p className="text-sm text-gray-400 mt-1">Boshqa oyni tanlang yoki guruhga dars qo'shing</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto" ref={gridRef}>
                        <Table>
                          <TableHeader className="bg-gray-50/80">
                            <TableRow>
                              <TableHead className="text-gray-500 font-semibold text-xs uppercase tracking-wider sticky left-0 bg-gray-50/80 z-10 min-w-[200px]">Student</TableHead>
                              {gridLessons.map(lesson => {
                                const d = new Date(lesson.date);
                                const dayNum = d.getDate();
                                const dayName = d.toLocaleDateString('uz-UZ', { weekday: 'short' });
                                const isToday = lesson.date.split('T')[0] === todayStr;
                                return (
                                  <TableHead key={lesson.id}
                                    className={`text-center text-xs p-1.5 min-w-[40px] font-medium ${isToday ? 'bg-emerald-100 text-emerald-800' : 'text-gray-500'}`}>
                                    <div className="font-bold text-sm">{dayNum}</div>
                                    <div className="text-[10px] font-normal opacity-70">{dayName}</div>
                                  </TableHead>
                                );
                              })}
                              <TableHead className="text-center text-gray-500 font-semibold text-xs min-w-[60px]">%</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeRelations.map(relation => {
                              const student = relation.student!;
                              let presentCount = 0;
                              let totalCount = 0;
                              return (
                                <TableRow key={student.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-teal-50/30 transition-all duration-200">
                                  <TableCell className="sticky left-0 bg-white z-10 font-medium text-gray-900 text-sm border-r border-gray-100">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8 border-2 border-gray-100 shadow-sm">
                                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-bold">
                                          {getInitials(student.first_name, student.last_name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="truncate max-w-[140px] text-sm">{student.first_name} {student.last_name}</span>
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
                                      <TableCell key={cellKey} className="text-center p-1 relative">
                                        {beforeJoin ? (
                                          <span className="text-gray-200 text-xs mx-auto block w-9 h-9 flex items-center justify-center select-none">&mdash;</span>
                                        ) : isActive ? (
                                          <div className="flex flex-col items-center gap-0.5">
                                            <div className="flex items-center gap-1">
                                              <button onClick={() => markGridAttendance(lesson.id, student.id, true)}
                                                className="w-9 h-9 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-md" title="Bor">B</button>
                                              <button onClick={() => { setShowReasonInput(true); }}
                                                className="w-9 h-9 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors shadow-md" title="Yo'q">Y</button>
                                            </div>
                                            {showReasonInput && (
                                              <div className="flex gap-1 mt-1">
                                                <input type="text" value={cellReason}
                                                  onChange={e => setCellReason(e.target.value)}
                                                  placeholder="Sabab..."
                                                  className="w-[90px] h-7 text-[11px] px-1.5 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-400"
                                                  autoFocus
                                                  onKeyDown={e => {
                                                    if (e.key === 'Enter') markGridAttendance(lesson.id, student.id, false, cellReason || undefined);
                                                    if (e.key === 'Escape') { setShowReasonInput(false); setCellReason(''); }
                                                  }} />
                                                <button onClick={() => markGridAttendance(lesson.id, student.id, false, cellReason || undefined)}
                                                  className="h-7 px-2 text-[11px] bg-blue-500 text-white rounded hover:bg-blue-600">OK</button>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <button onClick={() => {
                                            if (isFuture) return;
                                            setActiveCell({ lessonId: lesson.id, studentId: student.id });
                                            setShowReasonInput(false);
                                            setCellReason('');
                                          }} disabled={isFuture}
                                            title={reasonText ? `Sabab: ${reasonText}` : (isFuture ? 'Kun hali kelmagan' : '')}
                                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all text-sm mx-auto
                                              ${isFuture ? 'cursor-not-allowed opacity-30' : 'cursor-pointer hover:ring-2 hover:ring-emerald-400 hover:shadow-md'}
                                              ${isPresent ? 'bg-emerald-100 text-emerald-700 font-bold' : isAbsent ? 'bg-red-100 text-red-600 font-bold' : isFuture ? 'bg-gray-50 text-gray-300' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                                            {isFuture ? '\u223C' : isPresent ? '\u2713' : isAbsent ? '\u2717' : '-'}
                                          </button>
                                        )}
                                      </TableCell>
                                    );
                                  })}
                                  <TableCell className="text-center">
                                    <span className={cn(
                                      'text-sm font-bold',
                                      totalCount > 0
                                        ? (presentCount / totalCount >= 0.7 ? 'text-emerald-600'
                                          : presentCount / totalCount >= 0.4 ? 'text-amber-600'
                                          : 'text-red-600')
                                        : 'text-gray-400'
                                    )}>
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
                  {/* Monthly Stats */}
                  <Card className="border border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-md rounded-xl overflow-hidden lg:col-span-2">
                    <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" /> Oylik statistika
                        </h3>
                        <Button size="sm" onClick={fetchAttendanceStats}
                          className="bg-white text-violet-700 hover:bg-violet-50 text-xs h-8 shadow-sm">
                          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Yangilash
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      {statsLoading ? (
                        <div className="space-y-3">
                          <Skeleton className="h-10 w-full rounded-lg" />
                          <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                      ) : monthlyStats ? (
                        <div className="space-y-5">
                          <div className="text-center p-6 bg-violet-50 rounded-xl border border-violet-100/50">
                            <p className="text-4xl font-bold text-violet-700">{monthlyStats.presentPercent}%</p>
                            <p className="text-sm text-violet-600 font-medium mt-1">Davomat foizi</p>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100/50 text-center">
                              <p className="text-2xl font-bold text-emerald-700">{monthlyStats.present}</p>
                              <p className="text-xs text-emerald-600 mt-0.5 font-medium">Keldi</p>
                            </div>
                            <div className="p-5 bg-red-50 rounded-xl border border-red-100/50 text-center">
                              <p className="text-2xl font-bold text-red-700">{monthlyStats.absent}</p>
                              <p className="text-xs text-red-600 mt-0.5 font-medium">Kelmadi</p>
                            </div>
                            <div className="p-5 bg-gray-50 rounded-xl border border-gray-100/50 text-center">
                              <p className="text-2xl font-bold text-gray-900">{monthlyStats.lessons}</p>
                              <p className="text-xs text-gray-500 mt-0.5 font-medium">Darslar</p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                            <div className="h-4 rounded-full transition-all duration-500 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500"
                              style={{ width: `${Math.min(Number(monthlyStats.presentPercent), 100)}%` }} />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <div className="inline-block p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-3">
                            <BarChart3 className="h-10 w-10 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium">Statistika mavjud emas</p>
                          <p className="text-xs text-gray-400 mt-1">Ma'lumotlarni yangilash uchun tugmani bosing</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Info */}
                  <Card className="border border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-md rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Users className="h-5 w-5" /> Ma'lumot
                      </h3>
                    </div>
                    <CardContent className="p-6 space-y-3">
                      {[
                        { label: 'Faol studentlar', value: activeRelations.length },
                        { label: 'Bu oydagi darslar', value: gridLessons.length },
                        { label: 'Jami darslar', value: sortedLessons.length },
                        { label: "O'tgan darslar", value: sortedLessons.filter(l => new Date(l.date) <= new Date()).length },
                        { label: 'Kelgusi darslar', value: upcomingLessons.length },
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100/50">
                          <span className="text-sm text-gray-600">{item.label}</span>
                          <span className="text-base font-bold text-gray-900">{item.value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Modals */}
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

      {/* Delete lessons dialog */}
      <AlertDialog open={showDeleteLessons} onOpenChange={setShowDeleteLessons}>
        <AlertDialogContent className="bg-white max-w-lg rounded-2xl border-0 p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Trash2 className="h-6 w-6" /> Darslarni o'chirish
              </AlertDialogTitle>
              <AlertDialogDescription className="text-white/80 text-sm">
                Bu amalni ortga qaytarib bo'lmaydi
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="p-2.5 bg-red-100 rounded-full flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Guruhdagi barcha <strong className="text-red-600">{sortedLessons.length} ta</strong> dars o'chiriladi.
              </p>
            </div>
            <AlertDialogFooter className="flex gap-3">
              <AlertDialogCancel disabled={deletingLessons}
                className="flex-1 border-gray-300 hover:bg-gray-100 h-11 text-sm rounded-xl">Bekor qilish</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAllLessons} disabled={deletingLessons}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white h-11 text-sm rounded-xl shadow-md">
                {deletingLessons ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> O'chirilmoqda...</>
                ) : (
                  <><Trash2 className="h-4 w-4 mr-2" /> Ha, o'chirish</>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set joined date dialog */}
      <AlertDialog open={!!confirmDateStudent} onOpenChange={(open) => { if (!open) setConfirmDateStudent(null); }}>
        <AlertDialogContent className="bg-white max-w-lg rounded-2xl border-0 p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="h-6 w-6" /> Qo'shilgan sanani o'zgartirish
              </AlertDialogTitle>
            </AlertDialogHeader>
          </div>
          <div className="p-6">
            <div className="mb-5">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong className="text-blue-600">{confirmDateStudent?.studentName}</strong> uchun qo'shilgan sanani birinchi dars sanasiga
                {' '}(<strong className="text-blue-600">{confirmDateStudent?.firstLessonDate ? formatDate(confirmDateStudent.firstLessonDate) : '-'}</strong>) o'rnatilsinmi?
              </p>
            </div>
            <AlertDialogFooter className="flex gap-3">
              <AlertDialogCancel disabled={savingDate}
                className="flex-1 border-gray-300 hover:bg-gray-100 h-11 text-sm rounded-xl">Yo'q</AlertDialogCancel>
              <AlertDialogAction onClick={handleSetJoinedToFirstLesson} disabled={savingDate}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-11 text-sm rounded-xl shadow-md">
                {savingDate ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saqlanmoqda...</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-2" /> Ha</>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close group dialog */}
      <AlertDialog open={showCloseGroup} onOpenChange={setShowCloseGroup}>
        <AlertDialogContent className="bg-white max-w-lg rounded-2xl border-0 p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <XCircle className="h-6 w-6" /> Guruhni yopish
              </AlertDialogTitle>
              <AlertDialogDescription className="text-white/80 text-sm">
                Bu amaldan keyin guruhga student qo'shib bo'lmaydi
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="p-2.5 bg-red-100 rounded-full flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Guruh yopilganda barcha <strong className="text-red-600">faol studentlar</strong> guruhdan chiqariladi va yopilish sanasidan keyin qarzdorlik hisoblanmaydi.
              </p>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Yopilish sanasi</label>
              <Input
                type="date"
                value={closeDate}
                onChange={e => setCloseDate(e.target.value)}
                className="h-11 text-sm"
              />
            </div>
            <AlertDialogFooter className="flex gap-3">
              <AlertDialogCancel disabled={closingGroup}
                className="flex-1 border-gray-300 hover:bg-gray-100 h-11 text-sm rounded-xl">Bekor qilish</AlertDialogCancel>
              <AlertDialogAction onClick={async () => {
                if (!closeDate) { toast.error('Yopilish sanasini kiriting'); return; }
                try {
                  setClosingGroup(true);
                  await groupsApi.closeGroup(String(groupId), closeDate);
                  toast.success('Guruh yopildi');
                  setShowCloseGroup(false);
                  await fetchGroupData();
                } catch (err: any) {
                  toast.error(err?.response?.data?.message || err.message || 'Xatolik yuz berdi');
                } finally {
                  setClosingGroup(false);
                }
              }} disabled={closingGroup}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white h-11 text-sm rounded-xl shadow-md">
                {closingGroup ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Yopilmoqda...</>
                ) : (
                  <><XCircle className="h-4 w-4 mr-2" /> Ha, yopish</>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
