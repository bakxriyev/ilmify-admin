'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { paymentsApi, type Payment, type PaymentStats } from '@/api/paymentsApi';
import { groupsApi, type Group } from '@/api/groupsApi';
import { studentsApi, type Student } from '@/api/studentApi';
import {
  Wallet, DollarSign, CheckCircle, XCircle, Clock, Plus,
  Search, RefreshCw, ChevronRight, Filter, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ student_id: '', group_id: '', amount: '', month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()), note: '' });
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [p, s, g] = await Promise.all([
        paymentsApi.getAll({ month: Number(filterMonth), year: Number(filterYear) }),
        paymentsApi.getStats(),
        groupsApi.getAll({ limit: 100 }),
      ]);
      setPayments(p);
      setStats(s);
      setGroups(g.data);
    } catch { toast.error("Ma'lumotlarni yuklashda xatolik"); }
    finally { setLoading(false); }
  };

  const applyFilter = async () => {
    try {
      setLoading(true);
      const p = await paymentsApi.getAll({
        group_id: filterGroup ? Number(filterGroup) : undefined,
        status: filterStatus || undefined,
        month: Number(filterMonth),
        year: Number(filterYear),
      });
      setPayments(p);
    } catch { toast.error('Xatolik'); }
    finally { setLoading(false); }
  };

  const openCreateModal = async () => {
    try {
      const s = await studentsApi.getAll({ limit: 500 });
      setStudents(s.data);
      setShowCreateModal(true);
    } catch { toast.error("Studentlarni yuklashda xatolik"); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.student_id || !createForm.group_id || !createForm.amount) {
      toast.error('Barcha maydonlarni to\'ldiring');
      return;
    }
    try {
      await paymentsApi.create({
        student_id: Number(createForm.student_id),
        group_id: Number(createForm.group_id),
        amount: Number(createForm.amount),
        month: Number(createForm.month),
        year: Number(createForm.year),
        note: createForm.note || undefined,
      });
      toast.success("To'lov qo'shildi");
      setShowCreateModal(false);
      setCreateForm({ student_id: '', group_id: '', amount: '', month: filterMonth, year: filterYear, note: '' });
      loadData();
    } catch (err: any) { toast.error(err.message || 'Xatolik'); }
  };

  const handleMarkPaid = async (payment: Payment) => {
    try {
      await paymentsApi.update(payment.id, { status: 'paid' });
      toast.success("To'lov tasdiqlandi");
      loadData();
    } catch { toast.error('Xatolik'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("To'lovni o'chirasizmi?")) return;
    try {
      await paymentsApi.remove(id);
      toast.success("To'lov o'chirildi");
      loadData();
    } catch { toast.error('Xatolik'); }
  };

  const statusBadge = (status: string) => {
    const map: any = {
      paid: { label: "To'langan", class: 'bg-green-100 text-green-700 border-green-200' },
      unpaid: { label: "To'lanmagan", class: 'bg-red-100 text-red-700 border-red-200' },
      partial: { label: 'Qisman', class: 'bg-amber-100 text-amber-700 border-amber-200' },
    };
    const s = map[status] || map.unpaid;
    return <Badge className={s.class}>{s.label}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6 p-6 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="h-6 w-6 text-green-600" /> To'lovlar
            </h1>
            <p className="text-gray-500">Barcha to'lovlarni boshqaring</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData} className="border-gray-300">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Yangilash
            </Button>
            <Button onClick={openCreateModal} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Yangi to'lov
            </Button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-lg"><Wallet className="h-5 w-5 text-blue-600" /></div>
                <div><p className="text-xs text-gray-500">Jami</p><p className="text-lg font-bold text-gray-900">{stats.total}</p></div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-green-50 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
                <div><p className="text-xs text-gray-500">To'langan</p><p className="text-lg font-bold text-green-600">{stats.paid}</p></div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-red-50 rounded-lg"><XCircle className="h-5 w-5 text-red-600" /></div>
                <div><p className="text-xs text-gray-500">To'lanmagan</p><p className="text-lg font-bold text-red-600">{stats.unpaid}</p></div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 rounded-lg"><Clock className="h-5 w-5 text-amber-600" /></div>
                <div><p className="text-xs text-gray-500">Qisman</p><p className="text-lg font-bold text-amber-600">{stats.partial}</p></div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 rounded-lg"><DollarSign className="h-5 w-5 text-purple-600" /></div>
                <div><p className="text-xs text-gray-500">Summa</p><p className="text-lg font-bold text-purple-600">{stats.total_amount.toLocaleString()} so'm</p></div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-gray-800 flex items-center gap-2"><Filter className="h-4 w-4" /> Filtrlar</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <SelectItem key={m} value={String(m)}>{m}-oy</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2024,2025,2026].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterGroup} onValueChange={setFilterGroup}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Guruh" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha guruhlar</SelectItem>
                    {groups.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Holat" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha holatlar</SelectItem>
                    <SelectItem value="paid">To'langan</SelectItem>
                    <SelectItem value="unpaid">To'lanmagan</SelectItem>
                    <SelectItem value="partial">Qisman</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={applyFilter}><Search className="h-4 w-4 mr-1" /> Qidirish</Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Wallet className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>To'lovlar mavjud emas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-gray-600 font-medium">Student</th>
                      <th className="text-left p-3 text-gray-600 font-medium">Guruh</th>
                      <th className="text-left p-3 text-gray-600 font-medium">Oy</th>
                      <th className="text-right p-3 text-gray-600 font-medium">Summa</th>
                      <th className="text-center p-3 text-gray-600 font-medium">Holat</th>
                      <th className="text-center p-3 text-gray-600 font-medium">Sanasi</th>
                      <th className="text-right p-3 text-gray-600 font-medium">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">
                          <Link href={`/payments/students/${p.student_id}`} className="font-medium text-gray-900 hover:text-blue-600">
                            {p.student?.first_name} {p.student?.last_name}
                          </Link>
                        </td>
                        <td className="p-3 text-gray-600">
                          <Link href={`/payments/groups/${p.group_id}`} className="hover:text-blue-600">
                            {p.group?.name}
                          </Link>
                        </td>
                        <td className="p-3 text-gray-600">{p.month}-oy / {p.year}</td>
                        <td className="p-3 text-right font-medium text-gray-900">{p.amount.toLocaleString()} so'm</td>
                        <td className="p-3 text-center">{statusBadge(p.status)}</td>
                        <td className="p-3 text-center text-gray-500">{p.paid_at || '-'}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            {p.status !== 'paid' && (
                              <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(p)} className="text-green-600 h-8 w-8 p-0" title="To'langan deb belgilash">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/payments/students/${p.student_id}`)} className="text-blue-600 h-8 w-8 p-0" title="Batafsil">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-red-600 h-8 w-8 p-0" title="O'chirish">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="bg-white max-w-lg">
            <DialogHeader>
              <DialogTitle>Yangi to'lov qo'shish</DialogTitle>
              <DialogDescription>To'lov ma'lumotlarini kiriting</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <Select value={createForm.student_id} onValueChange={v => setCreateForm({ ...createForm, student_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Studentni tanlang" /></SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.first_name} {s.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Guruh</Label>
                <Select value={createForm.group_id} onValueChange={v => {
                  const g = groups.find(gr => gr.id === v);
                  setCreateForm({ ...createForm, group_id: v, amount: g?.monthly_price ? String(g.monthly_price) : '' });
                }}>
                  <SelectTrigger><SelectValue placeholder="Guruhni tanlang" /></SelectTrigger>
                  <SelectContent>
                    {groups.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name} - {g.monthly_price ? `${g.monthly_price.toLocaleString()} so'm` : 'Narx yo\'q'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Summa</Label>
                  <Input type="number" value={createForm.amount} onChange={e => setCreateForm({ ...createForm, amount: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Oy</Label>
                  <Input type="number" min={1} max={12} value={createForm.month} onChange={e => setCreateForm({ ...createForm, month: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Yil</Label>
                  <Input type="number" value={createForm.year} onChange={e => setCreateForm({ ...createForm, year: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Izoh</Label>
                <Input value={createForm.note} onChange={e => setCreateForm({ ...createForm, note: e.target.value })} placeholder="To'lov haqida izoh" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Bekor qilish</Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Saqlash</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
