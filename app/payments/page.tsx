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
  Wallet, CheckCircle, XCircle, Clock, Plus, Search,
  RefreshCw, ChevronRight, Filter, AlertCircle, Users, CalendarDays, Download,
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
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  
  // Yangi to'lovlar uchun state-lar
  const [selectedStudentDebts, setSelectedStudentDebts] = useState<any>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

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
      setSelectedStudentDebts(null);
      setSelectedPaymentId(null);
      setPaymentAmount('');
      setPaymentNote('');
      setShowCreateModal(true);
    } catch { toast.error("Studentlarni yuklashda xatolik"); }
  };

  const handleSelectStudent = async (studentId: string) => {
    try {
      const debts = await paymentsApi.getStudentDebts(Number(studentId));
      setSelectedStudentDebts(debts);
      setSelectedPaymentId(null);
      setPaymentAmount('');
      setPaymentNote('');
    } catch { toast.error("Qarzdorliklarni yuklashda xatolik"); }
  };

  const handlePayDebt = async () => {
    if (!selectedPaymentId || !paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('To\'lov summasini kiriting');
      return;
    }

    try {
      const debt = selectedStudentDebts.debts.find((d: any) => d.id === selectedPaymentId);
      if (!debt) {
        toast.error('Qarzdorlik topilmadi');
        return;
      }

      await paymentsApi.update(selectedPaymentId, {
        status: 'paid',
        paid_at: new Date().toISOString().split('T')[0],
        note: paymentNote || undefined,
      });

      toast.success("To'lov qabul qilindi");
      setShowCreateModal(false);
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
            <Button onClick={() => paymentsApi.exportToExcel(Number(filterMonth), Number(filterYear))} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="h-4 w-4 mr-2" /> Excel
            </Button>
            <Button onClick={openCreateModal} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Qarzdorlikni to'lash
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-lg"><Users className="h-5 w-5 text-blue-600" /></div>
              <div><p className="text-xs text-gray-500">Studentlar</p><p className="text-lg font-bold text-gray-900">{items.length}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-green-50 rounded-lg"><Wallet className="h-5 w-5 text-green-600" /></div>
              <div><p className="text-xs text-gray-500">To'lov qilgan</p><p className="text-lg font-bold text-green-600">{paidCount}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-lg"><Clock className="h-5 w-5 text-amber-600" /></div>
              <div><p className="text-xs text-gray-500">Qisman to'lagan</p><p className="text-lg font-bold text-amber-600">{partialCount}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-red-50 rounded-lg"><XCircle className="h-5 w-5 text-red-600" /></div>
              <div><p className="text-xs text-gray-500">Qarzdorlar</p><p className="text-lg font-bold text-red-600">{unpaidCount}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-red-50 rounded-lg"><AlertCircle className="h-5 w-5 text-red-600" /></div>
              <div><p className="text-xs text-gray-500">Jami qarz</p><p className="text-lg font-bold text-red-600">{formatSum(totalDebt)} so'm</p></div>
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
                    {[2024, 2025, 2026, 2027].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterGroup} onValueChange={v => setFilterGroup(v)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha guruhlar</SelectItem>
                    {groups.map(g => (
                      <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={v => setFilterStatus(v)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
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
                      <th className="text-center p-3 text-gray-600 font-medium">Oy</th>
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
                        <td className="p-3 text-center text-gray-600 text-sm">{monthNames[item.month - 1]} {item.year}</td>
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

        {/* Create Payment Dialog - YANGI SISTEMA */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedStudentDebts ? `${selectedStudentDebts.student.first_name} ${selectedStudentDebts.student.last_name} - Qarzdorliklarni to'lash` : "Studentni tanlang"}
              </DialogTitle>
            </DialogHeader>

            {!selectedStudentDebts ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Student ism/familiyasini qidiring</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Ism yoki familiya bilan qidirish..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto border rounded-lg divide-y">
                  {students
                    .filter(s => {
                      const q = studentSearch.toLowerCase();
                      return s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q);
                    })
                    .map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectStudent(String(s.id))}
                        className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{s.first_name} {s.last_name}</p>
                          <p className="text-xs text-gray-500">{s.phone_number || '-'}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-xs text-red-600">Jami qarzdorlik</p>
                    <p className="text-2xl font-bold text-red-700">{formatSum(selectedStudentDebts.total_debt)} so'm</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600">To'lagan summa</p>
                    <p className="text-2xl font-bold text-green-700">{formatSum(selectedStudentDebts.paid_total)} so'm</p>
                  </div>
                </div>

                {selectedStudentDebts.debts && selectedStudentDebts.debts.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Qarzdorliklar</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                      {selectedStudentDebts.debts.map((debt: any) => (
                        <div
                          key={`${debt.month}-${debt.year}-${debt.group_id}`}
                          onClick={() => {
                            setSelectedPaymentId(debt.id || null);
                            setPaymentAmount(debt.amount.toString());
                            setPaymentNote('');
                          }}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                            selectedPaymentId === (debt.id || null)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                {debt.month_name} {debt.year} - {debt.group_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {debt.is_auto_generated ? 'Avtomatik yaratilgan' : 'To\'lov qo\'shilgan'}
                              </p>
                            </div>
                            <p className="font-bold text-red-600">{formatSum(debt.amount)} so'm</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStudentDebts.paid_payments && selectedStudentDebts.paid_payments.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">To'langan oylar</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2 bg-green-50">
                      {selectedStudentDebts.paid_payments.map((payment: any) => (
                        <div key={payment.id} className="p-2 rounded bg-white border border-green-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{payment.month_name} {payment.year}</p>
                              <p className="text-xs text-gray-500">{payment.group_name}</p>
                            </div>
                            <p className="font-bold text-green-600">{formatSum(payment.amount)} so'm</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStudentDebts.orphaned_payments && selectedStudentDebts.orphaned_payments.length > 0 && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                    <h3 className="font-medium text-gray-400 text-sm">Guruhi o'chirilgan to'lovlar</h3>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedStudentDebts.orphaned_payments.map((p: any) => (
                        <div key={p.id} className="p-2 rounded bg-gray-50 border border-gray-200 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">{p.month_name} {p.year}</span>
                            <span className={p.status === 'paid' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {formatSum(p.amount)} so'm {p.status === 'paid' ? "(To'langan)" : "(To'lanmagan)"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPaymentId && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                    <div className="space-y-2">
                      <Label>To'lov summas (som)</Label>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        className="text-lg font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Izoh (ixtiyoriy)</Label>
                      <Input
                        placeholder="To'lov haqida izoh..."
                        value={paymentNote}
                        onChange={e => setPaymentNote(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedStudentDebts(null);
                      setSelectedPaymentId(null);
                    }}
                    className="flex-1"
                  >
                    Boshqa student
                  </Button>
                  <Button
                    onClick={() => setShowCreateModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Bekor qilish
                  </Button>
                  {selectedPaymentId && (
                    <Button
                      onClick={handlePayDebt}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      To'lovni qabul qilish
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
