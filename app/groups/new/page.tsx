'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AlertCircle, ArrowLeft, Save, DoorOpen, Check, ChevronsUpDown } from 'lucide-react';
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

  const selectedRoom = rooms.find(r => r.id === formData.room_id);

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
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

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

    if (formData.monthly_price && isNaN(Number(formData.monthly_price))) {
      toast.error('To\'lov noto\'g\'ri formatda');
      return;
    }

    try {
      setLoading(true);

      const payload: any = {
        name: formData.name,
        teacher_id: Number(formData.teacher_id),
      };

      if (formData.support_teacher_id) {
        payload.support_teacher_id = Number(formData.support_teacher_id);
      }

      if (formData.room_id) {
        payload.room_id = Number(formData.room_id);
      }
      if (formData.monthly_price) {
        payload.monthly_price = formData.monthly_price;
      }
      if (formData.kp) {
        payload.kp = formData.kp;
      }
      if (formData.start_date) {
        payload.start_date = formData.start_date;
      }
      if (formData.duration_months) {
        payload.duration_months = formData.duration_months;
      }
      if (formData.time) {
        payload.time = formData.time;
      }
      if (formData.start_time) {
        payload.start_time = formData.start_time;
      }
      if (formData.end_time) {
        payload.end_time = formData.end_time;
      }
      if (formData.parity) {
        payload.parity = formData.parity;
      }

      await groupsApi.create(payload);
      toast.success('Guruh muvaffaqiyatli yaratildi!');
      router.push('/groups');
    } catch (err: any) {
      toast.error(err.message || 'Guruhni yaratishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.teacher_id !== ''
    );
  };

  if (fetching) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-400 border-t-transparent"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">O'qituvchilar yuklanmoqda...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 px-4 md:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hover:bg-accent text-muted-foreground hover:text-primary transition-all duration-300"
          >
            <Link href="/groups">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Guruhlarga qaytish
            </Link>
          </Button>
        </div>

        <Card className="border-gray-200 bg-white shadow-lg overflow-hidden rounded-xl">
          <CardHeader className="bg-gray-50/50 border-b border-gray-200 px-6 py-5">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg transition-all duration-300 hover:scale-110">
                <Save className="h-5 w-5 text-primary" />
              </div>
              Yangi guruh yaratish
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Yangi o'quv guruhi qo'shing. Quyidagi ma'lumotlarni to'ldiring.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-900 font-medium">
                  Guruh nomi <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masalan, Ingliz tili A1"
                  required
                  className="transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-900 font-medium">
                  Asosiy o'qituvchi <span className="text-destructive">*</span>
                </Label>
                <Popover open={mainTeacherOpen} onOpenChange={setMainTeacherOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={mainTeacherOpen}
                      className="w-full justify-between"
                    >
                      {formData.teacher_id
                        ? mainTeachers.find(t => t.id.toString() === formData.teacher_id)
                          ? `${mainTeachers.find(t => t.id.toString() === formData.teacher_id)!.first_name} ${mainTeachers.find(t => t.id.toString() === formData.teacher_id)!.last_name}`
                          : "Asosiy o'qituvchini tanlang"
                        : "Asosiy o'qituvchini tanlang"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput
                        placeholder="O'qituvchi qidirish..."
                        value={mainTeacherSearch}
                        onValueChange={setMainTeacherSearch}
                      />
                      <CommandList>
                        <CommandEmpty>O'qituvchi topilmadi</CommandEmpty>
                        <CommandGroup className="max-h-48 overflow-y-auto">
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
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.teacher_id === teacher.id.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {teacher.first_name} {teacher.last_name}
                                <span className="ml-2 text-xs text-gray-400">{teacher.gmail}</span>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-900 font-medium">
                  Yordamchi o'qituvchi
                </Label>
                <Popover open={supportTeacherOpen} onOpenChange={setSupportTeacherOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={supportTeacherOpen}
                      className="w-full justify-between"
                    >
                      {formData.support_teacher_id
                        ? supportTeachers.find(t => t.id.toString() === formData.support_teacher_id)
                          ? `${supportTeachers.find(t => t.id.toString() === formData.support_teacher_id)!.first_name} ${supportTeachers.find(t => t.id.toString() === formData.support_teacher_id)!.last_name}`
                          : "Yordamchi o'qituvchini tanlang"
                        : "Yordamchi o'qituvchini tanlang (ixtiyoriy)"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput
                        placeholder="O'qituvchi qidirish..."
                        value={supportTeacherSearch}
                        onValueChange={setSupportTeacherSearch}
                      />
                      <CommandList>
                        <CommandEmpty>O'qituvchi topilmadi</CommandEmpty>
                        <CommandGroup className="max-h-48 overflow-y-auto">
                          <CommandItem
                            onSelect={() => {
                              setFormData({ ...formData, support_teacher_id: '' });
                              setSupportTeacherOpen(false);
                              setSupportTeacherSearch('');
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", !formData.support_teacher_id ? "opacity-100" : "opacity-0")} />
                            Yo'q
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
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.support_teacher_id === teacher.id.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {teacher.first_name} {teacher.last_name}
                                <span className="ml-2 text-xs text-gray-400">{teacher.gmail}</span>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="room_id" className="text-gray-900 font-medium">
                  Xona
                </Label>
                <Select
                  value={formData.room_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, room_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger className="transition-all duration-300">
                    <SelectValue placeholder="Xonani tanlang (ixtiyoriy)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Xonasiz</SelectItem>
                    {rooms.length === 0 ? (
                      <SelectItem value="no-room" disabled>
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
                  <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <DoorOpen className="h-4 w-4 text-primary" />
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-gray-900">{selectedRoom.name}</span>
                      <span className="mx-2">&middot;</span>
                      Sig'imi: <span className="font-medium text-gray-900">{selectedRoom.capacity}</span>
                      <span className="mx-2">&middot;</span>
                      Band: <span className="font-medium text-amber-600 dark:text-amber-400">{selectedRoom.occupied_seats}</span>
                      <span className="mx-2">&middot;</span>
                      Bo'sh: <span className="font-medium text-green-600 dark:text-green-400">{selectedRoom.capacity - selectedRoom.occupied_seats}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_price" className="text-gray-900 font-medium">
                  Oylik to'lov narxi
                </Label>
                <Input
                  id="monthly_price"
                  type="number"
                  min="0"
                  value={formData.monthly_price || ''}
                  onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Masalan, 200000"
                  className="transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kp" className="text-gray-900 font-medium">
                  O'quvchi narxi (so'm)
                </Label>
                <Input
                  id="kp"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.kp || ''}
                  onChange={(e) => setFormData({ ...formData, kp: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Masalan, 150000"
                  className="transition-all duration-300"
                />
                <p className="text-xs text-gray-500">Har bir o'quvchidan olinadigan oylik summa</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 md:col-span-3 -mb-2">
                  Dars yaratish (ixtiyoriy)
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-muted-foreground">Boshlanish sanasi</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date || ''}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_months" className="text-muted-foreground">Davomiylik (oy)</Label>
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
                    className="transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="text-muted-foreground">Dars vaqti</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time || ''}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_time" className="text-muted-foreground">Dars boshlanish vaqti</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time || ''}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time" className="text-muted-foreground">Dars tugash vaqti</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time || ''}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parity" className="text-muted-foreground">Hafta juftligi</Label>
                  <Select
                    value={formData.parity || ''}
                    onValueChange={(value: 'odd' | 'even' | 'both') => setFormData({ ...formData, parity: value })}
                  >
                    <SelectTrigger className="transition-all duration-300">
                      <SelectValue placeholder="Juftlikni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="odd">Toq haftalar</SelectItem>
                      <SelectItem value="even">Juft haftalar</SelectItem>
                      <SelectItem value="both">Har kuni (Dush-Shanba)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Agar kiritilsa, darslar avtomatik ravishda yaratiladi.
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50/50 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/groups')}
                disabled={loading}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={loading || !isFormValid()}
                className="min-w-[120px] shadow-md hover:shadow-lg font-semibold"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Yaratilmoqda...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guruh yaratish
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
