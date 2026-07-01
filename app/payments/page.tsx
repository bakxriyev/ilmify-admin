'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { receiptApi } from '@/api/receiptApi';
import { academySettingsApi } from '@/api/academySettingsApi';
import { printReceipt } from '@/lib/printReceipt';

import { groupsApi, type Group } from '@/api/groupsApi';
import { studentsApi, type Student } from '@/api/studentApi';
import {
  Wallet, CheckCircle, XCircle, Clock, Plus, Search,
  RefreshCw, ChevronRight, ChevronLeft, Filter, AlertCircle, Users, CalendarDays, Download, Loader2,
  PrinterIcon, Building2, ReceiptIcon,
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
  const [filterPaymentType, setFilterPaymentType] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [tempMonth, setTempMonth] = useState(String(new Date().getMonth() + 1));
  const [tempYear, setTempYear] = useState(String(new Date().getFullYear()));
  const [tempGroup, setTempGroup] = useState('all');
  const [tempStatus, setTempStatus] = useState('all');
  const [tempPaymentType, setTempPaymentType] = useState('all');
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  
  // Yangi to'lovlar uchun state-lar
  const [selectedStudentDebts, setSelectedStudentDebts] = useState<any>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentType, setPaymentType] = useState('naqt');
  const [customPaymentType, setCustomPaymentType] = useState('');

  // Yangi to'lov qo'shish (prepayment)
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [newPaymentGroupId, setNewPaymentGroupId] = useState<number>(0);
  const [newPaymentMonth, setNewPaymentMonth] = useState(String(new Date().getMonth() + 1));
  const [newPaymentYear, setNewPaymentYear] = useState(String(new Date().getFullYear()));
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentNote, setNewPaymentNote] = useState('');
  const [newPaymentType, setNewPaymentType] = useState('naqt');
  const [newCustomPaymentType, setNewCustomPaymentType] = useState('');
  const [submittingNewPayment, setSubmittingNewPayment] = useState(false);

  const [academySettings, setAcademySettings] = useState<any>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Year overview for monthly grid
  const [yearOverview, setYearOverview] = useState<{ month: number; year: number; total: number; paid: number; unpaid: number; partial: number }[]>([]);
  const [yearOverviewLoading, setYearOverviewLoading] = useState(false);
  const [overviewYear, setOverviewYear] = useState(new Date().getFullYear());

  const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

  const loadData = async () => {
    try {
      setLoading(true);
      const [overview, s, g, aset] = await Promise.all([
        paymentsApi.getStudentsOverview(Number(filterMonth), Number(filterYear)),
        paymentsApi.getStats(),
        groupsApi.getAll({ limit: 100 }),
        academySettingsApi.get(),
      ]);
      setItems(overview);
      setStats(s);
      setGroups(g.data);
      setAcademySettings(aset);
    } catch { toast.error("Ma'lumotlarni yuklashda xatolik"); }
    finally { setLoading(false); }
  };

  const loadYearOverview = async () => {
    try {
      setYearOverviewLoading(true);
      const data = await paymentsApi.getYearOverview(overviewYear);
      setYearOverview(data);
    } catch {} finally { setYearOverviewLoading(false); }
  };

  useEffect(() => { loadData(); }, [filterMonth, filterYear]);
  useEffect(() => { loadYearOverview(); }, [overviewYear]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filterGroup !== 'all' && String(item.group?.id) !== filterGroup) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (filterPaymentType !== 'all') {
        const pt = item.payment?.payment_type || '';
        if (filterPaymentType === 'boshqa') {
          if (['click', 'naqt', 'karta'].includes(pt)) return false;
        } else {
          if (pt !== filterPaymentType) return false;
        }
      }
      if (filterDateFrom || filterDateTo) {
        const paidAt = item.payment?.paid_at;
        if (!paidAt) return false;
        if (filterDateFrom && paidAt < filterDateFrom) return false;
        if (filterDateTo && paidAt > filterDateTo) return false;
      }
      return true;
    });
  }, [items, filterGroup, filterStatus, filterPaymentType, filterDateFrom, filterDateTo]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const handleApplyFilters = () => {
    setFilterMonth(tempMonth);
    setFilterYear(tempYear);
    setFilterGroup(tempGroup);
    setFilterStatus(tempStatus);
    setFilterPaymentType(tempPaymentType);
    setFilterDateFrom(tempDateFrom);
    setFilterDateTo(tempDateTo);
  };

  const paidCount = items.filter(i => i.status === 'paid').length;
  const unpaidCount = items.filter(i => i.status === 'unpaid').length;
  const partialCount = items.filter(i => i.status === 'partial').length;
  const totalExpectedAmount = items.reduce((sum, i) => sum + i.monthly_price, 0);
  const totalPaidAmount = items.reduce((sum, i) => sum + i.paid_amount, 0);
  const totalDebt = items.reduce((sum, i) => sum + i.debt, 0);

  const loadStudents = useCallback(async (search?: string) => {
    try {
      const params: any = { limit: 50 };
      if (search && search.trim().length >= 1) params.search = search.trim();
      const s = await studentsApi.getAll(params);
      setStudents(s.data);
    } catch { toast.error("Studentlarni yuklashda xatolik"); }
  }, []);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!showCreateModal) return;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      loadStudents(studentSearch || undefined);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [studentSearch, showCreateModal, loadStudents]);

  const openCreateModal = async () => {
    try {
      setStudentSearch('');
      setSelectedStudentDebts(null);
      setSelectedPaymentId(null);
      setPaymentAmount('');
      setPaymentNote('');
      setPaymentType('naqt');
      setCustomPaymentType('');
      setShowNewPayment(false);
      setNewPaymentGroupId(0);
      setNewPaymentAmount('');
      setNewPaymentNote('');
      setNewPaymentType('naqt');
      setNewCustomPaymentType('');
      setShowCreateModal(true);
      await loadStudents();
    } catch { toast.error("Studentlarni yuklashda xatolik"); }
  };

  const handleSelectStudent = async (studentId: string) => {
    try {
      const debts = await paymentsApi.getStudentDebts(Number(studentId));
      setSelectedStudentDebts(debts);
      setSelectedPaymentId(null);
      setPaymentAmount('');
      setPaymentNote('');
      setNewPaymentGroupId(0);
      if (debts.student_groups && debts.student_groups.length > 0) {
        setNewPaymentGroupId(debts.student_groups[0].id);
      }
    } catch { toast.error("Qarzdorliklarni yuklashda xatolik"); }
  };

  const printAfterPayment = (student: any, groupName: string, month: number, year: number, amount: number, ptype: string, paidAt: string, paymentId?: number) => {
    const adminRaw = typeof window !== 'undefined' ? localStorage.getItem('admin') : '';
    let adminName = 'Admin';
    try { const a = JSON.parse(adminRaw || '{}'); adminName = a.full_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Admin'; } catch {}
    const settings = academySettings || {};
    const pd = new Date(paidAt);
    printReceipt({
      receiptNumber: undefined,
      academyName: settings.academy_name || '',
      academyLogo: settings.logo || undefined,
      academyAddress: settings.address || undefined,
      academyPhones: [settings.phone1, settings.phone2, settings.phone3].filter(Boolean),
      receiptHeader: settings.receipt_header || undefined,
      receiptFooter: settings.receipt_footer || undefined,
      receiptNote: settings.receipt_note || undefined,
      thankYouText: settings.receipt_thank_you_text || 'Rahmat!',
      footerText: settings.footer_text || undefined,
      website: settings.website || undefined,
      instagram: settings.instagram || undefined,
      telegramBot: settings.telegram_bot_link || undefined,
      studentName: `${student.first_name} ${student.last_name}`.trim(),
      studentPhone: student.phone_number || '',
      groupName,
      paidMonth: monthNames[month - 1],
      paidYear: String(year),
      paidAt: `${pd.getDate().toString().padStart(2, '0')}.${(pd.getMonth() + 1).toString().padStart(2, '0')}.${pd.getFullYear()} ${pd.getHours().toString().padStart(2, '0')}:${pd.getMinutes().toString().padStart(2, '0')}`,
      paymentType: ptype === 'naqt' ? 'Naqt' : ptype === 'karta' ? 'Karta' : ptype === 'click' ? 'Click' : ptype || 'Naqt',
      amount,
      adminName,
      receiptWidth: settings.receipt_width || 320,
      fontSize: settings.receipt_font_size || 13,
    });
    if (paymentId) {
      receiptApi.print({ payment_id: paymentId }).catch(() => {});
    }
  };

  const handlePayDebt = async () => {
    if (!selectedPaymentId || !paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('To\'lov summasini kiriting');
      return;
    }

    const resolvedType = paymentType === 'boshqa' ? customPaymentType : paymentType;

    try {
      const res = await paymentsApi.update(selectedPaymentId, {
        amount: Number(paymentAmount),
        status: 'paid',
        paid_at: new Date().toISOString().split('T')[0],
        payment_type: resolvedType || undefined,
        note: paymentNote || undefined,
      });

      toast.success("To'lov qabul qilindi");
      setShowCreateModal(false);

      if (selectedStudentDebts && selectedDebt) {
        printAfterPayment(
          selectedStudentDebts.student,
          selectedDebt.group_name,
          selectedDebt.month,
          selectedDebt.year,
          Number(paymentAmount),
          resolvedType || 'naqt',
          res.paid_at || new Date().toISOString(),
          res.id,
        );
      }

      loadData();
      loadYearOverview();
    } catch (err: any) { toast.error(err.message || 'Xatolik'); }
  };

  const handleCreatePayment = async () => {
    if (!selectedDebt || !paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('To\'lov summasini kiriting');
      return;
    }

    const resolvedType = paymentType === 'boshqa' ? customPaymentType : paymentType;

    try {
      const res = await paymentsApi.create({
        student_id: selectedStudentDebts.student.id,
        group_id: selectedDebt.group_id,
        amount: Number(paymentAmount),
        month: selectedDebt.month,
        year: selectedDebt.year,
        status: 'paid',
        paid_at: new Date().toISOString().split('T')[0],
        payment_type: resolvedType || undefined,
        note: paymentNote || undefined,
      });

      toast.success("To'lov qabul qilindi");
      setShowCreateModal(false);

      printAfterPayment(
        selectedStudentDebts.student,
        selectedDebt.group_name,
        selectedDebt.month,
        selectedDebt.year,
        Number(paymentAmount),
        resolvedType || 'naqt',
        res.paid_at || new Date().toISOString(),
        res.id,
      );

      loadData();
      loadYearOverview();
    } catch (err: any) { toast.error(err.message || 'Xatolik'); }
  };

  const handleSubmitNewPayment = async () => {
    if (!newPaymentGroupId || !newPaymentAmount || Number(newPaymentAmount) <= 0 || !selectedStudentDebts) {
      toast.error('Barcha maydonlarni to\'ldiring');
      return;
    }

    const resolvedType = newPaymentType === 'boshqa' ? newCustomPaymentType : newPaymentType;

    try {
      setSubmittingNewPayment(true);
      const res = await paymentsApi.create({
        student_id: selectedStudentDebts.student.id,
        group_id: newPaymentGroupId,
        amount: Number(newPaymentAmount),
        month: Number(newPaymentMonth),
        year: Number(newPaymentYear),
        status: 'paid',
        paid_at: new Date().toISOString().split('T')[0],
        payment_type: resolvedType || undefined,
        note: newPaymentNote || undefined,
      });

      toast.success("Yangi to'lov yaratildi");
      setShowCreateModal(false);

      const grp = (selectedStudentDebts.student_groups || []).find((g: any) => g.id === newPaymentGroupId);
      printAfterPayment(
        selectedStudentDebts.student,
        grp?.name || '',
        Number(newPaymentMonth),
        Number(newPaymentYear),
        Number(newPaymentAmount),
        resolvedType || 'naqt',
        res.paid_at || new Date().toISOString(),
        res.id,
      );

      loadData();
      loadYearOverview();
    } catch (err: any) { toast.error(err.message || 'Xatolik'); }
    finally { setSubmittingNewPayment(false); }
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
          payment_type: 'naqt',
        });
        toast.success("To'lov qo'shildi");
      }
      handlePrintReceipt(item);
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

  const handlePrintReceipt = async (item: GroupPaymentSummary) => {
    try {
      const adminRaw = typeof window !== 'undefined' ? localStorage.getItem('admin') : '';
      let adminName = 'Admin';
      try { const a = JSON.parse(adminRaw || '{}'); adminName = a.full_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Admin'; } catch {}

      const settings = academySettings || {};
      const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
      const paidAt = item.payment?.paid_at || new Date().toISOString().split('T')[0];
      const paidDate = new Date(paidAt);

      printReceipt({
        receiptNumber: undefined,
        academyName: settings.academy_name || '',
        academyLogo: settings.logo || undefined,
        academyAddress: settings.address || undefined,
        academyPhones: [settings.phone1, settings.phone2, settings.phone3].filter(Boolean),
        receiptHeader: settings.receipt_header || undefined,
        receiptFooter: settings.receipt_footer || undefined,
        receiptNote: settings.receipt_note || undefined,
        thankYouText: settings.receipt_thank_you_text || 'Rahmat!',
        footerText: settings.footer_text || undefined,
        website: settings.website || undefined,
        instagram: settings.instagram || undefined,
        telegramBot: settings.telegram_bot_link || undefined,
        studentName: `${item.student.first_name} ${item.student.last_name}`.trim(),
        studentPhone: item.student.phone_number || '',
        groupName: item.group?.name || '',
        paidMonth: monthNames[item.month - 1],
        paidYear: String(item.year),
        paidAt: `${paidDate.getDate().toString().padStart(2, '0')}.${(paidDate.getMonth() + 1).toString().padStart(2, '0')}.${paidDate.getFullYear()} ${paidDate.getHours().toString().padStart(2, '0')}:${paidDate.getMinutes().toString().padStart(2, '0')}`,
        paymentType: (item.payment?.payment_type === 'naqt' ? 'Naqt' : item.payment?.payment_type === 'karta' ? 'Karta' : item.payment?.payment_type === 'click' ? 'Click' : item.payment?.payment_type || 'Naqt'),
        amount: item.paid_amount || item.monthly_price,
        adminName,
        receiptWidth: settings.receipt_width || 320,
        fontSize: settings.receipt_font_size || 13,
      });

      if (item.payment?.id) {
        receiptApi.print({ payment_id: item.payment.id }).catch(() => {});
      }
    } catch (err: any) {
      toast.error('Chop etishda xatolik');
    }
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

  const paymentTypeLabel = (type: string | null | undefined) => {
    if (!type) return { label: '-', class: 'text-gray-400' };
    const map: any = {
      click: { label: 'Click', class: 'text-blue-600 bg-blue-50 border-blue-200' },
      naqt: { label: 'Naqt', class: 'text-green-600 bg-green-50 border-green-200' },
      karta: { label: 'Karta', class: 'text-purple-600 bg-purple-50 border-purple-200' },
    };
    return map[type] || { label: type, class: 'text-gray-600 bg-gray-50 border-gray-200' };
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '-';
    try { const dt = new Date(d); return `${dt.getDate()} ${monthNames[dt.getMonth()]} ${dt.getFullYear()}`; }
    catch { return d; }
  };

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="h-5 w-5 md:h-6 md:w-6 text-green-600" /> To'lovlar
            </h1>
            <p className="text-xs md:text-sm text-gray-500">{monthNames[Number(filterMonth) - 1]} {filterYear} — oyi uchun to'lov holati</p>
          </div>
          <div className="flex gap-1.5 md:gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => { loadData(); loadYearOverview(); }} className="border-gray-300 h-8 text-xs">
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Yangilash
            </Button>
            <Button size="sm" onClick={() => paymentsApi.exportToExcel(Number(filterMonth), Number(filterYear))} className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
              <Download className="h-3 w-3 mr-1" /> Excel
            </Button>
            <Button size="sm" onClick={openCreateModal} className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Qarzdorlikni to'lash
            </Button>
          </div>
        </div>

        {/* Printer & Settings */}
        <div className="flex items-center gap-2 flex-wrap bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-4">
          <Link href="/payments/printer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold transition-colors">
            <PrinterIcon className="h-3.5 w-3.5" /> Printer sozlamalari
          </Link>
          <Link href="/payments/settings" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition-colors">
            <Building2 className="h-3.5 w-3.5" /> Chek ma'lumotlari
          </Link>
          <Link href="/payments/receipts" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors">
            <ReceiptIcon className="h-3.5 w-3.5" /> Cheklar tarixi
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
          <Card className="border-0 shadow-sm md:shadow-md">
            <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2.5 bg-blue-50 rounded-lg"><Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600" /></div>
              <div><p className="text-[10px] md:text-xs text-gray-500">Studentlar</p><p className="text-base md:text-lg font-bold text-gray-900">{items.length}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm md:shadow-md">
            <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2.5 bg-green-50 rounded-lg"><Wallet className="h-4 w-4 md:h-5 md:w-5 text-green-600" /></div>
              <div><p className="text-[10px] md:text-xs text-gray-500">To'lov qilgan</p><p className="text-base md:text-lg font-bold text-green-600">{paidCount}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm md:shadow-md">
            <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2.5 bg-amber-50 rounded-lg"><Clock className="h-4 w-4 md:h-5 md:w-5 text-amber-600" /></div>
              <div><p className="text-[10px] md:text-xs text-gray-500">Qisman</p><p className="text-base md:text-lg font-bold text-amber-600">{partialCount}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm md:shadow-md">
            <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2.5 bg-red-50 rounded-lg"><XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600" /></div>
              <div><p className="text-[10px] md:text-xs text-gray-500">Qarzdorlar</p><p className="text-base md:text-lg font-bold text-red-600">{unpaidCount}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm md:shadow-md col-span-2 sm:col-span-1">
            <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2.5 bg-red-50 rounded-lg"><AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600" /></div>
              <div><p className="text-[10px] md:text-xs text-gray-500">Jami qarz</p><p className="text-base md:text-lg font-bold text-red-600">{formatSum(totalDebt)} so'm</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Overview Grid */}
        <Card className="border-0 shadow-sm md:shadow-md">
          <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-800 text-sm md:text-base">{overviewYear} yil oylik to'lov holati</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => {
                  if (overviewYear > 2020) {
                    setOverviewYear(overviewYear - 1);
                    setTempYear(String(overviewYear - 1));
                  }
                }} disabled={overviewYear <= 2020} className="h-7 md:h-8 px-1.5 md:px-2">
                  <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
                <span className="text-xs md:text-sm font-medium text-gray-700 w-12 md:w-16 text-center">{overviewYear}</span>
                <Button variant="outline" size="sm" onClick={() => {
                  setOverviewYear(overviewYear + 1);
                  setTempYear(String(overviewYear + 1));
                }} className="h-7 md:h-8 px-1.5 md:px-2">
                  <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-4">
            {yearOverviewLoading ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1 md:gap-2">
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                  <Skeleton key={i} className="h-16 md:h-20 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1 md:gap-2">
                {yearOverview.map((m) => {
                  const isCurrentMonth = m.month === new Date().getMonth() + 1 && overviewYear === new Date().getFullYear();
                  const isFuture = (m.year > new Date().getFullYear()) || (m.year === new Date().getFullYear() && m.month > new Date().getMonth() + 1);
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
                      label = isFuture ? 'Kutilmoqda' : "To'lanmagan";
                    } else {
                      bgColor = 'bg-amber-100 border-amber-300';
                      textColor = 'text-amber-700';
                      label = 'Qisman';
                    }
                  } else if (isFuture && m.total === 0) {
                    bgColor = 'bg-purple-50 border-purple-200';
                    textColor = 'text-purple-500';
                    label = 'Reja';
                  }
                  const isSelected = Number(filterMonth) === m.month && Number(filterYear) === overviewYear;
                  return (
                    <div
                      key={m.month}
                      onClick={() => {
                        setTempMonth(String(m.month));
                        setFilterMonth(String(m.month));
                        setTempYear(String(overviewYear));
                        setFilterYear(String(overviewYear));
                      }}
                      className={`rounded-lg border p-1.5 md:p-2 text-center cursor-pointer hover:shadow-md transition-all duration-200 ${bgColor} ${textColor} ${isCurrentMonth ? 'ring-2 ring-blue-400' : ''} ${isSelected ? 'ring-2 ring-blue-600 scale-105 shadow-lg' : ''}`}
                      title={`${monthNames[m.month - 1]}: ${m.paid} to'langan, ${m.unpaid} to'lanmagan, ${m.partial} qisman (jami ${m.total} student)`}
                    >
                      <p className="text-[10px] md:text-xs font-semibold">{monthNames[m.month - 1].slice(0, 3)}</p>
                      <p className="text-sm md:text-lg font-bold">{m.total > 0 ? `${m.paid}/${m.total}` : isFuture ? '0' : '-'}</p>
                      <p className="text-[8px] md:text-[10px] opacity-75 leading-tight">{label}</p>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2 md:gap-4 mt-2 md:mt-3 text-[10px] md:text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-green-100 border border-green-300 inline-block" /> To'langan</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-red-100 border border-red-300 inline-block" /> To'lanmagan</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-amber-100 border border-amber-300 inline-block" /> Qisman</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-gray-100 border border-gray-300 inline-block" /> Student yo'q</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-purple-50 border border-purple-200 inline-block" /> Reja</span>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="border-0 shadow-sm md:shadow-md">
          <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-3">
              <div className="flex items-center gap-1.5 md:gap-2">
                <CardTitle className="text-gray-800 flex items-center gap-1 md:gap-2 text-sm md:text-base"><Filter className="h-3.5 w-3.5 md:h-4 md:w-4" /> Filtrlar</CardTitle>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] md:text-xs">
                  {monthNames[Number(filterMonth) - 1]} {filterYear}
                </Badge>
                {filterStatus !== 'all' && (
                  <Badge className={
                    filterStatus === 'paid' ? 'bg-green-100 text-green-700 border-green-200 text-[10px] md:text-xs' :
                    filterStatus === 'partial' ? 'bg-amber-100 text-amber-700 border-amber-200 text-[10px] md:text-xs' :
                    'bg-red-100 text-red-700 border-red-200 text-[10px] md:text-xs'
                  }>
                    {filterStatus === 'paid' ? "To'langan" : filterStatus === 'partial' ? 'Qisman' : "To'lanmagan"}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                <Select value={tempMonth} onValueChange={v => setTempMonth(v)}>
                  <SelectTrigger className="w-24 md:w-28 h-8 text-xs border-blue-300 focus:ring-blue-500"><SelectValue placeholder="Oy" /></SelectTrigger>
                  <SelectContent>
                    {monthNames.map((name, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)} className="text-xs">{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={tempYear} onValueChange={v => setTempYear(v)}>
                  <SelectTrigger className="w-20 md:w-24 h-8 text-xs border-blue-300 focus:ring-blue-500"><SelectValue placeholder="Yil" /></SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map(y => (
                      <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={tempGroup} onValueChange={v => setTempGroup(v)}>
                  <SelectTrigger className="w-32 md:w-40 h-8 text-xs border-blue-300 focus:ring-blue-500"><SelectValue placeholder="Guruh" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Barcha guruhlar</SelectItem>
                    {groups.map(g => (
                      <SelectItem key={g.id} value={String(g.id)} className="text-xs">{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="hidden sm:flex gap-1.5 md:gap-2">
                  <Select value={tempStatus} onValueChange={v => setTempStatus(v)}>
                    <SelectTrigger className="w-28 md:w-40 h-8 text-xs border-blue-300 focus:ring-blue-500"><SelectValue placeholder="Holat" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Barcha holatlar</SelectItem>
                      <SelectItem value="paid" className="text-xs">To'langan</SelectItem>
                      <SelectItem value="unpaid" className="text-xs">To'lanmagan</SelectItem>
                      <SelectItem value="partial" className="text-xs">Qisman</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tempPaymentType} onValueChange={v => setTempPaymentType(v)}>
                    <SelectTrigger className="w-28 md:w-32 h-8 text-xs border-blue-300 focus:ring-blue-500"><SelectValue placeholder="To'lov turi" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Barcha turlar</SelectItem>
                      <SelectItem value="naqt" className="text-xs">Naqt</SelectItem>
                      <SelectItem value="karta" className="text-xs">Karta</SelectItem>
                      <SelectItem value="click" className="text-xs">Click</SelectItem>
                      <SelectItem value="boshqa" className="text-xs">Boshqa</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Input
                      type="date"
                      value={tempDateFrom}
                      onChange={e => setTempDateFrom(e.target.value)}
                      className="w-32 md:w-36 h-8 text-xs border-blue-300"
                      placeholder="Sanadan"
                    />
                    <span className="text-gray-400 text-xs">-</span>
                    <Input
                      type="date"
                      value={tempDateTo}
                      onChange={e => setTempDateTo(e.target.value)}
                      className="w-32 md:w-36 h-8 text-xs border-blue-300"
                      placeholder="Sanagacha"
                    />
                  </div>
                  <Button size="sm" onClick={handleApplyFilters} className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
                    <Filter className="h-3 w-3 mr-1" /> Qo'llash
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    const now = new Date();
                    const m = String(now.getMonth() + 1);
                    const y = String(now.getFullYear());
                    setTempMonth(m); setTempYear(y); setTempGroup('all'); setTempStatus('all');
                    setTempPaymentType('all'); setTempDateFrom(''); setTempDateTo('');
                    setFilterMonth(m); setFilterYear(y); setFilterGroup('all'); setFilterStatus('all');
                    setFilterPaymentType('all'); setFilterDateFrom(''); setFilterDateTo('');
                  }} className="h-8 text-xs border-gray-300">
                    <Filter className="h-3 w-3 mr-1" /> Tozalash
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex sm:hidden flex-col gap-1.5 mt-2">
              <div className="flex items-center gap-1.5">
                <Select value={tempStatus} onValueChange={v => setTempStatus(v)}>
                  <SelectTrigger className="flex-1 h-8 text-xs border-blue-300 focus:ring-blue-500"><SelectValue placeholder="Holat" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Barcha holatlar</SelectItem>
                    <SelectItem value="paid" className="text-xs">To'langan</SelectItem>
                    <SelectItem value="unpaid" className="text-xs">To'lanmagan</SelectItem>
                    <SelectItem value="partial" className="text-xs">Qisman</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleApplyFilters} className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs whitespace-nowrap">
                  <Filter className="h-3 w-3 mr-1" /> Qo'llash
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const now = new Date();
                  const m = String(now.getMonth() + 1);
                  const y = String(now.getFullYear());
                  setTempMonth(m); setTempYear(y); setTempGroup('all'); setTempStatus('all');
                  setTempPaymentType('all'); setTempDateFrom(''); setTempDateTo('');
                  setFilterMonth(m); setFilterYear(y); setFilterGroup('all'); setFilterStatus('all');
                  setFilterPaymentType('all'); setFilterDateFrom(''); setFilterDateTo('');
                }} className="h-8 text-xs border-gray-300 whitespace-nowrap">
                  <Filter className="h-3 w-3 mr-1" /> Tozalash
                </Button>
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={tempDateFrom}
                  onChange={e => setTempDateFrom(e.target.value)}
                  className="flex-1 h-8 text-xs border-blue-300"
                  placeholder="Sanadan"
                />
                <Input
                  type="date"
                  value={tempDateTo}
                  onChange={e => setTempDateTo(e.target.value)}
                  className="flex-1 h-8 text-xs border-blue-300"
                  placeholder="Sanagacha"
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <span className="text-[10px] md:text-sm text-gray-500 font-medium mr-0.5 md:mr-1">Ko'rinish:</span>
          <button
            onClick={() => { setFilterStatus('all'); setTempStatus('all'); }}
            className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-colors ${
              filterStatus === 'all' ? 'bg-gray-800 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Hammasi <span className="ml-1 text-[9px] md:text-xs opacity-75">({items.length})</span>
          </button>
          <button
            onClick={() => { setFilterStatus('paid'); setTempStatus('paid'); }}
            className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-colors ${
              filterStatus === 'paid' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-green-600 border border-green-200 hover:bg-green-50'
            }`}
          >
            To'lagan <span className="ml-1 text-[9px] md:text-xs opacity-75">({paidCount})</span>
          </button>
          <button
            onClick={() => { setFilterStatus('partial'); setTempStatus('partial'); }}
            className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-colors ${
              filterStatus === 'partial' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-amber-600 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            Qisman <span className="ml-1 text-[9px] md:text-xs opacity-75">({partialCount})</span>
          </button>
          <button
            onClick={() => { setFilterStatus('unpaid'); setTempStatus('unpaid'); }}
            className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-colors ${
              filterStatus === 'unpaid' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
            }`}
          >
            To'lamagan <span className="ml-1 text-[9px] md:text-xs opacity-75">({unpaidCount})</span>
          </button>
        </div>

        {/* Students Table */}
        <Card className="border-0 shadow-sm md:shadow-md">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 md:p-6 space-y-2 md:space-y-3">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 md:h-14 w-full rounded-lg" />)}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-10 md:py-12 text-gray-500">
                <Wallet className="h-10 w-10 md:h-12 md:w-12 mx-auto text-gray-300 mb-2 md:mb-3" />
                <p className="text-sm">{filterMonth && filterYear ? `${monthNames[Number(filterMonth) - 1]} ${filterYear} oyida studentlar mavjud emas` : 'Studentlar mavjud emas'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 md:p-3 text-gray-600 font-medium w-8 md:w-10">#</th>
                      <th className="text-left p-2 md:p-3 text-gray-600 font-medium">Student</th>
                      <th className="hidden md:table-cell text-left p-3 text-gray-600 font-medium">Guruh</th>
                      <th className="hidden sm:table-cell text-center p-2 md:p-3 text-gray-600 font-medium">Oy</th>
                      <th className="text-right p-2 md:p-3 text-gray-600 font-medium">Summa</th>
                      <th className="hidden sm:table-cell text-right p-2 md:p-3 text-gray-600 font-medium">To'lagan</th>
                      <th className="text-right p-2 md:p-3 text-gray-600 font-medium">Qarzdorlik</th>
                      <th className="text-center p-2 md:p-3 text-gray-600 font-medium">Holat</th>
                      <th className="hidden lg:table-cell text-center p-2 md:p-3 text-gray-600 font-medium">To'lov turi</th>
                      <th className="hidden lg:table-cell text-center p-2 md:p-3 text-gray-600 font-medium">To'lov sanasi</th>
                      <th className="hidden md:table-cell text-center p-2 md:p-3 text-gray-600 font-medium">Kechikish</th>
                      <th className="text-right p-2 md:p-3 text-gray-600 font-medium">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item, idx) => (
                      <tr key={`${item.student.id}-${item.group?.id || idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 md:p-3 text-center text-gray-400 font-mono">{(page - 1) * pageSize + idx + 1}</td>
                        <td className="p-2 md:p-3">
                          <Link href={`/students/${item.student.id}`} className="font-medium text-gray-900 hover:text-blue-600 text-xs md:text-sm">
                            {item.student.first_name} {item.student.last_name}
                          </Link>
                          <div className="text-[10px] md:text-xs text-gray-400 truncate max-w-[100px] md:max-w-none">{item.student.phone_number}</div>
                        </td>
                        <td className="hidden md:table-cell p-3 text-gray-600 text-xs md:text-sm">
                          <Link href={`/groups/${item.group?.id}`} className="hover:text-blue-600">
                            {item.group?.name || '-'}
                          </Link>
                        </td>
                        <td className="hidden sm:table-cell p-2 md:p-3 text-center text-gray-600 text-xs md:text-sm">{monthNames[item.month - 1]} {item.year}</td>
                        <td className="p-2 md:p-3 text-right font-medium text-gray-900 text-xs md:text-sm">{formatSum(item.monthly_price)} so'm</td>
                        <td className="hidden sm:table-cell p-2 md:p-3 text-right text-gray-700">
                          {item.status === 'paid'
                            ? <span className="text-green-600 font-medium text-xs">{formatSum(item.paid_amount)} so'm</span>
                            : item.status === 'partial'
                              ? <span className="text-amber-600 font-medium text-xs">{formatSum(item.paid_amount)} so'm</span>
                              : <span className="text-gray-400 text-xs">0 so'm</span>
                          }
                        </td>
                        <td className="p-2 md:p-3 text-right">
                          {item.debt > 0 ? (
                            <span className="font-medium text-red-600 text-xs">{formatSum(item.debt)} so'm</span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="p-2 md:p-3 text-center">{statusBadge(item.status)}</td>
                        <td className="hidden lg:table-cell p-2 md:p-3 text-center">
                          {(() => {
                            const pt = item.payment?.payment_type;
                            const info = paymentTypeLabel(pt);
                            return pt ? (
                              <Badge className={`${info.class} text-[10px] md:text-xs px-1.5 py-0.5 border`}>{info.label}</Badge>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            );
                          })()}
                        </td>
                        <td className="hidden lg:table-cell p-2 md:p-3 text-center text-[10px] md:text-xs text-gray-500">
                          {item.payment?.paid_at ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span>{formatDate(item.payment.paid_at)}</span>
                              {(() => {
                                const now = new Date();
                                const payMonth = new Date(item.year, item.month - 1);
                                const currentMonth = new Date(now.getFullYear(), now.getMonth());
                                if (payMonth > currentMonth) {
                                  return <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[8px] md:text-[9px] px-1 py-0">Oldindan</Badge>;
                                }
                                return null;
                              })()}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="hidden md:table-cell p-2 md:p-3 text-center">
                          {item.overdue_lessons > 0 ? (
                            <span className="inline-flex items-center gap-1 text-orange-600 font-medium text-[10px] md:text-xs">
                              <CalendarDays className="h-2.5 w-2.5 md:h-3 md:w-3" /> {item.overdue_lessons} ta dars
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="p-2 md:p-3 text-right">
                          <div className="flex justify-end gap-0.5 md:gap-1">
                            {item.status !== 'paid' && (
                              <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(item)} className="text-green-600 h-7 md:h-8 px-1.5 md:px-2 gap-0.5 md:gap-1" title="To'langan deb belgilash">
                                <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                                <span className="hidden md:inline text-xs">To'lov qiling</span>
                              </Button>
                            )}
                            {item.payment && (
                              <Button variant="ghost" size="sm" onClick={() => router.push(`/payments/students/${item.student.id}`)} className="text-blue-600 h-7 md:h-8 w-7 md:w-8 p-0" title="Batafsil">
                                <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handlePrintReceipt(item)} className="text-purple-600 h-7 md:h-8 w-7 md:w-8 p-0" title="Chek chop etish">
                              <PrinterIcon className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                            {item.payment && (
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(item.payment!.id)} className="text-red-600 h-7 md:h-8 w-7 md:w-8 p-0" title="O'chirish">
                                <XCircle className="h-3 w-3 md:h-4 md:w-4" />
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
              {filteredItems.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 md:px-4 py-2 md:py-3 border-t border-gray-100">
                  <p className="text-[10px] md:text-sm text-gray-500">
                    {filteredItems.length} tadan {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredItems.length)} ko'rsatilmoqda
                  </p>
                  <div className="flex gap-0.5 md:gap-1 flex-wrap justify-center">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-7 md:h-8 text-[10px] md:text-sm px-1.5 md:px-3">
                      Oldingi
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let p: number;
                      if (totalPages <= 5) {
                        p = i + 1;
                      } else if (page <= 3) {
                        p = i + 1;
                      } else if (page >= totalPages - 2) {
                        p = totalPages - 4 + i;
                      } else {
                        p = page - 2 + i;
                      }
                      return (
                        <Button key={p} variant={page === p ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)} className="h-7 md:h-8 text-[10px] md:text-sm min-w-[24px] md:min-w-[32px] px-1 md:px-2">
                          {p}
                        </Button>
                      );
                    })}
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-7 md:h-8 text-[10px] md:text-sm px-1.5 md:px-3">
                      Keyingi
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Payment Dialog - YANGI SISTEMA */}
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogContent className="bg-white w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm md:text-base">
                  {selectedStudentDebts ? `${selectedStudentDebts.student.first_name} ${selectedStudentDebts.student.last_name} - Qarzdorliklarni to'lash` : "Studentni tanlang"}
                </DialogTitle>
              </DialogHeader>

              {!selectedStudentDebts ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs md:text-sm">Student ism/familiyasini qidiring</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                      <Input
                        placeholder="Ism yoki familiya bilan qidirish..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="pl-9 h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
                    {students.length === 0 && studentSearch ? (
                      <div className="p-4 md:p-6 text-center text-gray-400 text-sm">Student topilmadi</div>
                    ) : students.length === 0 ? (
                      <div className="p-4 md:p-6 text-center text-gray-400 text-sm">Yuklanmoqda...</div>
                    ) : students.map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectStudent(String(s.id))}
                        className="p-2.5 md:p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{s.first_name} {s.last_name}</p>
                          <p className="text-[10px] md:text-xs text-gray-500">{s.phone_number || '-'}</p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <div className="bg-red-50 p-2 md:p-3 rounded-lg border border-red-200">
                    <p className="text-[10px] md:text-xs text-red-600">Jami qarzdorlik</p>
                    <p className="text-lg md:text-2xl font-bold text-red-700">{formatSum(selectedStudentDebts.total_debt)} so'm</p>
                  </div>
                  <div className="bg-green-50 p-2 md:p-3 rounded-lg border border-green-200">
                    <p className="text-[10px] md:text-xs text-green-600">To'lagan summa</p>
                    <p className="text-lg md:text-2xl font-bold text-green-700">{formatSum(selectedStudentDebts.paid_total)} so'm</p>
                  </div>
                </div>

                {selectedStudentDebts.debts && selectedStudentDebts.debts.length > 0 && (
                  <div className="space-y-1.5 md:space-y-2">
                    <h3 className="font-medium text-gray-900 text-xs md:text-sm">Qarzdorliklar</h3>
                    <div className="space-y-1 md:space-y-2 max-h-36 md:max-h-48 overflow-y-auto border rounded-lg p-1.5 md:p-2">
                      {selectedStudentDebts.debts.map((debt: any) => (
                        <div
                          key={`${debt.month}-${debt.year}-${debt.group_id}`}
                          onClick={() => {
                            setSelectedPaymentId(debt.id || null);
                            setSelectedDebt(debt);
                            setPaymentAmount(debt.amount.toString());
                            setPaymentNote('');
                          }}
                          className={`p-2 md:p-3 rounded-lg border-2 cursor-pointer transition ${
                            selectedDebt === debt
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-xs md:text-sm">
                                {debt.month_name} {debt.year} - {debt.group_name}
                              </p>
                              <p className="text-[10px] md:text-xs text-gray-500">
                                {debt.is_auto_generated ? 'Avtomatik' : 'To\'lov qo\'shilgan'}
                              </p>
                            </div>
                            <p className="font-bold text-red-600 text-xs md:text-sm shrink-0">{formatSum(debt.amount)} so'm</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStudentDebts.paid_payments && selectedStudentDebts.paid_payments.length > 0 && (
                  <div className="space-y-1.5 md:space-y-2">
                    <h3 className="font-medium text-gray-900 text-xs md:text-sm">To'langan oylar</h3>
                    <div className="space-y-1 md:space-y-1.5 max-h-32 md:max-h-40 overflow-y-auto border rounded-lg p-1.5 md:p-2 bg-green-50">
                      {selectedStudentDebts.paid_payments.map((payment: any) => (
                        <div key={payment.id} className="p-1.5 md:p-2 rounded bg-white border border-green-200">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-xs md:text-sm">{payment.month_name} {payment.year}</p>
                              <p className="text-[10px] md:text-xs text-gray-500">{payment.group_name}</p>
                            </div>
                            <p className="font-bold text-green-600 text-xs md:text-sm shrink-0">{formatSum(payment.amount)} so'm</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStudentDebts.orphaned_payments && selectedStudentDebts.orphaned_payments.length > 0 && (
                  <div className="space-y-1 md:space-y-2 mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-200">
                    <h3 className="font-medium text-gray-400 text-[10px] md:text-sm">Guruhi o'chirilgan to'lovlar</h3>
                    <div className="max-h-24 md:max-h-32 overflow-y-auto space-y-0.5 md:space-y-1">
                      {selectedStudentDebts.orphaned_payments.map((p: any) => (
                        <div key={p.id} className="p-1.5 md:p-2 rounded bg-gray-50 border border-gray-200">
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-600 text-xs">{p.month_name} {p.year}</span>
                            <span className={`text-xs font-medium ${p.status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                              {formatSum(p.amount)} so'm
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 md:pt-3 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewPayment(!showNewPayment)}
                    className="w-full text-blue-600 border-blue-300 hover:bg-blue-50 h-8 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1.5" />
                    {showNewPayment ? 'Yopish' : 'Yangi to\'lov qo\'shish (avans)'}
                  </Button>

                  {showNewPayment && (
                    <div className="mt-2 md:mt-3 p-3 md:p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-2 md:space-y-3">
                      <div className="grid grid-cols-2 gap-2 md:gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] md:text-xs">Oy</Label>
                          <Select value={newPaymentMonth} onValueChange={setNewPaymentMonth}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {monthNames.map((name, i) => (
                                <SelectItem key={i + 1} value={String(i + 1)} className="text-xs">{name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] md:text-xs">Yil</Label>
                          <Select value={newPaymentYear} onValueChange={setNewPaymentYear}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {[2024, 2025, 2026, 2027].map(y => (
                                <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] md:text-xs">Guruh</Label>
                        <Select value={String(newPaymentGroupId)} onValueChange={v => setNewPaymentGroupId(Number(v))}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Guruhni tanlang" /></SelectTrigger>
                          <SelectContent>
                            {(selectedStudentDebts?.student_groups || []).map((g: any) => (
                              <SelectItem key={g.id} value={String(g.id)} className="text-xs">{g.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] md:text-xs">Summa (so'm)</Label>
                        <Input
                          type="number"
                          value={newPaymentAmount}
                          onChange={e => setNewPaymentAmount(e.target.value)}
                          placeholder="To'lov summasini kiriting"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] md:text-xs">To'lov turi</Label>
                        <Select value={newPaymentType} onValueChange={v => { setNewPaymentType(v); if (v !== 'boshqa') setNewCustomPaymentType(''); }}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="naqt" className="text-xs">Naqt</SelectItem>
                            <SelectItem value="karta" className="text-xs">Karta</SelectItem>
                            <SelectItem value="click" className="text-xs">Click</SelectItem>
                            <SelectItem value="boshqa" className="text-xs">Boshqa</SelectItem>
                          </SelectContent>
                        </Select>
                        {newPaymentType === 'boshqa' && (
                          <Input
                            value={newCustomPaymentType}
                            onChange={e => setNewCustomPaymentType(e.target.value)}
                            placeholder="To'lov turini yozing..."
                            className="h-8 text-sm mt-1"
                          />
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] md:text-xs">Izoh (ixtiyoriy)</Label>
                        <Input
                          placeholder="To'lov haqida izoh..."
                          value={newPaymentNote}
                          onChange={e => setNewPaymentNote(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <Button
                        onClick={handleSubmitNewPayment}
                        disabled={submittingNewPayment}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white h-8 text-xs"
                      >
                        {submittingNewPayment ? (
                          <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Yaratilmoqda...</>
                        ) : (
                          <><Plus className="h-3 w-3 mr-1.5" /> Yangi to'lov yaratish</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {selectedDebt && (
                  <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200 space-y-2 md:space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">To'lov summas (so'm)</Label>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        className="text-base md:text-lg font-bold h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">To'lov turi</Label>
                      <Select value={paymentType} onValueChange={v => { setPaymentType(v); if (v !== 'boshqa') setCustomPaymentType(''); }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="naqt" className="text-xs">Naqt</SelectItem>
                          <SelectItem value="karta" className="text-xs">Karta</SelectItem>
                          <SelectItem value="click" className="text-xs">Click</SelectItem>
                          <SelectItem value="boshqa" className="text-xs">Boshqa</SelectItem>
                        </SelectContent>
                      </Select>
                      {paymentType === 'boshqa' && (
                        <Input
                          value={customPaymentType}
                          onChange={e => setCustomPaymentType(e.target.value)}
                          placeholder="To'lov turini yozing..."
                          className="h-8 text-sm mt-1"
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Izoh (ixtiyoriy)</Label>
                      <Input
                        placeholder="To'lov haqida izoh..."
                        value={paymentNote}
                        onChange={e => setPaymentNote(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-1.5 md:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedStudentDebts(null);
                      setSelectedPaymentId(null);
                      setSelectedDebt(null);
                    }}
                    className="flex-1 text-xs h-8"
                  >
                    Boshqa student
                  </Button>
                  <Button
                    onClick={() => setShowCreateModal(false)}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8"
                  >
                    Bekor qilish
                  </Button>
                  {selectedDebt && selectedPaymentId && (
                    <Button
                      onClick={handlePayDebt}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      To'lovni qabul qilish
                    </Button>
                  )}
                  {selectedDebt && !selectedPaymentId && (
                    <Button
                      onClick={handleCreatePayment}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
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
