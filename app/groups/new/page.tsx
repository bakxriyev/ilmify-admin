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
import { AlertCircle, ArrowLeft, Save, DoorOpen } from 'lucide-react';
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

  const selectedRoom = rooms.find(r => r.id === formData.room_id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);
        const [teachersRes, roomsRes] = await Promise.all([
          teachersApi.getAll(),
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
    if (!formData.support_teacher_id) {
      toast.error('Iltimos, yordamchi o\'qituvchini tanlang');
      return;
    }

    try {
      setLoading(true);

      const payload: any = {
        name: formData.name,
        teacher_id: Number(formData.teacher_id),
        support_teacher_id: Number(formData.support_teacher_id),
      };

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
      formData.teacher_id !== '' &&
      formData.support_teacher_id !== ''
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
                <Label htmlFor="teacher_id" className="text-gray-900 font-medium">
                  Asosiy o'qituvchi <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.teacher_id}
                  onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                >
                  <SelectTrigger className="transition-all duration-300">
                    <SelectValue placeholder="Asosiy o'qituvchini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainTeachers.length === 0 ? (
                      <SelectItem value="no-main" disabled>
                        Asosiy o'qituvchilar mavjud emas
                      </SelectItem>
                    ) : (
                      mainTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.first_name} {teacher.last_name} ({teacher.gmail})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="support_teacher_id" className="text-gray-900 font-medium">
                  Yordamchi o'qituvchi <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.support_teacher_id}
                  onValueChange={(value) => setFormData({ ...formData, support_teacher_id: value })}
                >
                  <SelectTrigger className="transition-all duration-300">
                    <SelectValue placeholder="Yordamchi o'qituvchini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportTeachers.length === 0 ? (
                      <SelectItem value="no-support" disabled>
                        Yordamchi o'qituvchilar mavjud emas
                      </SelectItem>
                    ) : (
                      supportTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.first_name} {teacher.last_name} ({teacher.gmail})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
                    onValueChange={(value: 'odd' | 'even') => setFormData({ ...formData, parity: value })}
                  >
                    <SelectTrigger className="transition-all duration-300">
                      <SelectValue placeholder="Juftlikni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="odd">Toq haftalar</SelectItem>
                      <SelectItem value="even">Juft haftalar</SelectItem>
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
