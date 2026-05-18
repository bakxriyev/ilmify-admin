'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { groupStudentsApi, type GroupStudent } from '@/api/groupStudentApi';
import {
  Sparkles, Users, Phone, RefreshCw, CheckCircle, XCircle, Loader2, GraduationCap, Calendar, Search, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TrialPage() {
  const router = useRouter();
  const [allTrialStudents, setAllTrialStudents] = useState<GroupStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [groupFilter, setGroupFilter] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await groupStudentsApi.getAllTrial();
      setAllTrialStudents(data);
    } catch { toast.error('Xatolik'); }
    finally { setLoading(false); }
  };

  const filteredStudents = useMemo(() => {
    if (!groupFilter) return allTrialStudents;
    const q = groupFilter.toLowerCase();
    return allTrialStudents.filter(ts =>
      ts.student?.first_name?.toLowerCase().includes(q) ||
      ts.student?.last_name?.toLowerCase().includes(q) ||
      ts.student?.phone_number?.includes(q) ||
      ts.group?.name?.toLowerCase().includes(q)
    );
  }, [allTrialStudents, groupFilter]);

  const handleConfirm = async () => {
    if (!confirmId) return;
    setConfirmLoading(true);
    try {
      await groupStudentsApi.confirmTrial(confirmId);
      toast.success('Student to\'liq a\'zoga aylandi');
      setConfirmId(null);
      loadData();
    } catch { toast.error('Xatolik'); }
    finally { setConfirmLoading(false); }
  };

  const handleRemove = async (id: number) => {
    if (!confirm('Bu studentni probniy darsdan olib tashlaysizmi?')) return;
    try {
      await groupStudentsApi.delete(id);
      toast.success('Student probniy darsdan olib tashlandi');
      loadData();
    } catch { toast.error('Xatolik'); }
  };

  const totalCount = allTrialStudents.length;
  const filteredCount = filteredStudents.length;

  return (
    <Layout>
      <div className="space-y-6 p-6 w-full">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-orange-500" /> Probniy darslar
            </h1>
            <p className="text-gray-500">Probniy darsga yozilgan studentlar ro'yxati</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/leads')} className="text-blue-600 border-blue-300">
              <Users className="h-4 w-4 mr-2" /> Leadlar
            </Button>
            <Button variant="outline" onClick={loadData}><RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Yangilash</Button>
          </div>
        </div>

        {/* Stats & Filter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-orange-600">{totalCount}</p>
              <p className="text-[10px] text-gray-500">Jami probniy</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-green-600">{filteredCount}</p>
              <p className="text-[10px] text-gray-500">Filtir bo'yicha</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-[10px]">Qidirish</Label>
                <Input
                  placeholder="Ism, familiya, telefon, guruh..."
                  value={groupFilter}
                  onChange={e => setGroupFilter(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              {groupFilter && (
                <Button size="sm" variant="ghost" onClick={() => setGroupFilter('')} className="h-8 text-sm text-gray-500">
                  <X className="h-3.5 w-3.5 mr-1" /> Tozalash
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Sparkles className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-lg font-medium">Probniy darsga yozilgan studentlar yo'q</p>
                <p className="text-sm mt-1">Leadlar bo'limidan probniy darsga yozishingiz mumkin</p>
                <Button onClick={() => router.push('/leads')} className="mt-4 bg-orange-600 text-white hover:bg-orange-700">
                  <Users className="h-4 w-4 mr-2" /> Leadlar bo'limiga o'tish
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Guruh</TableHead>
                      <TableHead>Daraja</TableHead>
                      <TableHead>Qo'shilgan sana</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((ts, idx) => (
                      <TableRow key={ts.id} className="hover:bg-orange-50/50">
                        <TableCell className="text-gray-400">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                              <GraduationCap className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <p>{ts.student?.first_name} {ts.student?.last_name}</p>
                              {ts.student?.email && <p className="text-xs text-gray-400">{ts.student.email}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <a href={`tel:${ts.student?.phone_number}`} className="text-blue-600 hover:underline flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {ts.student?.phone_number}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {ts.group?.name || 'Nomalum'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {ts.group?.level?.title || ts.group?.level?.name || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(ts.joined_date).toLocaleDateString('uz-UZ')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => setConfirmId(ts.id)}
                              className="text-green-600 h-8 px-2"
                              title="Guruhga qo'shish"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Guruhga qo'shish
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => handleRemove(ts.id)}
                              className="text-red-600 h-8 px-2"
                              title="Olib tashlash"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!confirmId} onOpenChange={v => !v && setConfirmId(null)}>
          <DialogContent className="bg-white max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5 text-green-500" /> Studentni guruhga qo'shish
              </DialogTitle>
              <DialogDescription>
                Probniy darsdagi studentni to'liq a'zo sifatida guruhga qo'shmoqchimisiz?
                <br />
                <span className="font-medium text-gray-700 mt-2 block">
                  Student endi to'liq o'quvchi hisoblanadi va band o'rinlar hisobiga qo'shiladi.
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmId(null)}>Bekor qilish</Button>
              <Button onClick={handleConfirm} disabled={confirmLoading} className="bg-green-600 text-white hover:bg-green-700">
                {confirmLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Yuklanmoqda...</> : 'Ha, qo\'shish'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
