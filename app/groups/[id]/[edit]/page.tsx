'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle, ArrowLeft, Save, Plus, Trash2, DoorOpen, Check, ChevronsUpDown,
  UserCheck, Users, Wallet, Layers, School, GraduationCap, Calendar, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupsApi, type Group, type UpdateGroupRequest } from '@/api/groupsApi';
import { lessonsApi, type Lesson, type CreateLessonRequest } from '@/api/lessonsApi';
import { teachersApi, type Teacher } from '@/api/teachersApi';
import { roomsApi, type Room } from '@/api/roomsApi';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import toast from 'react-hot-toast';

export default function EditGroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<UpdateGroupRequest>({
    name: '',
    teacher_id: '',
    support_teacher_id: '',
    room_id: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const [mainTeachers, setMainTeachers] = useState<Teacher[]>([]);
  const [supportTeachers, setSupportTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [fetchingMeta, setFetchingMeta] = useState(true);
  const [mainTeacherOpen, setMainTeacherOpen] = useState(false);
  const [supportTeacherOpen, setSupportTeacherOpen] = useState(false);
  const [mainTeacherSearch, setMainTeacherSearch] = useState('');
  const [supportTeacherSearch, setSupportTeacherSearch] = useState('');
  const [priceText, setPriceText] = useState('');
  const [kpText, setKpText] = useState('');

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [lessonFormData, setLessonFormData] = useState<CreateLessonRequest>({
    group_id: groupId,
    date: '',
    time: '',
    parity: undefined,
  });
  const [lessonsOpen, setLessonsOpen] = useState(true);

  const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const selectedRoom = rooms.find(r => r.id === formData.room_id);
  const selectedMainTeacher = mainTeachers.find(t => t.id.toString() === formData.teacher_id);
  const selectedSupportTeacher = supportTeachers.find(t => t.id.toString() === formData.support_teacher_id);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [groupData, teachersRes, roomsRes] = await Promise.all([
          groupsApi.getById(groupId),
          teachersApi.getAll({ limit: 1000 }),
          roomsApi.getAll(),
        ]);

        setGroup(groupData);
        setFormData({
          name: groupData.name,
          teacher_id: String(groupData.teacher_id),
          support_teacher_id: groupData.support_teacher_id ? String(groupData.support_teacher_id) : '',
          room_id: groupData.room_id ? String(groupData.room_id) : '',
          monthly_price: groupData.monthly_price,
          kp: groupData.kp,
        });
        setPriceText(groupData.monthly_price ? String(groupData.monthly_price) : '');
        setKpText(groupData.kp ? String(groupData.kp) : '');

        const teachers = teachersRes.data;
        setMainTeachers(teachers.filter(t => t.teacher_type === 'MAIN_TEACHER'));
        setSupportTeachers(teachers.filter(t => t.teacher_type === 'SUPPORT'));

        if (Array.isArray(roomsRes)) {
          setRooms(roomsRes);
        } else if (roomsRes?.data && Array.isArray(roomsRes.data)) {
          setRooms(roomsRes.data);
        }

        await fetchLessons();
      } catch (err: any) {
        toast.error(err.message || "Ma'lumotlarni yuklashda xatolik");
      } finally {
        setLoading(false);
        setFetchingMeta(false);
      }
    };
    fetchAll();
  }, [groupId]);

  const fetchLessons = async () => {
    try {
      setLessonsLoading(true);
      const data = await lessonsApi.getByGroup(groupId);
      setLessons(data);
    } catch {
      toast.error("Darslarni yuklashda xatolik");
    } finally {
      setLessonsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) { toast.error('Guruh nomi majburiy'); return; }
    if (!formData.teacher_id) { toast.error('Iltimos, asosiy o\'qituvchini tanlang'); return; }

    try {
      setSubmitting(true);

      const payload: any = {
        ...formData,
        teacher_id: Number(formData.teacher_id),
      };
      if (formData.support_teacher_id) {
        payload.support_teacher_id = Number(formData.support_teacher_id);
      } else {
        payload.support_teacher_id = null;
      }
      payload.room_id = formData.room_id ? Number(formData.room_id) : null;
      payload.monthly_price = priceText ? Number(priceText) : undefined;
      payload.kp = kpText ? Number(kpText) : undefined;

      await groupsApi.update(groupId, payload);
      toast.success('Guruh muvaffaqiyatli yangilandi!');
      router.push(`/groups/${groupId}`);
    } catch (err: any) {
      toast.error(err.message || 'Guruhni yangilashda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonFormData.date || !lessonFormData.time) {
      toast.error('Sana va vaqt majburiy');
      return;
    }

    try {
      await lessonsApi.create({
        ...lessonFormData,
        group_id: groupId,
      });
      toast.success('Dars muvaffaqiyatli yaratildi!');
      await fetchLessons();
      setLessonFormOpen(false);
      resetLessonForm();
    } catch (err: any) {
      toast.error(err.message || 'Darsni yaratishda xatolik');
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('Bu darsni o\'chirishga ishonchingiz komilmi?')) return;
    try {
      await lessonsApi.delete(id);
      toast.success('Dars muvaffaqiyatli o\'chirildi!');
      await fetchLessons();
    } catch (err: any) {
      toast.error(err.message || 'Darsni o\'chirishda xatolik');
    }
  };

  const resetLessonForm = () => {
    setLessonFormData({
      group_id: groupId,
      date: '',
      time: '',
      parity: undefined,
    });
  };

  if (loading || fetchingMeta) {
    return (
      <Layout>
        <div className="w-full min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-white">
          <div className="w-full h-full p-6 md:p-8 lg:p-10">
            <div className="max-w-[1000px] mx-auto space-y-6">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-[600px] w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!group) {
    return (
      <Layout>
        <div className="w-full min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-white">
          <div className="w-full h-full p-6 md:p-8 lg:p-10">
            <div className="max-w-[1000px] mx-auto">
              <Button variant="ghost" asChild className="hover:bg-blue-50 text-gray-600 hover:text-blue-600 h-9 text-sm -ml-2">
                <Link href="/groups">
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Guruhlarga qaytish
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
      <div className="w-full min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full h-full p-6 md:p-8 lg:p-10">
          <div className="max-w-[1000px] mx-auto space-y-6">

            {/* Back */}
            <div>
              <Button variant="ghost" asChild className="hover:bg-blue-50 text-gray-600 hover:text-blue-600 h-9 text-sm -ml-2">
                <Link href={`/groups/${groupId}`}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Guruh tafsilotlariga qaytish
                </Link>
              </Button>
            </div>

            {/* Header card */}
            <Card className="border-0 rounded-2xl shadow-lg overflow-hidden">
              <div className="relative h-36 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.06]">
                  <School className="h-32 w-32 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                      <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white">Guruhni tahrirlash</h1>
                      <p className="text-white/70 text-sm mt-0.5">{group.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Form card */}
            <Card className="border border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-md rounded-2xl overflow-hidden">
              <form onSubmit={handleSubmit}>
                <CardContent className="p-0">
                  <div className="p-6 md:p-8 space-y-7">
                    {/* Main info section */}
                    <div>
                      <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-5">
                        <div className="p-1.5 bg-blue-50 rounded-lg"><Layers className="h-4 w-4 text-blue-600" /></div>
                        Asosiy ma'lumotlar
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-gray-900 font-medium text-sm flex items-center gap-1">
                            Guruh nomi <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="h-11 text-sm rounded-xl border-gray-300 focus:border-blue-400 focus:ring-blue-400 transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="monthly_price" className="text-gray-900 font-medium text-sm flex items-center gap-1">
                            <Wallet className="h-3.5 w-3.5 text-gray-400" /> Oylik to'lov narxi
                          </Label>
                          <Input
                            id="monthly_price"
                            type="text"
                            inputMode="numeric"
                            value={priceText}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '');
                              setPriceText(digits);
                              setFormData({ ...formData, monthly_price: digits ? Number(digits) : undefined });
                            }}
                            placeholder="Masalan, 600000"
                            className="h-11 text-sm rounded-xl border-gray-300 focus:border-blue-400 focus:ring-blue-400 transition-all"
                          />
                          {priceText && (
                            <p className="text-xs text-gray-500">
                              {Number(priceText).toLocaleString('uz-UZ')} so'm
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="kp" className="text-gray-900 font-medium text-sm flex items-center gap-1">
                            <Wallet className="h-3.5 w-3.5 text-gray-400" /> O'quvchi narxi (KP)
                          </Label>
                          <Input
                            id="kp"
                            type="text"
                            inputMode="numeric"
                            value={kpText}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '');
                              setKpText(digits);
                              setFormData({ ...formData, kp: digits ? Number(digits) : undefined });
                            }}
                            placeholder="Masalan, 150000"
                            className="h-11 text-sm rounded-xl border-gray-300 focus:border-blue-400 focus:ring-blue-400 transition-all"
                          />
                          <p className="text-xs text-gray-500">Ustozga beriladigan KP summasi</p>
                        </div>
                      </div>
                    </div>

                    {/* Teachers section */}
                    <div className="border-t border-gray-100 pt-7">
                      <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-5">
                        <div className="p-1.5 bg-emerald-50 rounded-lg"><Users className="h-4 w-4 text-emerald-600" /></div>
                        O'qituvchilar
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-gray-900 font-medium text-sm flex items-center gap-1">
                            <UserCheck className="h-3.5 w-3.5 text-blue-500" /> Asosiy o'qituvchi <span className="text-red-500">*</span>
                          </Label>
                          <Popover open={mainTeacherOpen} onOpenChange={setMainTeacherOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={mainTeacherOpen}
                                className="w-full justify-between h-11 text-sm rounded-xl border-gray-300 bg-white hover:bg-gray-50 transition-all"
                              >
                                <span className={selectedMainTeacher ? 'text-gray-900' : 'text-gray-400'}>
                                  {selectedMainTeacher
                                    ? `${selectedMainTeacher.first_name} ${selectedMainTeacher.last_name}`
                                    : "Asosiy o'qituvchini tanlang"}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                              <Command className="rounded-xl">
                                <CommandInput
                                  placeholder="O'qituvchi qidirish..."
                                  value={mainTeacherSearch}
                                  onValueChange={setMainTeacherSearch}
                                  className="h-11"
                                />
                                <CommandList>
                                  <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                      <UserCheck className="h-8 w-8 text-gray-300" />
                                      O'qituvchi topilmadi
                                    </div>
                                  </CommandEmpty>
                                  <CommandGroup className="max-h-56 overflow-y-auto p-1">
                                    {mainTeachers
                                      .filter(t =>
                                        t.first_name.toLowerCase().includes(mainTeacherSearch.toLowerCase()) ||
                                        t.last_name.toLowerCase().includes(mainTeacherSearch.toLowerCase()) ||
                                        (t.gmail || '').toLowerCase().includes(mainTeacherSearch.toLowerCase())
                                      )
                                      .map((teacher) => (
                                        <CommandItem
                                          key={teacher.id}
                                          value={`${teacher.first_name} ${teacher.last_name} ${teacher.gmail || ''}`}
                                          onSelect={() => {
                                            setFormData({ ...formData, teacher_id: teacher.id.toString() });
                                            setMainTeacherOpen(false);
                                            setMainTeacherSearch('');
                                          }}
                                          className="rounded-lg cursor-pointer hover:bg-blue-50 aria-selected:bg-blue-50 transition-colors"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              formData.teacher_id === teacher.id.toString() ? "opacity-100 text-blue-600" : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">
                                              {teacher.first_name} {teacher.last_name}
                                            </span>
                                            <span className="text-xs text-gray-400">{teacher.gmail}</span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-900 font-medium text-sm flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-indigo-500" /> Yordamchi o'qituvchi
                          </Label>
                          <Popover open={supportTeacherOpen} onOpenChange={setSupportTeacherOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={supportTeacherOpen}
                                className="w-full justify-between h-11 text-sm rounded-xl border-gray-300 bg-white hover:bg-gray-50 transition-all"
                              >
                                <span className={selectedSupportTeacher ? 'text-gray-900' : 'text-gray-400'}>
                                  {selectedSupportTeacher
                                    ? `${selectedSupportTeacher.first_name} ${selectedSupportTeacher.last_name}`
                                    : "Yordamchi o'qituvchini tanlang (ixtiyoriy)"}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                              <Command className="rounded-xl">
                                <CommandInput
                                  placeholder="O'qituvchi qidirish..."
                                  value={supportTeacherSearch}
                                  onValueChange={setSupportTeacherSearch}
                                  className="h-11"
                                />
                                <CommandList>
                                  <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                      <Users className="h-8 w-8 text-gray-300" />
                                      O'qituvchi topilmadi
                                    </div>
                                  </CommandEmpty>
                                  <CommandGroup className="max-h-56 overflow-y-auto p-1">
                                    <CommandItem
                                      onSelect={() => {
                                        setFormData({ ...formData, support_teacher_id: '' });
                                        setSupportTeacherOpen(false);
                                        setSupportTeacherSearch('');
                                      }}
                                      className="rounded-lg cursor-pointer hover:bg-gray-50 aria-selected:bg-gray-50 transition-colors"
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", !formData.support_teacher_id ? "opacity-100 text-gray-600" : "opacity-0")} />
                                      <span className="text-sm text-gray-500">Yo'q (tanlanmagan)</span>
                                    </CommandItem>
                                    {supportTeachers
                                      .filter(t =>
                                        t.first_name.toLowerCase().includes(supportTeacherSearch.toLowerCase()) ||
                                        t.last_name.toLowerCase().includes(supportTeacherSearch.toLowerCase()) ||
                                        (t.gmail || '').toLowerCase().includes(supportTeacherSearch.toLowerCase())
                                      )
                                      .map((teacher) => (
                                        <CommandItem
                                          key={teacher.id}
                                          value={`${teacher.first_name} ${teacher.last_name} ${teacher.gmail || ''}`}
                                          onSelect={() => {
                                            setFormData({ ...formData, support_teacher_id: teacher.id.toString() });
                                            setSupportTeacherOpen(false);
                                            setSupportTeacherSearch('');
                                          }}
                                          className="rounded-lg cursor-pointer hover:bg-indigo-50 aria-selected:bg-indigo-50 transition-colors"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              formData.support_teacher_id === teacher.id.toString() ? "opacity-100 text-indigo-600" : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">
                                              {teacher.first_name} {teacher.last_name}
                                            </span>
                                            <span className="text-xs text-gray-400">{teacher.gmail}</span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>

                    {/* Room section */}
                    <div className="border-t border-gray-100 pt-7">
                      <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-5">
                        <div className="p-1.5 bg-teal-50 rounded-lg"><DoorOpen className="h-4 w-4 text-teal-600" /></div>
                        Xona
                      </h2>
                      <div className="space-y-2">
                        <Select
                          value={formData.room_id || 'none'}
                          onValueChange={(value) => setFormData({ ...formData, room_id: value === 'none' ? '' : value })}
                        >
                          <SelectTrigger className="h-11 text-sm rounded-xl border-gray-300 focus:border-teal-400 focus:ring-teal-400 transition-all">
                            <SelectValue placeholder="Xonani tanlang (ixtiyoriy)" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-200 bg-white shadow-lg">
                            <SelectItem value="none" className="text-gray-400">Xonasiz</SelectItem>
                            {rooms.length === 0 ? (
                              <SelectItem value="no-room" disabled className="text-gray-400">
                                Xonalar mavjud emas
                              </SelectItem>
                            ) : (
                              rooms.map((room) => (
                                <SelectItem key={room.id} value={room.id.toString()}>
                                  {room.name} ({room.capacity} o'rin)
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {selectedRoom && (
                          <div className="flex items-center gap-3 p-4 bg-teal-50/80 rounded-xl border border-teal-200/80 shadow-sm">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <DoorOpen className="h-5 w-5 text-teal-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">{selectedRoom.name}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                <span>Sig'imi: <strong className="text-gray-900">{selectedRoom.capacity}</strong></span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span>Band: <strong className="text-amber-600">{selectedRoom.occupied_seats}</strong></span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span>Bo'sh: <strong className="text-emerald-600">{selectedRoom.capacity - selectedRoom.occupied_seats}</strong></span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lessons section */}
                    <div className="border-t border-gray-100 pt-7">
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                          <div className="p-1.5 bg-amber-50 rounded-lg"><Calendar className="h-4 w-4 text-amber-600" /></div>
                          Darslar
                        </h2>
                        <Button
                          type="button"
                          onClick={() => {
                            resetLessonForm();
                            setLessonFormOpen(true);
                          }}
                          className="h-9 text-xs rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-sm"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Dars qo'shish
                        </Button>
                      </div>

                      {lessonFormOpen && (
                        <Card className="mb-5 border border-amber-200/80 bg-amber-50/30 shadow-sm rounded-xl overflow-hidden">
                          <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5">
                            <h3 className="text-sm font-semibold text-white">Yangi dars</h3>
                          </div>
                          <CardContent className="p-4">
                            <form onSubmit={handleLessonSubmit} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="lesson-date" className="text-gray-700 text-sm">Sana *</Label>
                                  <Input
                                    id="lesson-date"
                                    type="date"
                                    value={lessonFormData.date}
                                    onChange={(e) => setLessonFormData({ ...lessonFormData, date: e.target.value })}
                                    required
                                    className="h-10 text-sm rounded-xl border-gray-300"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="lesson-time" className="text-gray-700 text-sm">Vaqt *</Label>
                                  <Input
                                    id="lesson-time"
                                    type="time"
                                    value={lessonFormData.time}
                                    onChange={(e) => setLessonFormData({ ...lessonFormData, time: e.target.value })}
                                    required
                                    className="h-10 text-sm rounded-xl border-gray-300"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="lesson-parity" className="text-gray-700 text-sm">Hafta rejimi</Label>
                                  <Select
                                    value={lessonFormData.parity || ''}
                                    onValueChange={(value: 'odd' | 'even' | 'everyday') => setLessonFormData({ ...lessonFormData, parity: value, weekdays: value === 'everyday' ? lessonFormData.weekdays || 'mon-sat' : undefined })}
                                  >
                                    <SelectTrigger className="h-10 text-sm rounded-xl border-gray-300">
                                      <SelectValue placeholder="Rejimni tanlang" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-200 bg-white shadow-lg">
                                      <SelectItem value="odd">Toq haftalar</SelectItem>
                                      <SelectItem value="even">Juft haftalar</SelectItem>
                                      <SelectItem value="everyday">Har kuni</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {lessonFormData.parity === 'everyday' && (
                                    <Select
                                      value={lessonFormData.weekdays || 'mon-sat'}
                                      onValueChange={(value: 'mon-fri' | 'mon-sat') => setLessonFormData({ ...lessonFormData, weekdays: value })}
                                    >
                                      <SelectTrigger className="h-10 text-sm rounded-xl border-gray-300">
                                        <SelectValue placeholder="Ish kunlari" />
                                      </SelectTrigger>
                                      <SelectContent className="rounded-xl border-gray-200 bg-white shadow-lg">
                                        <SelectItem value="mon-fri">Dushanbadan Jumagacha</SelectItem>
                                        <SelectItem value="mon-sat">Dushanbadan Shanbagacha</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setLessonFormOpen(false);
                                    resetLessonForm();
                                  }}
                                  className="h-9 text-xs rounded-xl"
                                >
                                  Bekor qilish
                                </Button>
                                <Button type="submit" className="h-9 text-xs rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm">
                                  Dars yaratish
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      )}

                      <Collapsible open={lessonsOpen} onOpenChange={setLessonsOpen}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full flex justify-between text-gray-900 hover:bg-gray-50 transition-all rounded-xl h-10">
                            <span className="font-medium">{lessons.length} ta dars</span>
                            <span className="text-xs text-gray-500">{lessonsOpen ? 'Yashirish' : 'Ko\'rsatish'}</span>
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 mt-2">
                          {lessonsLoading ? (
                            <div className="space-y-2">
                              <Skeleton className="h-12 w-full rounded-lg" />
                              <Skeleton className="h-12 w-full rounded-lg" />
                            </div>
                          ) : lessons.length === 0 ? (
                            <p className="text-gray-500 text-sm py-4 text-center">Hali darslar yo'q.</p>
                          ) : (
                            lessons.map((lesson) => {
                              const lessonDate = new Date(lesson.date);
                              const formattedDate = `${lessonDate.getDate()} ${monthNames[lessonDate.getMonth()]} ${lessonDate.getFullYear()}`;
                              return (
                                <div
                                  key={lesson.id}
                                  className="flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl transition-all hover:shadow-md hover:border-gray-300"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 rounded-lg">
                                      <Calendar className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900 text-sm">
                                        {formattedDate} soat {lesson.time.slice(0,5)}
                                      </div>
                                      {lesson.parity && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full mt-0.5 inline-block ${
                                          lesson.parity === 'odd'
                                            ? 'bg-amber-50 text-amber-700'
                                            : lesson.parity === 'everyday'
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {lesson.parity === 'odd' ? 'Toq' : lesson.parity === 'everyday' ? 'Har kuni' : 'Juft'} hafta
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteLesson(lesson.id)}
                                    className="h-9 w-9 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 md:px-8 py-5">
                    <p className="text-xs text-gray-400 hidden sm:block">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      Barcha ma'lumotlarni to'g'ri kiritganingizga ishonch hosil qiling
                    </p>
                    <div className="flex items-center gap-3 ml-auto">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push(`/groups/${groupId}`)}
                        disabled={submitting}
                        className="h-11 px-5 text-sm rounded-xl border-gray-300 hover:bg-gray-100"
                      >
                        Bekor qilish
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting || !formData.name || !formData.teacher_id}
                        className="h-11 px-6 text-sm rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {submitting ? (
                          <><span className="animate-spin mr-2">⏳</span> Yangilanmoqda...</>
                        ) : (
                          <><Save className="h-4 w-4 mr-2" /> Guruhni yangilash</>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </form>
            </Card>

          </div>
        </div>
      </div>
    </Layout>
  );
}
