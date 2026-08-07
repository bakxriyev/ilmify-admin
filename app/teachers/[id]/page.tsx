'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import {
  ArrowLeft, User, Mail, Phone, Calendar, GraduationCap, BookOpen,
  Users, Edit, Trash2, AlertCircle, CheckCircle, Loader2, Building,
  School, MapPin, DoorOpen, Key, Eye, EyeOff, Award, Clock, Hash, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { teachersApi, type Teacher } from '@/api/teachersApi';
import { groupStudentsApi } from '@/api/groupStudentApi';
import toast from 'react-hot-toast';

export default function TeacherDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
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
    const fetchData = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const data = await teachersApi.getById(id);
        setTeacher(data);
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || "Ma'lumotlarni yuklashda xatolik";
        setFetchError(msg);
        toast.error(msg);
      }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const formatLessonDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getDate()} ${monthNames[d.getMonth()]}`;
  };
  const formatLessonDateFull = (dateString: string) => {
    const d = new Date(dateString);
    const weekdays = ['Yak','Du','Se','Cho','Pay','Ju','Sha'];
    return `${weekdays[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`;
  };
  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('998'))
      return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    return phone;
  };

  const getInitials = (f: string, l: string) => `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await teachersApi.delete(id);
      router.push('/teachers');
    } catch { toast.error('Xatolik'); setShowDeleteModal(false); }
    finally { setIsDeleting(false); }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) { toast.error('Yangi parol kiriting'); return; }
    if (newPassword !== confirmPassword) { toast.error('Parollar mos kelmadi'); return; }
    try {
      setIsUpdatingPassword(true);
      await teachersApi.update(id, { password: newPassword });
      toast.success('Parol yangilandi');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch { toast.error('Xatolik'); }
    finally { setIsUpdatingPassword(false); }
  };

  if (loading) return (
    <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div></Layout>
  );

  if (!teacher) return (
    <Layout><div className="p-6">
      <Button variant="ghost" onClick={() => router.back()} className="text-gray-600 mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Orqaga
      </Button>
      <Alert variant="destructive" className="max-w-lg">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{fetchError || "O'qituvchi topilmadi"}</AlertDescription>
      </Alert>
    </div></Layout>
  );

  const mainGroups = teacher.mainGroups || [];
  const supportGroups = teacher.supportGroups || [];
  const allGroups = [...mainGroups, ...supportGroups];
  const totalStudents = allGroups.reduce((s: number, g: any) => s + (g.student_count || 0), 0);
  const totalRooms = allGroups.filter((g: any) => g.room).length;

  return (
    <Layout>
      <div className="space-y-5 p-4 md:p-6 w-full">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-600">
            <ArrowLeft className="h-4 w-4 mr-2" /> Orqaga
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)} className="border-yellow-300 text-yellow-700">
              <Key className="h-4 w-4 mr-1" /> Parol
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(true)} className="border-red-200 text-red-600">
              <Trash2 className="h-4 w-4 mr-1" /> O'chirish
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-md bg-gradient-to-r from-blue-600 to-indigo-700">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                <AvatarImage src={teacher.photo ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/teachers/${teacher.photo}` : ''} />
                <AvatarFallback className="bg-blue-200 text-blue-800 text-xl font-bold">
                  {getInitials(teacher.first_name, teacher.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-white">
                <h1 className="text-2xl font-bold">{teacher.first_name} {teacher.last_name}</h1>
                <div className="flex flex-wrap gap-3 mt-1 text-white/80 text-sm">
                  <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> ID: {teacher.id}</span>
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {teacher.gmail}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {formatPhone(teacher.phone_number)}</span>
                  <Badge className="bg-white/20 text-white border-0">{teacher.teacher_type === 'MAIN_TEACHER' ? 'Asosiy' : 'Yordamchi'}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-blue-600 font-medium">Guruhlar</p>
            <p className="text-xl font-bold text-gray-900">{allGroups.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs text-green-600 font-medium">O'quvchilar</p>
            <p className="text-xl font-bold text-gray-900">{totalStudents}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3">
            <p className="text-xs text-purple-600 font-medium">Xonalar</p>
            <p className="text-xl font-bold text-gray-900">{totalRooms}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-xs text-amber-600 font-medium">Asosiy/Yordamchi</p>
            <p className="text-xl font-bold text-gray-900">{mainGroups.length}/{supportGroups.length}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-gray-200 p-1 rounded-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs"><User className="h-3.5 w-3.5 mr-1" /> Umumiy</TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs"><BookOpen className="h-3.5 w-3.5 mr-1" /> Guruhlar ({allGroups.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-blue-600" /> Shaxsiy ma'lumotlar</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><p className="text-xs text-gray-500">Ism</p><p className="font-medium text-gray-900">{teacher.first_name}</p></div>
                  <div><p className="text-xs text-gray-500">Familiya</p><p className="font-medium text-gray-900">{teacher.last_name}</p></div>
                  <div><p className="text-xs text-gray-500">Email</p><p className="font-medium text-gray-900 flex items-center gap-1"><Mail className="h-3 w-3 text-gray-400" />{teacher.gmail}</p></div>
                  <div><p className="text-xs text-gray-500">Telefon</p><p className="font-medium text-gray-900 flex items-center gap-1"><Phone className="h-3 w-3 text-gray-400" />{formatPhone(teacher.phone_number)}</p></div>
                  <div><p className="text-xs text-gray-500">Parol</p><p className="font-medium text-gray-900 font-mono text-xs break-all">{teacher.password || "—"}</p></div>
                  <div><p className="text-xs text-gray-500">Rol</p><Badge className="bg-blue-100 text-blue-700">{teacher.teacher_type === 'MAIN_TEACHER' ? 'Asosiy o\'qituvchi' : 'Yordamchi o\'qituvchi'}</Badge></div>
                </div>
              </CardContent>
            </Card>

            {allGroups.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-indigo-600" /> Guruhlar bo'yicha ma'lumot</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-2 text-gray-600">Guruh</th>
                          <th className="text-left p-2 text-gray-600">Rol</th>
                          <th className="text-left p-2 text-gray-600">Xona</th>
                          <th className="text-center p-2 text-gray-600">Yosh./Band/Bo'sh</th>
                          <th className="text-center p-2 text-gray-600">O'quvchi narxi</th>
                          <th className="text-left p-2 text-gray-600">Dars vaqti</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allGroups.map((g: any) => {
                          const nextLesson = g.lessons?.filter((l: any) => new Date(l.date) > new Date()).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
                          return (
                          <tr key={g.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">
                              <Link href={`/groups/${g.id}`} className="text-blue-600 hover:underline">{g.name}</Link>
                            </td>
                            <td className="p-2">
                              {g.room ? <span className="flex items-center gap-1"><DoorOpen className="h-3 w-3 text-gray-400" />{g.room.name}</span> : <span className="text-gray-400">-</span>}
                            </td>
                            <td className="p-2 text-center">
                              {g.room ? (
                                <span className="text-xs font-medium">{g.student_count || 0}/{g.room.occupied_seats || 0}/{g.room.capacity - (g.room.occupied_seats || 0)}</span>
                              ) : (
                                <span className="text-xs">{g.student_count || 0}/-/-</span>
                              )}
                            </td>
                            <td className="p-2 text-center text-xs font-medium">{g.kp ? `${Number(g.kp).toLocaleString()} so'm` : '-'}</td>
                            <td className="p-2 text-xs text-gray-500">{nextLesson ? `${formatLessonDateFull(nextLesson.date)} ${nextLesson.time?.slice(0,5)}` : '-'}</td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="groups" className="space-y-4 mt-4">
            {mainGroups.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-600" /> Asosiy guruhlar ({mainGroups.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mainGroups.map((g: any) => (
                    <Card key={g.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link href={`/groups/${g.id}`} className="font-semibold text-gray-900 hover:text-blue-600">{g.name}</Link>
                            {g.level && <p className="text-xs text-gray-500">{g.level.name} - {g.level.title}</p>}
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">Asosiy</Badge>
                        </div>
                        <div className="mt-3 space-y-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1"><Users className="h-3 w-3" /> {g.student_count || 0} o'quvchi</div>
                          <div className="flex items-center gap-1"><Wallet className="h-3 w-3" /> O'quvchi narxi: {g.kp ? `${Number(g.kp).toLocaleString()} so'm` : '-'}</div>
                          {g.room && (
                            <div className="flex flex-col gap-1 p-2 bg-gray-50 rounded">
                              <span className="flex items-center gap-1"><DoorOpen className="h-3 w-3" /> Xona: {g.room.name}</span>
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Sig'imi: {g.room.capacity} o'rin</span>
                              <span className="flex items-center gap-1 text-amber-600">Band: {g.room.occupied_seats || g.student_count || 0} o'rin</span>
                              <span className="flex items-center gap-1 text-green-600">Bo'sh: {(g.room.capacity - (g.room.occupied_seats || g.student_count || 0))} o'rin</span>
                            </div>
                          )}
                          {g.lessons && g.lessons.length > 0 && (
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Darslar:</p>
                              {g.lessons.slice(0, 3).map((l: any) => (
                                <div key={l.id} className="flex items-center gap-2 text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatLessonDate(l.date)} {l.time?.slice(0,5)}</span>
                                  <Badge className="text-[10px] px-1 py-0">{l.parity === 'odd' ? 'Toq' : l.parity === 'everyday' ? 'Har kuni' : 'Juft'}</Badge>
                                </div>
                              ))}
                              {g.lessons.length > 3 && <p className="text-gray-400 text-[10px] mt-1">+ {g.lessons.length - 3} ta dars</p>}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {supportGroups.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-600" /> Yordamchi guruhlar ({supportGroups.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {supportGroups.map((g: any) => (
                    <Card key={g.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link href={`/groups/${g.id}`} className="font-semibold text-gray-900 hover:text-blue-600">{g.name}</Link>
                            {g.level && <p className="text-xs text-gray-500">{g.level.name} - {g.level.title}</p>}
                          </div>
                          <Badge className="bg-gray-100 text-gray-700">Yordamchi</Badge>
                        </div>
                        <div className="mt-3 space-y-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1"><Users className="h-3 w-3" /> {g.student_count || 0} o'quvchi</div>
                          <div className="flex items-center gap-1"><Wallet className="h-3 w-3" /> O'quvchi narxi: {g.kp ? `${Number(g.kp).toLocaleString()} so'm` : '-'}</div>
                          {g.room && (
                            <div className="flex flex-col gap-1 p-2 bg-gray-50 rounded">
                              <span className="flex items-center gap-1"><DoorOpen className="h-3 w-3" /> Xona: {g.room.name}</span>
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Sig'imi: {g.room.capacity} o'rin</span>
                              <span className="flex items-center gap-1 text-amber-600">Band: {g.room.occupied_seats || g.student_count || 0} o'rin</span>
                              <span className="flex items-center gap-1 text-green-600">Bo'sh: {(g.room.capacity - (g.room.occupied_seats || g.student_count || 0))} o'rin</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {allGroups.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>O'qituvchi hech qanday guruhga biriktirilmagan</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button variant="outline" asChild className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
            <Link href={`/teachers/${id}/payments`}><Wallet className="h-4 w-4 mr-2" /> To'lovlar hisoboti</Link>
          </Button>
          <Button variant="outline" asChild className="border-blue-200 text-blue-600">
            <Link href={`/teachers/${id}/edit`}><Edit className="h-4 w-4 mr-2" /> Tahrirlash</Link>
          </Button>
        </div>
      </div>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader><DialogTitle>O'qituvchini o'chirish</DialogTitle>
          <DialogDescription><span className="font-semibold text-red-600">{teacher.first_name} {teacher.last_name}</span> ni o'chirasizmi?</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> O'chirilmoqda...</> : 'O\'chirish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader><DialogTitle>Parolni o'zgartirish</DialogTitle>
          <DialogDescription>{teacher.first_name} {teacher.last_name} uchun yangi parol</DialogDescription></DialogHeader>
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
