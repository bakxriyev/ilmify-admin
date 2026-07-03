'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import {
  ArrowLeft, User, Mail, Phone, Calendar, Building, Key, Users,
  Edit, Trash2, BarChart3, X, AlertCircle, CheckCircle, Loader2,
  Eye, EyeOff, GraduationCap, BookOpen, Clock, DollarSign, Wallet,
  Heart, Shield, School, MapPin, Hash, UserCheck, CreditCard,
  ChevronDown, ChevronUp, RefreshCw, XCircle, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { studentsApi, type Student } from '@/api/studentApi';
import { paymentsApi, type Payment } from '@/api/paymentsApi';
import { attendanceApi, type GroupAttendanceRecord } from '@/api/attendanceApi';
import { groupsApi, type Group } from '@/api/groupsApi';
import toast from 'react-hot-toast';

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [student, setStudent] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceStats, setAttendanceStats] = useState({ total: 0, present: 0, absent: 0, rate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Inline edit
  const [editingField, setEditingField] = useState<'phone' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSavingField, setIsSavingField] = useState(false);

  const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

  // YANGI TO'LOV UCHUN STATLAR
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [debtData, setDebtData] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState(1);
  const [selectedDebtId, setSelectedDebtId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    Promise.all([
      studentsApi.getById(id),
      paymentsApi.findByStudent(Number(id)),
      paymentsApi.getStudentDebts(Number(id)),
    ]).then(([s, p, d]) => {
      setStudent(s);
      setPayments(p);
      setDebtData(d);
    }).catch(err => setError(err.message || 'Xatolik')).finally(() => setLoading(false));
  }, [id]);

  const getActiveGroups = () => student?.group_students?.filter((gs: any) => !gs.left_date).map((gs: any) => gs.group) || [];
  const getGroupId = () => getActiveGroups()[0]?.id || student?.group?.id;
  const getGroupInfo = () => getActiveGroups()[0] || student?.group;
  const getLessonsFromGroupInfo = () => getActiveGroups()[0]?.lessons || [];

  useEffect(() => {
    const gid = getGroupId();
    if (gid) {
      loadAttendanceStats(gid);
    }
  }, [student]);

  const loadAttendanceStats = async (gid: number) => {
    try {
      setAttendanceLoading(true);
      const now = new Date();
      const stats = await attendanceApi.getStats(Number(gid), now.getFullYear(), now.getMonth() + 1);
      setAttendanceStats({
        total: stats.lessons,
        present: stats.present,
        absent: stats.absent,
        rate: stats.presentPercent,
      });
    } catch {} finally { setAttendanceLoading(false); }
  };

  const handleMarkAttendance = async (isPresent: boolean, reason?: string) => {
    const gid = getGroupId();
    if (!gid || !attendanceDate) return;
    try {
      const lessons = getLessonsFromGroupInfo();
      const todayLesson = lessons.find((l: any) => l.date.split('T')[0] === attendanceDate);
      if (!todayLesson) { toast.error('Bu sana uchun dars topilmadi'); return; }

      await attendanceApi.markLesson({
        lesson_id: Number(todayLesson.id),
        attendance: [{ student_id: Number(student.id), is_present: isPresent, reason }],
      });
      toast.success(isPresent ? 'Keldi' : "Kelmadi");
      loadAttendanceStats(gid);
    } catch { toast.error('Xatolik'); }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  };

  const formatPhone = (phone: string | null | undefined) => {
    if (!phone) return '—';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('998'))
      return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    return phone;
  };

  const getInitials = (f: string, l: string) => `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();

  const handleDelete = async () => {
    if (!student) return;
    try {
      setIsDeleting(true);
      await studentsApi.delete(student.id);
      router.push('/students');
    } catch (err: any) {
      setError(err.message || 'Xatolik');
      setShowDeleteModal(false);
    } finally { setIsDeleting(false); }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) { setError('Yangi parol kiriting'); return; }
    if (newPassword !== confirmPassword) { setError('Parollar mos kelmadi'); return; }
    try {
      setIsUpdatingPassword(true);
      await studentsApi.updatePassword(student.id, { password: newPassword });
      setSuccess('Parol yangilandi');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) { setError(err.message || 'Xatolik'); }
    finally { setIsUpdatingPassword(false); }
  };

  const savePhone = async () => {
    if (!student) return;
    try {
      setIsSavingField(true);
      const fd = new FormData();
      fd.append('phone_number', editValue.trim());
      await studentsApi.update(student.id, fd);
      setStudent((prev: any) => ({ ...prev, phone_number: editValue.trim() || null }));
      setEditingField(null);
      setSuccess('Telefon raqam yangilandi');
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Xatolik');
    } finally {
      setIsSavingField(false);
    }
  };

  if (loading) return (
    <Layout><div className="p-6 space-y-4">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-36 w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div></Layout>
  );

  if (!student) return (
    <Layout><div className="p-6">
      <Alert variant="destructive" className="max-w-lg">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Student topilmadi</AlertDescription>
      </Alert>
    </div></Layout>
  );

  const groupInfo = student.group_students?.[0]?.group || student.group;
  const mainTeacher = groupInfo?.mainTeacher;
  const supportTeacher = groupInfo?.supportTeacher;
  const allGroupLessons = getActiveGroups().flatMap((g: any) => (g.lessons || []).map((l: any) => ({ ...l, groupName: g.name })));
  const sortedLessons = [...allGroupLessons].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const upcomingLessons = sortedLessons.filter((l: any) => new Date(l.date) > new Date());

  const parents = student.parent_links?.map((pl: any) => pl.parent).filter(Boolean) || [];
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalUnpaid = payments.filter(p => p.status === 'unpaid').reduce((s, p) => s + Number(p.amount || 0), 0);

  const statCards = [
    { label: "To'lovlar", value: `${payments.length} ta`, icon: Wallet, color: 'blue' },
    { label: "To'langan", value: `${Number(totalPaid).toLocaleString()} so'm`, icon: CreditCard, color: 'green' },
    { label: 'Qarzdorlik', value: `${Number(totalUnpaid).toLocaleString()} so'm`, icon: DollarSign, color: 'red' },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-4 bg-gray-50 min-h-screen">
        {success && (
          <div className="fixed top-4 right-4 z-50 animate-slideInRight">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">{success}</span>
              <button onClick={() => setSuccess(null)}><X className="h-3 w-3" /></button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-600 h-8 px-2">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Orqaga
          </Button>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" onClick={() => router.push(`/students/${student.id}/edit`)} className="border-blue-200 text-blue-600 h-8">
              <Edit className="h-3.5 w-3.5 mr-1" /> Tahrirlash
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowDeleteModal(true)} className="border-red-200 text-red-600 h-8">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> O'chirish
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* GRADIENT BANNER */}
        <div className="relative h-36 rounded-xl overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-md">
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
            <div className="flex items-end gap-4">
              <Avatar className="h-14 w-14 border-2 border-white/80 shadow-lg">
                <AvatarImage src={student.photo ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/students/${student.photo}` : ''} />
                <AvatarFallback className="bg-blue-200 text-blue-800 text-lg font-bold">
                  {getInitials(student.first_name, student.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-white pb-0.5">
                <h1 className="text-xl font-bold">{student.first_name} {student.last_name}</h1>
                <div className="flex items-center gap-2 text-white/80 text-xs mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> ID: {student.id}</span>
                  {getActiveGroups().length > 0 ? (
                    getActiveGroups().map((g: any) => (
                      <span key={g.id} className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-white/50" />
                        <Users className="h-3 w-3" /> {g.name}
                      </span>
                    ))
                  ) : student?.group ? (
                    <>
                      <span className="w-1 h-1 rounded-full bg-white/50" />
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {student.group.name}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${s.color}-50`}>
                    <Icon className={`h-4 w-4 text-${s.color}-600`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-sm font-bold text-gray-900">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 overflow-x-auto">
            <TabsList className="w-full bg-transparent gap-0.5">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap rounded-md px-3 py-1.5 text-xs">
                <User className="h-3.5 w-3.5 mr-1" /> Umumiy
              </TabsTrigger>
              <TabsTrigger value="group" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap rounded-md px-3 py-1.5 text-xs">
                <Building className="h-3.5 w-3.5 mr-1" /> Guruh
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap rounded-md px-3 py-1.5 text-xs">
                <Wallet className="h-3.5 w-3.5 mr-1" /> To'lovlar
              </TabsTrigger>
              <TabsTrigger value="parents" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap rounded-md px-3 py-1.5 text-xs">
                <Heart className="h-3.5 w-3.5 mr-1" /> Ota-ona
              </TabsTrigger>
              <TabsTrigger value="attendance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap rounded-md px-3 py-1.5 text-xs">
                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Davomat
              </TabsTrigger>
              <TabsTrigger value="lessons" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap rounded-md px-3 py-1.5 text-xs">
                <BookOpen className="h-3.5 w-3.5 mr-1" /> Darslar
              </TabsTrigger>
            </TabsList>
          </div>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg py-3 px-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <User className="h-4 w-4 text-blue-600" /> Shaxsiy ma'lumotlar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Ism</p>
                    <p className="text-gray-900 font-semibold mt-0.5 text-sm">{student.first_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Familiya</p>
                    <p className="text-gray-900 font-semibold mt-0.5 text-sm">{student.last_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-gray-900 font-semibold mt-0.5 flex items-center gap-1 text-sm">
                      <Mail className="h-3.5 w-3.5 text-gray-400" /> {student.email || "Ko'rsatilmagan"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Telefon</p>
                    <p className="text-gray-900 font-semibold mt-0.5 flex items-center gap-1.5 text-sm">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      {editingField === 'phone' ? (
                        <Input
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="h-7 w-40 text-xs"
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') savePhone(); if (e.key === 'Escape') setEditingField(null); }}
                        />
                      ) : (
                        <span className="cursor-pointer hover:text-blue-600" onClick={() => { setEditingField('phone'); setEditValue(student.phone_number || ''); }}>
                          {formatPhone(student.phone_number)}
                        </span>
                      )}
                      {editingField === 'phone' ? (
                        <>
                          <button onClick={savePhone} className="text-green-600 hover:text-green-800 text-xs">Saqlash</button>
                          <button onClick={() => setEditingField(null)} className="text-gray-400 hover:text-gray-600 text-xs">Bekor</button>
                        </>
                      ) : (
                        <button onClick={() => { setEditingField('phone'); setEditValue(student.phone_number || ''); }} className="text-blue-500 hover:text-blue-700">
                          <Edit className="h-3 w-3" />
                        </button>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Parol</p>
                    <p className="text-gray-900 font-semibold mt-0.5 flex items-center gap-1.5 text-sm">
                      <Key className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-mono text-[10px] break-all">{student.password || "—"}</span>
                      <button onClick={() => setShowPasswordModal(true)} className="text-blue-500 hover:text-blue-700">
                        <Edit className="h-3 w-3" />
                      </button>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Guruhlar</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {getActiveGroups().length > 0 ? (
                        getActiveGroups().map((g: any) => (
                          <Badge key={g.id} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 text-[10px] px-1.5 py-0">
                            <Building className="h-2.5 w-2.5 mr-0.5" />
                            {g.name}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-gray-900 text-sm">Guruhsiz</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg py-3 px-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <BarChart3 className="h-4 w-4 text-purple-600" /> Faollik ko'rsatkichlari
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-lg font-bold text-blue-700">{student.student_answers?.length || 0}</p>
                    <p className="text-[10px] text-blue-600 mt-0.5">Topshiriqlar</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-lg font-bold text-green-700">{student.exercise_results?.length || 0}</p>
                    <p className="text-[10px] text-green-600 mt-0.5">Mashqlar</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg text-center">
                    <p className="text-lg font-bold text-amber-700">{student.unit_results?.length || 0}</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">Bo'limlar</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <p className="text-lg font-bold text-purple-700">{student.vocab_results?.length || 0}</p>
                    <p className="text-[10px] text-purple-600 mt-0.5">So'z boyligi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GROUP TAB */}
          <TabsContent value="group" className="space-y-4">
            {getActiveGroups().length > 0 ? (
              <div className="space-y-4">
                {getActiveGroups().map((g: any) => (
                  <div key={g.id} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="border-0 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <Building className="h-4 w-4" /> {g.name}
                        </h3>
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">{g.name}</h4>
                            <p className="text-xs text-gray-500">ID: {g.id}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-700 border-0 text-[10px] px-2">Faol</Badge>
                        </div>
                        {g.level && (
                          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                            <GraduationCap className="h-4 w-4 text-purple-600" />
                            <span className="text-xs font-medium text-purple-700">{g.level.name} - {g.level.title}</span>
                          </div>
                        )}
                        {g.kp && (
                          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                            <Wallet className="h-4 w-4 text-orange-600" />
                            <span className="text-xs font-medium text-orange-700">O'quvchi narxi: {Number(g.kp).toLocaleString()} so'm / oy</span>
                          </div>
                        )}
                        {g.room && (
                          <div className="flex items-center gap-2 p-2 bg-teal-50 rounded-lg">
                            <MapPin className="h-4 w-4 text-teal-600" />
                            <div className="text-xs">
                              <span className="font-medium text-teal-700">{g.room.name}</span>
                              <span className="text-teal-600 ml-1">
                                ({g.room.capacity} o'rin, {g.room.occupied_seats} band)
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-100">
                          <h5 className="text-xs font-medium text-gray-500 mb-1.5">Darslar jadvali</h5>
                          {(g.lessons || []).length > 0 ? (
                            <div className="space-y-1 max-h-36 overflow-y-auto">
                              {(g.lessons || []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((lesson: any) => (
                                <div key={lesson.id} className="flex items-center justify-between p-1.5 bg-gray-50 rounded text-xs">
                                  <span className="text-gray-700">{formatDate(lesson.date)}</span>
                                  <span className="text-gray-500">{lesson.time?.slice(0, 5)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">Darslar mavjud emas</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      {g.mainTeacher && (
                        <Card className="border-0 shadow-sm overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                              <UserCheck className="h-4 w-4" /> Asosiy o'qituvchi
                            </h3>
                          </div>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border-2 border-blue-200">
                                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs">
                                  {getInitials(g.mainTeacher.first_name, g.mainTeacher.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold text-gray-900 text-sm">{g.mainTeacher.first_name} {g.mainTeacher.last_name}</h4>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                  <Mail className="h-3 w-3" /> {g.mainTeacher.gmail}
                                </p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {g.mainTeacher.phone_number || "Ko'rsatilmagan"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {g.supportTeacher && (
                        <Card className="border-0 shadow-sm overflow-hidden">
                          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                              <Users className="h-4 w-4" /> Yordamchi o'qituvchi
                            </h3>
                          </div>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border-2 border-indigo-200">
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-xs">
                                  {getInitials(g.supportTeacher.first_name, g.supportTeacher.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold text-gray-900 text-sm">{g.supportTeacher.first_name} {g.supportTeacher.last_name}</h4>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                  <Mail className="h-3 w-3" /> {g.supportTeacher.gmail}
                                </p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {g.supportTeacher.phone_number || "Ko'rsatilmagan"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-sm"><CardContent className="text-center py-8 text-gray-500">
                <Building className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">Student hech qanday guruhga biriktirilmagan</p>
              </CardContent></Card>
            )}
          </TabsContent>

          {/* PAYMENTS TAB */}
          <TabsContent value="payments" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg"><Wallet className="h-4 w-4 text-blue-600" /></div>
                  <div><p className="text-[10px] text-gray-500">Jami to'lovlar</p><p className="text-sm font-bold text-gray-900">{payments.length} ta</p></div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg"><CreditCard className="h-4 w-4 text-green-600" /></div>
                  <div><p className="text-[10px] text-gray-500">To'langan</p><p className="text-sm font-bold text-green-600">{Number(totalPaid).toLocaleString()} so'm</p></div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg"><DollarSign className="h-4 w-4 text-red-600" /></div>
                  <div><p className="text-[10px] text-gray-500">Jami qarzdorlik</p><p className="text-sm font-bold text-red-600">{Number(debtData?.total_debt || 0).toLocaleString()} so'm</p></div>
                </CardContent>
              </Card>
            </div>

            {/* DEBTS */}
            <Card className="border-0 shadow-sm border-l-4 border-l-red-500 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between bg-red-50 rounded-none py-3 px-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <AlertCircle className="h-4 w-4 text-red-600" /> 
                  Qarzdorliklar {debtData?.debts ? `(${debtData.debts.length})` : ''}
                </CardTitle>
                <Button size="sm" onClick={() => { setPaymentStep(1); setShowPaymentDialog(true); }} className="bg-blue-600 hover:bg-blue-700 h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> To'lov qilish
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {debtData?.debts && debtData.debts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-red-50">
                        <TableRow>
                          <TableHead className="text-xs py-2">Oy</TableHead>
                          <TableHead className="text-xs py-2">Guruh</TableHead>
                          <TableHead className="text-right text-xs py-2">Summa</TableHead>
                          <TableHead className="text-center text-xs py-2">Holat</TableHead>
                          <TableHead className="text-center text-xs py-2">Amal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {debtData.debts.map((d: any) => (
                          <TableRow key={`${d.year}-${d.month}-${d.group_id}`} className="hover:bg-red-50">
                            <TableCell className="text-xs py-2">{d.month_name} {d.year}</TableCell>
                            <TableCell className="text-xs py-2">{d.group_name}</TableCell>
                            <TableCell className="text-right font-bold text-red-600 text-xs py-2">{Number(d.amount).toLocaleString()} so'm</TableCell>
                            <TableCell className="text-center py-2">
                              <Badge className="bg-red-100 text-red-700 border-0 text-[10px] px-1.5">Qarzdorlik</Badge>
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <Button size="sm" variant="ghost" onClick={() => { setSelectedDebtId(d.id || 0); setPaymentAmount(d.amount.toString()); setPaymentStep(3); setShowPaymentDialog(true); }} className="text-blue-600 hover:text-blue-800 h-6 text-xs">
                                To'lash
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <CheckCircle className="h-6 w-6 mx-auto text-green-400 mb-1" />
                    <p className="text-xs">Qarzdorlik mavjud emas</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PAID PAYMENTS */}
            <Card className="border-0 shadow-sm border-l-4 border-l-green-500 overflow-hidden">
              <CardHeader className="bg-green-50 rounded-none py-3 px-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle className="h-4 w-4 text-green-600" /> 
                  To'langan {debtData?.paid_payments ? `(${debtData.paid_payments.length})` : ''}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {debtData?.paid_payments && debtData.paid_payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-green-50">
                        <TableRow>
                          <TableHead className="text-xs py-2">Oy</TableHead>
                          <TableHead className="text-xs py-2">Guruh</TableHead>
                          <TableHead className="text-right text-xs py-2">Summa</TableHead>
                          <TableHead className="text-xs py-2">To'landi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {debtData.paid_payments.map((p: any) => (
                          <TableRow key={p.id} className="hover:bg-green-50">
                            <TableCell className="text-xs py-2">{p.month_name} {p.year}</TableCell>
                            <TableCell className="text-xs py-2">{p.group_name}</TableCell>
                            <TableCell className="text-right font-bold text-green-600 text-xs py-2">{Number(p.amount).toLocaleString()} so'm</TableCell>
                            <TableCell className="text-xs text-gray-500 py-2">{p.paid_at}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <CreditCard className="h-6 w-6 mx-auto text-gray-300 mb-1" />
                    <p className="text-xs">To'langan to'lovlar mavjud emas</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ORPHANED PAYMENTS */}
            {debtData?.orphaned_payments && debtData.orphaned_payments.length > 0 && (
              <Card className="border-0 shadow-sm border-l-4 border-l-gray-400 overflow-hidden">
                <CardHeader className="bg-gray-100 rounded-none py-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                    <AlertCircle className="h-4 w-4 text-gray-400" /> 
                    Guruhi o'chirilgan ({debtData.orphaned_payments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-100">
                        <TableRow>
                          <TableHead className="text-xs py-2">Oy</TableHead>
                          <TableHead className="text-right text-xs py-2">Summa</TableHead>
                          <TableHead className="text-center text-xs py-2">Holat</TableHead>
                          <TableHead className="text-center text-xs py-2">Sana</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {debtData.orphaned_payments.map((p: any) => (
                          <TableRow key={p.id} className="hover:bg-gray-50">
                            <TableCell className="text-xs py-2">{p.month_name} {p.year}</TableCell>
                            <TableCell className="text-right font-bold text-xs py-2">{Number(p.amount).toLocaleString()} so'm</TableCell>
                            <TableCell className="text-center py-2">
                              <Badge className={`${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} text-[10px] px-1.5`}>
                                {p.status === 'paid' ? "To'langan" : "To'lanmagan"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-xs text-gray-500 py-2">{p.paid_at || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* PAYMENT HISTORY */}
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-none py-3 px-4">
                <CardTitle className="text-sm font-semibold">
                  To'lov tarixi {payments.length > 0 ? `(${payments.length})` : ''}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="text-xs py-2">Oy</TableHead>
                          <TableHead className="text-xs py-2">Guruh</TableHead>
                          <TableHead className="text-right text-xs py-2">Summa</TableHead>
                          <TableHead className="text-center text-xs py-2">Holat</TableHead>
                          <TableHead className="text-center text-xs py-2">Sana</TableHead>
                          <TableHead className="text-xs py-2">Izoh</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map(p => (
                          <TableRow key={p.id} className="hover:bg-gray-50">
                            <TableCell className="text-xs py-2">{monthNames[p.month - 1]} {p.year}</TableCell>
                            <TableCell className="text-xs py-2">{p.group?.name || '-'}</TableCell>
                            <TableCell className="text-right font-medium text-xs py-2">{Number(p.amount).toLocaleString()} so'm</TableCell>
                            <TableCell className="text-center py-2">
                              <Badge className={`${p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'} text-[10px] px-1.5`}>
                                {p.status === 'paid' ? "To'langan" : p.status === 'partial' ? 'Qisman' : "To'lanmagan"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-xs text-gray-500 py-2">{p.paid_at || '-'}</TableCell>
                            <TableCell className="text-xs text-gray-500 max-w-[120px] truncate py-2">{p.note || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Wallet className="h-6 w-6 mx-auto text-gray-300 mb-1" />
                    <p className="text-xs">To'lov tarixi mavjud emas</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PAYMENT DIALOG */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogContent className="max-w-lg bg-white">
                {paymentStep === 1 && (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-base">Qarzdorlikni to'lash</DialogTitle>
                      <DialogDescription className="text-xs">O'quvchi {student?.first_name} {student?.last_name} uchun qarzdorliklar</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {debtData?.debts?.length > 0 ? (
                        debtData.debts.map((d: any) => (
                          <div
                            key={`${d.year}-${d.month}-${d.group_id}`}
                            onClick={() => { setSelectedDebtId(d.id || 0); setPaymentAmount(d.amount.toString()); setPaymentStep(3); }}
                            className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{d.month_name} {d.year}</p>
                                <p className="text-xs text-gray-500">{d.group_name}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-red-600 text-sm">{Number(d.amount).toLocaleString()} so'm</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                          <p className="text-sm font-medium">Qarzdorlik yo'q!</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {paymentStep === 3 && (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-base">To'lov qilish</DialogTitle>
                      <DialogDescription className="text-xs">To'lov miqdorini va izohni kiriting</DialogDescription>
                    </DialogHeader>
                    {paymentError && (
                      <Alert variant="destructive" className="py-2"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs">{paymentError}</AlertDescription></Alert>
                    )}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-gray-700 font-medium">To'lov miqdori (so'm)</Label>
                        <Input
                          type="number"
                          value={paymentAmount}
                          onChange={e => { setPaymentAmount(e.target.value); setPaymentError(''); }}
                          placeholder="Miqdorni kiriting"
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-700 font-medium">Izoh (ixtiyoriy)</Label>
                        <Input
                          value={paymentNote}
                          onChange={e => setPaymentNote(e.target.value)}
                          placeholder="To'lov izohini kiriting"
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                    </div>
                    <DialogFooter className="gap-1.5 mt-2">
                      <Button variant="outline" size="sm" onClick={() => { setPaymentStep(1); setPaymentError(''); }} className="h-8 text-xs">Boshqa</Button>
                      <Button variant="outline" size="sm" onClick={() => { setShowPaymentDialog(false); setPaymentAmount(''); setPaymentNote(''); setPaymentStep(1); }} className="h-8 text-xs">Bekor</Button>
                      <Button size="sm" onClick={async () => {
                          if (!paymentAmount || Number(paymentAmount) <= 0) {
                            setPaymentError('To\'lov miqdori 0 dan katta bo\'lishi kerak');
                            return;
                          }
                          try {
                            setIsPaymentLoading(true);
                            await paymentsApi.update(selectedDebtId || 0, {
                              status: 'paid',
                              paid_at: new Date().toISOString().split('T')[0],
                              note: paymentNote,
                            });
                            toast.success('To\'lov muvaffaqiyatli qabul qilindi!');
                            setShowPaymentDialog(false);
                            setPaymentAmount('');
                            setPaymentNote('');
                            setPaymentStep(1);
                            const [p, d] = await Promise.all([
                              paymentsApi.findByStudent(Number(id)),
                              paymentsApi.getStudentDebts(Number(id)),
                            ]);
                            setPayments(p);
                            setDebtData(d);
                          } catch (err: any) {
                            setPaymentError(err.message || 'To\'lovda xatolik');
                          } finally {
                            setIsPaymentLoading(false);
                          }
                        }}
                        disabled={isPaymentLoading}
                        className="bg-green-600 hover:bg-green-700 h-8 text-xs"
                      >
                        {isPaymentLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                        ✓ To'lovni qabul qilish
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* PARENTS TAB */}
          <TabsContent value="parents" className="space-y-4">
            {parents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parents.map((parent: any, idx: number) => (
                  <Card key={idx} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-pink-200">
                          <AvatarImage src={parent.photo ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/parents/${parent.photo}` : ''} />
                          <AvatarFallback className="bg-pink-100 text-pink-700 font-bold text-xs">
                            {getInitials(parent.first_name, parent.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{parent.first_name} {parent.last_name}</h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" /> {formatPhone(parent.phone_number)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-sm"><CardContent className="text-center py-8 text-gray-500">
                <Heart className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">Ota-ona ma'lumotlari mavjud emas</p>
              </CardContent></Card>
            )}
          </TabsContent>

          {/* ATTENDANCE TAB */}
          <TabsContent value="attendance" className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-blue-600 font-medium">Jami darslar</p>
                <p className="text-lg font-bold text-gray-900">{attendanceStats.total}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-green-600 font-medium">Kelgan</p>
                <p className="text-lg font-bold text-green-600">{attendanceStats.present}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-red-600 font-medium">Kelmagan</p>
                <p className="text-lg font-bold text-red-600">{attendanceStats.absent}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-purple-600 font-medium">Davomat</p>
                <p className="text-lg font-bold text-purple-600">{attendanceStats.rate}%</p>
              </div>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader className="py-3 px-4"><CardTitle className="text-sm">Davomat qilish</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="flex items-center gap-2">
                  <Input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="w-36 h-8 text-xs" />
                  <Button size="sm" onClick={() => handleMarkAttendance(true)} className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" /> Keldi
                  </Button>
                  <Button size="sm" onClick={() => handleMarkAttendance(false)} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 h-8 text-xs">
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Kelmadi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LESSONS TAB */}
          <TabsContent value="lessons" className="space-y-4">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-amber-600 to-orange-700 px-4 py-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Darslar jadvali ({sortedLessons.length})
                </h3>
              </div>
              <CardContent className="p-4">
                {upcomingLessons.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-1.5 text-xs">
                      <Clock className="h-4 w-4 text-amber-600" /> Keyingi dars
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-white rounded border border-amber-200">
                        <Calendar className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{formatDate(upcomingLessons[0].date)}</p>
                        <p className="text-xs text-gray-600 mt-0.5">soat {upcomingLessons[0].time?.slice(0, 5)}</p>
                      </div>
                    </div>
                  </div>
                )}
                {sortedLessons.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="text-xs py-2">Sana</TableHead>
                          <TableHead className="text-xs py-2">Vaqt</TableHead>
                          <TableHead className="text-xs py-2">Guruh</TableHead>
                          <TableHead className="text-xs py-2">Hafta</TableHead>
                          <TableHead className="text-xs py-2">Holat</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedLessons.map((lesson: any) => (
                          <TableRow key={lesson.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-xs py-2">{formatDate(lesson.date)}</TableCell>
                            <TableCell className="text-xs py-2">{lesson.time?.slice(0, 5)}</TableCell>
                            <TableCell className="py-2">
                              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 text-[10px] px-1.5 py-0">
                                {lesson.groupName}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2">
                              <Badge variant="outline" className={`${
                                lesson.parity === 'odd' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                lesson.parity === 'everyday' ? 'bg-green-100 text-green-700 border-green-200' :
                                'bg-gray-100 text-gray-700'
                              } text-[10px] px-1.5`}>
                                {lesson.parity === 'odd' ? 'Toq' : lesson.parity === 'everyday' ? 'Har kuni' : 'Juft'}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-1.5">
                                <div className={`h-1.5 w-1.5 rounded-full ${new Date(lesson.date) > new Date() ? 'bg-green-500' : 'bg-gray-300'}`} />
                                <span className="text-xs">{new Date(lesson.date) > new Date() ? 'Kutilmoqda' : "O'tgan"}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm">Darslar mavjud emas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)} className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 h-8 text-xs">
            <Key className="h-3.5 w-3.5 mr-1" /> Parolni o'zgartirish
          </Button>
        </div>
      </div>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Studentni o'chirish</DialogTitle>
            <DialogDescription className="text-xs"><span className="font-semibold text-red-600">{student.first_name} {student.last_name}</span> ni o'chirishni tasdiqlaysizmi?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(false)} className="h-8 text-xs">Bekor qilish</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting} className="bg-red-600 h-8 text-xs">
              {isDeleting ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> O'chirilmoqda...</> : 'O\'chirish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="bg-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Parolni o'zgartirish</DialogTitle>
            <DialogDescription className="text-xs">{student.first_name} {student.last_name} uchun yangi parol</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Yangi parol</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="pr-8 h-8 text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Parolni tasdiqlang</Label>
              <div className="relative">
                <Input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="pr-8 h-8 text-sm" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setShowPasswordModal(false); setNewPassword(''); setConfirmPassword(''); }} className="h-8 text-xs">Bekor qilish</Button>
            <Button size="sm" onClick={handleUpdatePassword} disabled={isUpdatingPassword} className="bg-blue-600 h-8 text-xs">
              {isUpdatingPassword ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Saqlanmoqda...</> : 'Saqlash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
