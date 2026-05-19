'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { paymentsApi, type GroupPaymentSummary, type PaymentStats } from '@/api/paymentsApi';
import { groupsApi, type Group } from '@/api/groupsApi';
import { studentsApi, type Student } from '@/api/studentApi';
import {
  Wallet, DollarSign, CheckCircle, XCircle, Clock, Plus, Search,
  RefreshCw, ChevronRight, Filter, AlertCircle, Users, CalendarDays, CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const router = useRouter();
  const [items, setItems] = useState<GroupPaymentSummary[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ student_id: '', group_id: '', amount: '', month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()), note: '' });
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Year overview for monthly grid
  const [yearOverview, setYearOverview] = useState<{ month: number; total: number; paid: number; unpaid: number; partial: number }[]>([]);
  const [yearOverviewLoading, setYearOverviewLoading] = useState(false);

  const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

  const loadData = async () => {
    try {
      setLoading(true);
      const [overview, s, g] = await Promise.all([
        paymentsApi.getStudentsOverview(Number(filterMonth), Number(filterYear)),
        paymentsApi.getStats(),
        groupsApi.getAll({ limit: 100 }),
      ]);
      setItems(overview);
      setStats(s);
      setGroups(g.data);
    } catch { toast.error("Ma'lumotlarni yuklashda xatolik"); }
    finally { setLoading(false); }
  };

  const loadYearOverview = async () => {
    try {
      setYearOverviewLoading(true);
      const data = await paymentsApi.getYearOverview(Number(filterYear));
      setYearOverview(data);
    } catch {} finally { setYearOverviewLoading(false); }
  };

  useEffect(() => { loadData(); }, [filterMonth, filterYear]);
  useEffect(() => { loadYearOverview(); }, [filterYear]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filterGroup !== 'all' && String(item.group?.id) !== filterGroup) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      return true;
    });
  }, [items, filterGroup, filterStatus]);

  const paidCount = items.filter(i => i.status === 'paid').length;
  const unpaidCount = items.filter(i => i.status === 'unpaid').length;
  const partialCount = items.filter(i => i.status === 'partial').length;
  const totalExpectedAmount = items.reduce((sum, i) => sum + i.monthly_price, 0);
  const totalPaidAmount = items.reduce((sum, i) => sum + i.paid_amount, 0);
  const totalDebt = items.reduce((sum, i) => sum + i.debt, 0);

  const openCreateModal = async () => {
    try {
      const s = await studentsApi.getAll({ limit: 500 });
      setStudents(s.data);
      setStudentSearch('');
      setCreateForm({ student_id: '', group_id: '', amount: '', month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()), note: '' });
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
      loadYearOverview();
    } catch (err: any) { toast.error(err.message || 'Xatolik'); }
  };

  const handleMarkPaid = async (item: GroupPaymentSummary) => {
    try {
      if (item.payment) {
        await paymentsApi.update(item.payment.id, { status: 'paid' });
        toast.success("To'lov tasdiqlandi");
      } else {
        await paymentsApi.create({
          student_id: item.student.id,
          group_id: item.group?.id || 0,
          amount: item.monthly_price,
          month: Number(filterMonth),
          year: Number(filterYear),
          status: 'paid',
        });
        toast.success("To'lov qo'shildi");
      }
      loadData();
      loadYearOverview();
    } catch { toast.error('Xatolik'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("To'lovni o'chirasizmi?")) return;
    try {
      await paymentsApi.remove(id);
      toast.success("To'lov o'chirildi");
      loadData();
      loadYearOverview();
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

  const formatSum = (n: number) => Math.floor(n).toLocaleString();

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return d; }
  };

  return (
    <Layout>
      <div className="space-y-6 p-6 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="h-6 w-6 text-green-600" /> To'lovlar
            </h1>
            <p className="text-gray-500">{monthNames[Number(filterMonth) - 1]} {filterYear} — oyi uchun to'lov holati</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { loadData(); loadYearOverview(); }} className="border-gray-300">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Yangilash
            </Button>
            <Button onClick={openCreateModal} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Yangi to'lov
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-lg"><Users className="h-5 w-5 text-blue-600" /></div>
              <div><p className="text-xs text-gray-500">Studentlar</p><p className="text-lg font-bold text-gray-900">{items.length}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 rounded-lg"><CreditCard className="h-5 w-5 text-indigo-600" /></div>
              <div><p className="text-xs text-gray-500">Kutilgan summa</p><p className="text-lg font-bold text-indigo-600">{formatSum(totalExpectedAmount)} so'm</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-green-50 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div><p className="text-xs text-gray-500">To'langan</p><p className="text-lg font-bold text-green-600">{paidCount}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-red-50 rounded-lg"><XCircle className="h-5 w-5 text-red-600" /></div>
              <div><p className="text-xs text-gray-500">To'lanmagan</p><p className="text-lg font-bold text-red-600">{unpaidCount}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-lg"><Clock className="h-5 w-5 text-amber-600" /></div>
              <div><p className="text-xs text-gray-500">Qisman</p><p className="text-lg font-bold text-amber-600">{partialCount}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-lg"><DollarSign className="h-5 w-5 text-emerald-600" /></div>
              <div><p className="text-xs text-gray-500">Jami to'lov</p><p className="text-lg font-bold text-emerald-600">{formatSum(totalPaidAmount)} so'm</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-red-50 rounded-lg"><AlertCircle className="h-5 w-5 text-red-600" /></div>
              <div><p className="text-xs text-gray-500">Jami qarzdorlik</p><p className="text-lg font-bold text-red-600">{formatSum(totalDebt)} so'm</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Overview Grid */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-800 text-base">{filterYear} yil oylik to'lov holati</CardTitle>
          </CardHeader>
          <CardContent>
            {yearOverviewLoading ? (
              <div className="flex gap-2">
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
                {yearOverview.map((m) => {
                  const isCurrentMonth = m.month === new Date().getMonth() + 1 && Number(filterYear) === new Date().getFullYear();
                  let bgColor = 'bg-gray-100';
                  let textColor = 'text-gray-600';
                  let label = "Ma'lumot yo'q";
                  if (m.total > 0) {
                    if (m.unpaid === 0 && m.partial === 0) {
                      bgColor = 'bg-green-100 border-green-300';
                      textColor = 'text-green-700';
                      label = "To'langan";
                    } else if (m.paid === 0 && m.partial === 0) {
                      bgColor = 'bg-red-100 border-red-300';
                      textColor = 'text-red-700';
                      label = "To'lanmagan";
                    } else {
                      bgColor = 'bg-amber-100 border-amber-300';
                      textColor = 'text-amber-700';
                      label = 'Qisman';
                    }
                  }
                  return (
                    <div
                      key={m.month}
                      className={`rounded-lg border p-2 text-center ${bgColor} ${textColor} ${isCurrentMonth ? 'ring-2 ring-blue-400' : ''}`}
                      title={`${monthNames[m.month - 1]}: ${m.paid} to'langan, ${m.unpaid} to'lanmagan, ${m.partial} qisman (jami ${m.total} student)`}
                    >
                      <p className="text-xs font-semibold">{monthNames[m.month - 1].slice(0, 3)}</p>
                      <p className="text-lg font-bold">{m.total > 0 ? `${m.paid}/${m.total}` : '-'}</p>
                      <p className="text-[10px] opacity-75">{label}</p>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" /> To'langan</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" /> To'lanmagan</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block" /> Qisman</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-300 inline-block" /> Student yo'q</span>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-gray-800 flex items-center gap-2"><Filter className="h-4 w-4" /> Filtrlar</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Select value={filterMonth} onValueChange={v => setFilterMonth(v)}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {monthNames.map((name, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterYear} onValueChange={v => setFilterYear(v)}>
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
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Students Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Wallet className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>{filterMonth && filterYear ? `${monthNames[Number(filterMonth) - 1]} ${filterYear} oyida studentlar mavjud emas` : 'Studentlar mavjud emas'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-gray-600 font-medium">Student</th>
                      <th className="text-left p-3 text-gray-600 font-medium">Guruh</th>
                      <th className="text-right p-3 text-gray-600 font-medium">Summa</th>
                      <th className="text-right p-3 text-gray-600 font-medium">To'lagan</th>
                      <th className="text-right p-3 text-gray-600 font-medium">Qarzdorlik</th>
                      <th className="text-center p-3 text-gray-600 font-medium">Holat</th>
                      <th className="text-center p-3 text-gray-600 font-medium">To'lov sanasi</th>
                      <th className="text-center p-3 text-gray-600 font-medium">Kechikish</th>
                      <th className="text-right p-3 text-gray-600 font-medium">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, idx) => (
                      <tr key={`${item.student.id}-${item.group?.id || idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">
                          <Link href={`/students/${item.student.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                            {item.student.first_name} {item.student.last_name}
                          </Link>
                          <div className="text-xs text-gray-400">{item.student.phone_number}</div>
                        </td>
                        <td className="p-3 text-gray-600">
                          <Link href={`/groups/${item.group?.id}`} className="hover:text-blue-600">
                            {item.group?.name || '-'}
                          </Link>
                        </td>
                        <td className="p-3 text-right font-medium text-gray-900">{formatSum(item.monthly_price)} so'm</td>
                        <td className="p-3 text-right text-gray-700">
                          {item.status === 'paid'
                            ? <span className="text-green-600 font-medium">{formatSum(item.paid_amount)} so'm</span>
                            : item.status === 'partial'
                              ? <span className="text-amber-600 font-medium">{formatSum(item.paid_amount)} so'm</span>
                              : <span className="text-gray-400">0 so'm</span>
                          }
                        </td>
                        <td className="p-3 text-right">
                          {item.debt > 0 ? (
                            <span className="font-medium text-red-600">{formatSum(item.debt)} so'm</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">{statusBadge(item.status)}</td>
                        <td className="p-3 text-center text-xs text-gray-500">
                          {item.payment?.paid_at ? formatDate(item.payment.paid_at) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {item.overdue_days > 0 ? (
                            <span className="inline-flex items-center gap-1 text-orange-600 font-medium text-xs">
                              <CalendarDays className="h-3 w-3" /> {item.overdue_days} kun
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            {item.status !== 'paid' && (
                              <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(item)} className="text-green-600 h-8 px-2 gap-1" title="To'langan deb belgilash">
                                <CheckCircle className="h-4 w-4" />
                                <span className="hidden md:inline text-xs">To'lov qiling</span>
                              </Button>
                            )}
                            {item.payment && (
                              <Button variant="ghost" size="sm" onClick={() => router.push(`/payments/students/${item.student.id}`)} className="text-blue-600 h-8 w-8 p-0" title="Batafsil">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            )}
                            {item.payment && (
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(item.payment!.id)} className="text-red-600 h-8 w-8 p-0" title="O'chirish">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
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

        {/* Create Payment Dialog */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="bg-white max-w-lg">
            <DialogHeader>
              <DialogTitle>Yangi to'lov qo'shish</DialogTitle>
              <DialogDescription>To'lov ma'lumotlarini kiriting</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Ism yoki familiya bilan qidirish..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="pl-9 mb-1"
                  />
                </div>
                <Select value={createForm.student_id} onValueChange={v => setCreateForm({ ...createForm, student_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Studentni tanlang" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {studentSearch.trim()
                      ? students.filter(s => {
                          const q = studentSearch.toLowerCase();
                          return s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q);
                        }).map(s => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.first_name} {s.last_name}</SelectItem>
                        ))
                      : students.map(s => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.first_name} {s.last_name}</SelectItem>
                        ))
                    }
                    {studentSearch.trim() && students.filter(s => {
                      const q = studentSearch.toLowerCase();
                      return s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q);
                    }).length === 0 && (
                      <div className="px-2 py-4 text-center text-sm text-gray-400">Student topilmadi</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Guruh</Label>
                <Select value={createForm.group_id} onValueChange={v => {
                  const g = groups.find(gr => gr.id === v);
                  if (g?.created_at) {
                    const d = new Date(g.created_at);
                    setCreateForm({
                      ...createForm, group_id: v,
                      amount: g?.monthly_price ? String(g.monthly_price) : '',
                      month: String(d.getMonth() + 1),
                      year: String(d.getFullYear()),
                    });
                  } else {
                    setCreateForm({ ...createForm, group_id: v, amount: g?.monthly_price ? String(g.monthly_price) : '' });
                  }
                }}>
                  <SelectTrigger><SelectValue placeholder="Guruhni tanlang" /></SelectTrigger>
                  <SelectContent>
                    {groups.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name} - {g.monthly_price ? `${formatSum(g.monthly_price)} so'm` : 'Narx yo\'q'}</SelectItem>
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
