'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  ArrowLeft, Save, DoorOpen, Check, ChevronsUpDown, UserCheck, Users,
  Calendar, Clock, BookOpen, GraduationCap, Hash, Wallet, AlertCircle,
  School, Layers, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupsApi, type CreateGroupRequest } from '@/api/groupsApi';
import { teachersApi, type Teacher } from '@/api/teachersApi';
import { roomsApi, type Room } from '@/api/roomsApi';
import toast from 'react-hot-toast';

export default function CreateGroupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateGroupRequest>({
    name: '',
    teacher_id: '',
    support_teacher_id: '',
    room_id: '',
    monthly_price: undefined,
    start_time: '',
    end_time: '',
  });

  const [mainTeachers, setMainTeachers] = useState<Teacher[]>([]);
  const [supportTeachers, setSupportTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [mainTeacherOpen, setMainTeacherOpen] = useState(false);
  const [supportTeacherOpen, setSupportTeacherOpen] = useState(false);
  const [mainTeacherSearch, setMainTeacherSearch] = useState('');
  const [supportTeacherSearch, setSupportTeacherSearch] = useState('');
  const [priceText, setPriceText] = useState('');

  const selectedRoom = rooms.find(r => r.id === formData.room_id);
  const selectedMainTeacher = mainTeachers.find(t => t.id.toString() === formData.teacher_id);
  const selectedSupportTeacher = supportTeachers.find(t => t.id.toString() === formData.support_teacher_id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);
        const [teachersRes, roomsRes] = await Promise.all([
          teachersApi.getAll({ limit: 1000 }),
          roomsApi.getAll(),
        ]);

        const teachers = teachersRes.data;
        setMainTeachers(teachers.filter(t => t.teacher_type === 'MAIN_TEACHER'));
        setSupportTeachers(teachers.filter(t => t.teacher_type === 'SUPPORT'));

        if (Array.isArray(roomsRes)) {
          setRooms(roomsRes);
        } else if (roomsRes?.data && Array.isArray(roomsRes.data)) {
          setRooms(roomsRes.data);
        }
      } catch (err: any) {
        toast.error(err.message || "Ma'lumotlarni yuklashda xatolik");
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const handlePriceChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    setPriceText(digits);
    setFormData({ ...formData, monthly_price: digits ? Number(digits) : undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Guruh nomi majburiy');
      return;
    }
    if (!formData.teacher_id) {
      toast.error('Iltimos, asosiy o\'qituvchini tanlang');
      return;
    }

    try {
      setLoading(true);

      const payload: any = {
        name: formData.name,
        teacher_id: Number(formData.teacher_id),
      };

      if (formData.support_teacher_id) payload.support_teacher_id = Number(formData.support_teacher_id);
      if (formData.room_id) payload.room_id = Number(formData.room_id);
      if (formData.monthly_price) payload.monthly_price = formData.monthly_price;
      if (formData.kp) payload.kp = formData.kp;
      if (formData.start_date) payload.start_date = formData.start_date;
      if (formData.duration_months) payload.duration_months = formData.duration_months;
      if (formData.time) payload.time = formData.time;
      if (formData.start_time) payload.start_time = formData.start_time;
      if (formData.end_time) payload.end_time = formData.end_time;
      if (formData.parity) payload.parity = formData.parity;
      if (formData.weekdays) payload.weekdays = formData.weekdays;

      await groupsApi.create(payload);
      toast.success('Guruh muvaffaqiyatli yaratildi!');
      router.push('/groups');
    } catch (err: any) {
      toast.error(err.message || 'Guruhni yaratishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => formData.name.trim() !== '' && formData.teacher_id !== '';

  if (fetching) {
    return (
      <Layout>
        <div className="w-full min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-white">
          <div className="w-full h-full p-6 md:p-8 lg:p-10">
            <div className="max-w-[1000px] mx-auto space-y-6">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-[700px] w-full rounded-2xl" />
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
                <Link href="/groups">
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Guruhlar ro'yxati
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
                      <h1 className="text-2xl font-bold text-white">Yangi guruh yaratish</h1>
                      <p className="text-white/70 text-sm mt-0.5">Guruh ma'lumotlarini to'ldiring va saqlang</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Form card */}
            <Card className="border border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-md rounded-2xl overflow-hidden">
              <form onSubmit={handleSubmit}>
                <CardContent className="p-0">
                  {/* Main info section */}
                  <div className="p-6 md:p-8 space-y-7">
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
                            placeholder="Masalan, Ingliz tili A1"
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
                            onChange={(e) => handlePriceChange(e.target.value)}
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
                            value={formData.kp ? String(formData.kp) : ''}
                            onChange={(e) => setFormData({ ...formData, kp: e.target.value.replace(/\D/g, '') ? Number(e.target.value.replace(/\D/g, '')) : undefined })}
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
                        {/* Main Teacher */}
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

                        {/* Support Teacher */}
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

                    {/* Lesson generation section */}
                    <div className="border-t border-gray-100 pt-7">
                      <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-5">
                        <div className="p-1.5 bg-amber-50 rounded-lg"><Calendar className="h-4 w-4 text-amber-600" /></div>
                        Dars yaratish <span className="text-xs font-normal text-gray-400 ml-1">(ixtiyoriy)</span>
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="start_date" className="text-gray-700 text-sm flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" /> Boshlanish sanasi
                          </Label>
                          <Input
                            id="start_date"
                            type="date"
                            value={formData.start_date || ''}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            className="h-11 text-sm rounded-xl border-gray-300 focus:border-amber-400 focus:ring-amber-400 transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="duration_months" className="text-gray-700 text-sm flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-400" /> Davomiylik (oy)
                          </Label>
                          <Input
                            id="duration_months"
                            type="number"
                            min="1"
                            value={formData.duration_months || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                duration_months: e.target.value ? parseInt(e.target.value) : undefined,
                              })
                            }
                            placeholder="Masalan, 2"
                            className="h-11 text-sm rounded-xl border-gray-300 focus:border-amber-400 focus:ring-amber-400 transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="time" className="text-gray-700 text-sm flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-400" /> Dars vaqti
                          </Label>
                          <Input
                            id="time"
                            type="time"
                            value={formData.time || ''}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            className="h-11 text-sm rounded-xl border-gray-300 focus:border-amber-400 focus:ring-amber-400 transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="start_time" className="text-gray-700 text-sm flex items-center gap-1">
                            <ArrowRight className="h-3.5 w-3.5 text-gray-400" /> Dars boshlanish vaqti
                          </Label>
                          <Input
                            id="start_time"
                            type="time"
                            value={formData.start_time || ''}
                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                            className="h-11 text-sm rounded-xl border-gray-300 focus:border-amber-400 focus:ring-amber-400 transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="end_time" className="text-gray-700 text-sm flex items-center gap-1">
                            <ArrowRight className="h-3.5 w-3.5 text-gray-400" /> Dars tugash vaqti
                          </Label>
                          <Input
                            id="end_time"
                            type="time"
                            value={formData.end_time || ''}
                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                            className="h-11 text-sm rounded-xl border-gray-300 focus:border-amber-400 focus:ring-amber-400 transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="parity" className="text-gray-700 text-sm flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5 text-gray-400" /> Hafta rejimi
                          </Label>
                          <Select
                            value={formData.parity || ''}
                            onValueChange={(value: 'odd' | 'even' | 'everyday') => {
                              setFormData({ ...formData, parity: value, weekdays: value === 'everyday' ? formData.weekdays || 'mon-sat' : undefined });
                            }}
                          >
                            <SelectTrigger className="h-11 text-sm rounded-xl border-gray-300 focus:border-amber-400 focus:ring-amber-400 transition-all">
                              <SelectValue placeholder="Rejimni tanlang" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-200 bg-white shadow-lg">
                              <SelectItem value="odd">Toq kunlar (Dush, Chor, Juma)</SelectItem>
                              <SelectItem value="even">Juft kunlar (Sesh, Pay, Shanba)</SelectItem>
                              <SelectItem value="everyday">Har kuni (davomli)</SelectItem>
                            </SelectContent>
                          </Select>

                          {formData.parity === 'everyday' && (
                            <Select
                              value={formData.weekdays || 'mon-sat'}
                              onValueChange={(value: 'mon-fri' | 'mon-sat') => setFormData({ ...formData, weekdays: value })}
                            >
                              <SelectTrigger className="h-11 text-sm rounded-xl border-gray-300 focus:border-amber-400 focus:ring-amber-400 transition-all">
                                <SelectValue placeholder="Ish kunlarini tanlang" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-gray-200 bg-white shadow-lg">
                                <SelectItem value="mon-fri">Dushanbadan Jumagacha</SelectItem>
                                <SelectItem value="mon-sat">Dushanbadan Shanbagacha</SelectItem>
                              </SelectContent>
                            </Select>
                          )}

                          <p className="text-xs text-gray-400 mt-1">
                            Agar kiritilsa, darslar avtomatik ravishda yaratiladi.
                          </p>
                        </div>
                      </div>
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
                        onClick={() => router.push('/groups')}
                        disabled={loading}
                        className="h-11 px-5 text-sm rounded-xl border-gray-300 hover:bg-gray-100 transition-all"
                      >
                        Bekor qilish
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading || !isFormValid()}
                        className="h-11 px-6 text-sm rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {loading ? (
                          <><span className="animate-spin mr-2">⏳</span> Yaratilmoqda...</>
                        ) : (
                          <><Save className="h-4 w-4 mr-2" /> Guruh yaratish</>
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
