'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft, Save, Plus, Trash2, DoorOpen } from 'lucide-react';
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

  const selectedRoom = rooms.find(r => r.id === formData.room_id);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [groupData, teachersRes, roomsRes] = await Promise.all([
          groupsApi.getById(groupId),
          teachersApi.getAll(),
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
    } catch (err: any) {
      toast.error("Darslarni yuklashda xatolik");
      console.error('Failed to fetch lessons:', err);
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
      delete payload.room_id;

      if (formData.room_id) {
        payload.room_id = Number(formData.room_id);
      }

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
        <div className="space-y-6 py-6 px-4 md:px-6 lg:px-8 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!group) {
    return (
      <Layout>
        <div className="space-y-6 py-6 px-4 md:px-6 lg:px-8 max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" asChild className="hover:bg-accent text-muted-foreground hover:text-primary transition-all duration-300">
              <Link href="/groups">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Guruhlarga qaytish
              </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 px-4 md:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="hover:bg-accent text-muted-foreground hover:text-primary transition-all duration-300">
              <Link href={`/groups/${groupId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Guruh tafsilotlariga qaytish
              </Link>
          </Button>
        </div>

        <Card className="border-gray-200 bg-white shadow-lg overflow-hidden rounded-xl">
          <CardHeader className="bg-gray-50/50 border-b border-gray-200 px-6 py-5">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg transition-all duration-300 hover:scale-110">
                <Save className="h-5 w-5 text-primary" />
              </div>
              Guruhni tahrirlash: {group?.name}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Guruh ma'lumotlarini yangilang va darslarni boshqaring.
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
                        <SelectItem key={teacher.id} value={String(teacher.id)}>
                          {teacher.first_name} {teacher.last_name} ({teacher.gmail})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="support_teacher_id" className="text-gray-900 font-medium">
                  Yordamchi o'qituvchi
                </Label>
                <Select
                  value={formData.support_teacher_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, support_teacher_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger className="transition-all duration-300">
                    <SelectValue placeholder="Yordamchi o'qituvchini tanlang (ixtiyoriy)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Yo'q</SelectItem>
                    {supportTeachers.length === 0 ? (
                      <SelectItem value="no-support" disabled>
                        Yordamchi o'qituvchilar mavjud emas
                      </SelectItem>
                    ) : (
                      supportTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={String(teacher.id)}>
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
                  value={formData.kp ?? ''}
                  onChange={(e) => setFormData({ ...formData, kp: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Masalan, 150000"
                  className="transition-all duration-300"
                />
                <p className="text-xs text-gray-500">Har bir o'quvchidan olinadigan oylik summa</p>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Darslar</h3>
                  <Button
                    type="button"
                    onClick={() => {
                      resetLessonForm();
                      setLessonFormOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Dars qo'shish
                  </Button>
                </div>

                {lessonFormOpen && (
                  <Card className="mb-6 border-gray-200 bg-gray-50/30">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base text-gray-900">Yangi dars</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <form onSubmit={handleLessonSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="lesson-date" className="text-muted-foreground">Sana *</Label>
                            <Input
                              id="lesson-date"
                              type="date"
                              value={lessonFormData.date}
                              onChange={(e) => setLessonFormData({ ...lessonFormData, date: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lesson-time" className="text-muted-foreground">Vaqt *</Label>
                            <Input
                              id="lesson-time"
                              type="time"
                              value={lessonFormData.time}
                              onChange={(e) => setLessonFormData({ ...lessonFormData, time: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lesson-parity" className="text-muted-foreground">Juftlik</Label>
                            <Select
                              value={lessonFormData.parity || ''}
                              onValueChange={(value: 'odd' | 'even') => setLessonFormData({ ...lessonFormData, parity: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Juftlikni tanlang" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="odd">Toq haftalar</SelectItem>
                                <SelectItem value="even">Juft haftalar</SelectItem>
                              </SelectContent>
                            </Select>
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
                          >
                            Bekor qilish
                          </Button>
                          <Button type="submit">
                            Dars yaratish
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <Collapsible open={lessonsOpen} onOpenChange={setLessonsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full flex justify-between text-gray-900 hover:bg-accent transition-all duration-300">
                      <span>{lessons.length} ta dars</span>
                      <span>{lessonsOpen ? 'Yashirish' : 'Ko\'rsatish'}</span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {lessonsLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <Skeleton className="h-12 w-full rounded-lg" />
                      </div>
                    ) : lessons.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-4">Hali darslar yo'q.</p>
                    ) : (
                      lessons.map((lesson) => {
                        const lessonDate = new Date(lesson.date);
                        const formattedDate = lessonDate.toLocaleDateString('en-CA');
                        return (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between p-3 bg-gray-50/30 border border-gray-200 rounded-lg transition-all duration-300 hover:shadow-md"
                          >
                            <div>
                              <div className="font-medium text-gray-900">
                                {formattedDate} soat {lesson.time.slice(0,5)}
                                {lesson.parity && (
                                  <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                    {lesson.parity === 'odd' ? 'Toq' : 'Juft'} hafta
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive/80 transition-all duration-300"
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
            </CardContent>

            <CardFooter className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50/50 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/groups/${groupId}`)}
                disabled={submitting}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={submitting || !formData.name || !formData.teacher_id}
                className="min-w-[120px] shadow-md hover:shadow-lg font-semibold"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Yangilanmoqda...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guruhni yangilash
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
