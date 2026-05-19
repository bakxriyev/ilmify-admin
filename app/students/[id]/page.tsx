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
  ChevronDown, ChevronUp, RefreshCw, XCircle,
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

  useEffect(() => {
    Promise.all([
      studentsApi.getById(id),
      paymentsApi.findByStudent(Number(id)),
    ]).then(([s, p]) => {
      setStudent(s);
      setPayments(p);
    }).catch(err => setError(err.message || 'Xatolik')).finally(() => setLoading(false));
  }, [id]);

  const getGroupId = () => student?.group_students?.[0]?.group?.id || student?.group?.id;
  const getGroupInfo = () => student?.group_students?.[0]?.group || student?.group;
  const getLessonsFromGroupInfo = () => getGroupInfo()?.lessons || [];

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
    return d.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatPhone = (phone: string) => {
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

  if (loading) return (
    <Layout><div className="p-6 space-y-6">
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
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
  const lessons = groupInfo?.lessons || [];
  const sortedLessons = [...lessons].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const upcomingLessons = sortedLessons.filter((l: any) => new Date(l.date) > new Date());

  const parents = student.parent_links?.map((pl: any) => pl.parent).filter(Boolean) || [];
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalUnpaid = payments.filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);

  const statCards = [
    { label: "To'lovlar", value: `${payments.length} ta`, icon: Wallet, color: 'green' },
    { label: "To'langan", value: `${totalPaid.toLocaleString()} so'm`, icon: CreditCard, color: 'emerald' },
    { label: 'Qarzdorlik', value: `${totalUnpaid.toLocaleString()} so'm`, icon: DollarSign, color: 'red' },
  ];

  return (
    <Layout>
      <div className="space-y-6 p-6 w-full bg-gray-50 min-h-screen">
        {success && (
          <div className="fixed top-4 right-4 z-50 animate-slideInRight">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">{success}</span>
              <button onClick={() => setSuccess(null)}><X className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-600">
            <ArrowLeft className="h-4 w-4 mr-2" /> Orqaga
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/students/${student.id}/edit`)} className="border-blue-200 text-blue-600">
              <Edit className="h-4 w-4 mr-2" /> Tahrirlash
            </Button>
            <Button variant="outline" onClick={() => setShowDeleteModal(true)} className="border-red-200 text-red-600">
              <Trash2 className="h-4 w-4 mr-2" /> O'chirish
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-0 shadow-xl bg-white overflow-hidden">
          <div className="relative h-36 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <School className="h-28 w-28 text-white" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                  <AvatarImage src={student.photo ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/students/${student.photo}` : ''} />
                  <AvatarFallback className="bg-blue-200 text-blue-800 text-xl font-bold">
                    {getInitials(student.first_name, student.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <h1 className="text-2xl font-bold">{student.first_name} {student.last_name}</h1>
                  <div className="flex items-center gap-3 text-white/80 text-sm mt-1">
                    <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> ID: {student.id}</span>
                    {groupInfo && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/50" />
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {groupInfo.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <Card key={i} className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-lg bg-${s.color}-50`}>
                  <s.icon className={`h-5 w-5 text-${s.color}-600`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-lg overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap">
              <User className="h-4 w-4 mr-1.5" /> Umumiy
            </TabsTrigger>
            <TabsTrigger value="group" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap">
              <Building className="h-4 w-4 mr-1.5" /> Guruh & O'qituvchilar
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap">
              <Wallet className="h-4 w-4 mr-1.5" /> To'lovlar
            </TabsTrigger>
            <TabsTrigger value="parents" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap">
              <Heart className="h-4 w-4 mr-1.5" /> Ota-ona
            </TabsTrigger>
            <TabsTrigger value="attendance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap">
              <CheckCircle className="h-4 w-4 mr-1.5" /> Davomat
            </TabsTrigger>
            <TabsTrigger value="lessons" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap">
              <BookOpen className="h-4 w-4 mr-1.5" /> Darslar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-blue-600" /> Shaxsiy ma'lumotlar</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Ism</p>
                    <p className="text-gray-900 font-semibold mt-1">{student.first_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Familiya</p>
                    <p className="text-gray-900 font-semibold mt-1">{student.last_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Email</p>
                    <p className="text-gray-900 font-semibold mt-1 flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-gray-400" /> {student.email || "Ko'rsatilmagan"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Telefon</p>
                    <p className="text-gray-900 font-semibold mt-1 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-gray-400" /> {formatPhone(student.phone_number)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Parol</p>
                    <p className="text-gray-900 font-semibold mt-1 font-mono text-xs break-all">{student.password || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Guruh</p>
                    <p className="text-gray-900 font-semibold mt-1">{groupInfo?.name || "Guruhsiz"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-purple-600" /> Faollik ko'rsatkichlari</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-blue-700">{student.student_answers?.length || 0}</p>
                    <p className="text-xs text-blue-600">Topshiriqlar</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-green-700">{student.exercise_results?.length || 0}</p>
                    <p className="text-xs text-green-600">Mashqlar</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-amber-700">{student.unit_results?.length || 0}</p>
                    <p className="text-xs text-amber-600">Bo'limlar</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-purple-700">{student.vocab_results?.length || 0}</p>
                    <p className="text-xs text-purple-600">So'z boyligi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="group" className="space-y-6">
            {groupInfo ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-md">
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Building className="h-5 w-5" /> Guruh ma'lumotlari
                    </h3>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 text-xl">{groupInfo.name}</h4>
                        <p className="text-sm text-gray-500">ID: {groupInfo.id}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-0">Faol</Badge>
                    </div>
                    {groupInfo.level && (
                      <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                        <GraduationCap className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-purple-700">{groupInfo.level.name} - {groupInfo.level.title}</span>
                      </div>
                    )}
                    {groupInfo.kp && (
                      <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                        <Wallet className="h-5 w-5 text-orange-600" />
                        <span className="font-medium text-orange-700">O'quvchi narxi: {Number(groupInfo.kp).toLocaleString()} so'm / oy</span>
                        {groupInfo.monthly_price && (
                          <span className="text-sm text-orange-600 ml-2">
                            (oyiga)
                          </span>
                        )}
                      </div>
                    )}
                    {groupInfo.room && (
                      <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-teal-600" />
                        <div>
                          <span className="font-medium text-teal-700">{groupInfo.room.name}</span>
                          <span className="text-sm text-teal-600 ml-2">
                            ({groupInfo.room.capacity} o'rin, {groupInfo.room.occupied_seats} band)
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-100">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">Darslar jadvali</h5>
                      {sortedLessons.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {sortedLessons.map((lesson: any) => (
                            <div key={lesson.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                              <span className="text-gray-700">{formatDate(lesson.date)}</span>
                              <span className="text-gray-500">{lesson.time?.slice(0, 5)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Darslar mavjud emas</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  {mainTeacher && (
                    <Card className="border-0 shadow-md">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <UserCheck className="h-5 w-5" /> Asosiy o'qituvchi
                        </h3>
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14 border-2 border-blue-200">
                            <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                              {getInitials(mainTeacher.first_name, mainTeacher.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-gray-900">{mainTeacher.first_name} {mainTeacher.last_name}</h4>
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <Mail className="h-3.5 w-3.5" /> {mainTeacher.gmail}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" /> {mainTeacher.phone_number || "Ko'rsatilmagan"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {supportTeacher && (
                    <Card className="border-0 shadow-md">
                      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Users className="h-5 w-5" /> Yordamchi o'qituvchi
                        </h3>
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14 border-2 border-indigo-200">
                            <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                              {getInitials(supportTeacher.first_name, supportTeacher.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-gray-900">{supportTeacher.first_name} {supportTeacher.last_name}</h4>
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <Mail className="h-3.5 w-3.5" /> {supportTeacher.gmail}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" /> {supportTeacher.phone_number || "Ko'rsatilmagan"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : (
              <Card className="border-0 shadow-md"><CardContent className="text-center py-12 text-gray-500">
                <Building className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>Student hech qanday guruhga biriktirilmagan</p>
              </CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-lg"><Wallet className="h-5 w-5 text-blue-600" /></div>
                  <div><p className="text-xs text-gray-500">Jami to'lovlar</p><p className="text-lg font-bold text-gray-900">{payments.length} ta</p></div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 bg-green-50 rounded-lg"><CreditCard className="h-5 w-5 text-green-600" /></div>
                  <div><p className="text-xs text-gray-500">To'langan</p><p className="text-lg font-bold text-green-600">{totalPaid.toLocaleString()} so'm</p></div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 bg-red-50 rounded-lg"><DollarSign className="h-5 w-5 text-red-600" /></div>
                  <div><p className="text-xs text-gray-500">Qarzdorlik</p><p className="text-lg font-bold text-red-600">{totalUnpaid.toLocaleString()} so'm</p></div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle>To'lov tarixi</CardTitle></CardHeader>
              <CardContent className="p-0">
                {payments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500"><Wallet className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p>To'lovlar mavjud emas</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>Oy</TableHead>
                          <TableHead>Guruh</TableHead>
                          <TableHead className="text-right">Summa</TableHead>
                          <TableHead className="text-center">Holat</TableHead>
                          <TableHead className="text-center">Sana</TableHead>
                          <TableHead>Izoh</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map(p => (
                          <TableRow key={p.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{p.month}-oy / {p.year}</TableCell>
                            <TableCell>{p.group?.name || '-'}</TableCell>
                            <TableCell className="text-right font-medium">{p.amount.toLocaleString()} so'm</TableCell>
                            <TableCell className="text-center">
                              <Badge className={p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                                {p.status === 'paid' ? "To'langan" : p.status === 'partial' ? 'Qisman' : "To'lanmagan"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-gray-500">{p.paid_at || '-'}</TableCell>
                            <TableCell className="text-gray-500 max-w-[150px] truncate">{p.note || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parents" className="space-y-6">
            {parents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {parents.map((parent: any, idx: number) => (
                  <Card key={idx} className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-pink-200">
                          <AvatarImage src={parent.photo ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/parents/${parent.photo}` : ''} />
                          <AvatarFallback className="bg-pink-100 text-pink-700 font-bold">
                            {getInitials(parent.first_name, parent.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">{parent.first_name} {parent.last_name}</h4>
                          <p className="text-gray-500 flex items-center gap-1 mt-1">
                            <Phone className="h-3.5 w-3.5" /> {formatPhone(parent.phone_number)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-md"><CardContent className="text-center py-12 text-gray-500">
                <Heart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>Ota-ona ma'lumotlari mavjud emas</p>
              </CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xs text-blue-600">Jami darslar</p>
                <p className="text-xl font-bold text-gray-900">{attendanceStats.total}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-xs text-green-600">Kelgan</p>
                <p className="text-xl font-bold text-green-600">{attendanceStats.present}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-xs text-red-600">Kelmagan</p>
                <p className="text-xl font-bold text-red-600">{attendanceStats.absent}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <p className="text-xs text-purple-600">Davomat</p>
                <p className="text-xl font-bold text-purple-600">{attendanceStats.rate}%</p>
              </div>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">Davomat qilish</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="w-44" />
                  <Button size="sm" onClick={() => handleMarkAttendance(true)} className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="h-4 w-4 mr-1" /> Keldi
                  </Button>
                  <Button size="sm" onClick={() => handleMarkAttendance(false)} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                    <XCircle className="h-4 w-4 mr-1" /> Kelmadi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lessons" className="space-y-6">
            <Card className="border-0 shadow-md">
              <div className="bg-gradient-to-r from-amber-600 to-orange-700 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5" /> Darslar jadvali ({sortedLessons.length})
                </h3>
              </div>
              <CardContent className="p-6">
                {upcomingLessons.length > 0 && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 mb-6">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-600" /> Keyingi dars
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                        <Calendar className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{formatDate(upcomingLessons[0].date)}</p>
                        <p className="text-sm text-gray-600 mt-1">soat {upcomingLessons[0].time?.slice(0, 5)}</p>
                      </div>
                    </div>
                  </div>
                )}
                {sortedLessons.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>Sana</TableHead>
                          <TableHead>Vaqt</TableHead>
                          <TableHead>Hafta</TableHead>
                          <TableHead>Holat</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedLessons.map((lesson: any) => (
                          <TableRow key={lesson.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{formatDate(lesson.date)}</TableCell>
                            <TableCell>{lesson.time?.slice(0, 5)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={lesson.parity === 'odd' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-700'}>
                                {lesson.parity === 'odd' ? 'Toq' : 'Juft'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${new Date(lesson.date) > new Date() ? 'bg-green-500' : 'bg-gray-300'}`} />
                                <span className="text-sm">{new Date(lesson.date) > new Date() ? 'Kutilmoqda' : "O'tgan"}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p>Darslar mavjud emas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowPasswordModal(true)} className="border-yellow-300 text-yellow-700 hover:bg-yellow-50">
            <Key className="h-4 w-4 mr-2" /> Parolni o'zgartirish
          </Button>
        </div>
      </div>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Studentni o'chirish</DialogTitle>
            <DialogDescription><span className="font-semibold text-red-600">{student.first_name} {student.last_name}</span> ni o'chirishni tasdiqlaysizmi?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="bg-red-600">
              {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> O'chirilmoqda...</> : 'O\'chirish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Parolni o'zgartirish</DialogTitle>
            <DialogDescription>{student.first_name} {student.last_name} uchun yangi parol</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Yangi parol</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Parolni tasdiqlang</Label>
              <div className="relative">
                <Input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="pr-10" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPasswordModal(false); setNewPassword(''); setConfirmPassword(''); }}>Bekor qilish</Button>
            <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword} className="bg-blue-600">
              {isUpdatingPassword ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saqlanmoqda...</> : 'Saqlash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
