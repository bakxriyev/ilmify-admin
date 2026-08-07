'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import {
  ArrowLeft, Wallet, Users, CheckCircle, XCircle, Search, RefreshCw, Download, Filter, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import * as XLSX from 'xlsx';
import { teachersApi, type TeacherPaymentDetail } from '@/api/teachersApi';
import toast from 'react-hot-toast';

const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

const parityLabel = (p: string | null | undefined) => {
  if (p === 'odd') return { label: 'Toq', class: 'bg-blue-100 text-blue-700 border-blue-200' };
  if (p === 'even') return { label: 'Juft', class: 'bg-purple-100 text-purple-700 border-purple-200' };
  if (p === 'everyday') return { label: 'Har kuni', class: 'bg-cyan-100 text-cyan-700 border-cyan-200' };
  return { label: '-', class: 'bg-gray-100 text-gray-600 border-gray-200' };
};

const paymentTypeBadge = (type: string | null | undefined) => {
  const map: any = {
    naqt: { label: 'Naqd', class: 'bg-green-100 text-green-700 border-green-200' },
    karta: { label: 'Karta', class: 'bg-purple-100 text-purple-700 border-purple-200' },
    click: { label: 'Click', class: 'bg-blue-100 text-blue-700 border-blue-200' },
    yarim_naqt_yarim_karta: { label: 'Karta/Naqt', class: 'bg-orange-100 text-orange-700 border-orange-200' },
  };
  const m = map[type || ''];
  if (m) return <Badge className={`${m.class} border`}>{m.label}</Badge>;
  if (type) return <Badge className="bg-gray-100 text-gray-600 border border-gray-200">{type}</Badge>;
  return <span className="text-gray-400 text-sm">-</span>;
};

const paymentTypeLabel = (type: string | null | undefined) => {
  const map: any = {
    naqt: 'Naqd',
    karta: 'Karta',
    click: 'Click',
    yarim_naqt_yarim_karta: 'Karta/Naqt',
  };
  return map[type || ''] || type || '-';
};

export default function TeacherPaymentsReportPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<TeacherPaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all');

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const d = await teachersApi.getTeacherPaymentReport(
        id,
        month,
        year,
        groupFilter === 'all' ? undefined : Number(groupFilter),
      );
      setData(d);
    } catch {
      toast.error("Hisobotni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [id, month, year, groupFilter]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const rows = useMemo(() => {
    if (!data) return [];
    let result = data.rows;
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }
    if (paymentTypeFilter !== 'all') {
      result = result.filter(r => {
        const pt = r.payment?.payment_type || '';
        if (paymentTypeFilter === 'none') return !pt;
        return pt === paymentTypeFilter;
      });
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const qDigits = q.replace(/\D/g, '');
      result = result.filter(r => {
        const fullName = `${r.student.first_name} ${r.student.last_name} ${r.student.last_name} ${r.student.first_name}`.toLowerCase();
        const phone = (r.student.phone_number || '').replace(/\D/g, '');
        const groupName = (r.group.name || '').toLowerCase();
        if (fullName.includes(q)) return true;
        if (groupName.includes(q)) return true;
        if (qDigits && phone.includes(qDigits)) return true;
        return false;
      });
    }
    return result;
  }, [data, statusFilter, paymentTypeFilter, searchTerm]);

  const handleExportExcel = () => {
    if (!data) return;
    try {
      const exportData = rows.map((r, i) => ({
        '№': i + 1,
        'Ism': r.student.first_name,
        'Familiya': r.student.last_name,
        'Telefon': r.student.phone_number || '-',
        'Guruh': r.group.name,
        'Kun (Toq/Juft)': parityLabel(r.group.parity).label,
        'Vaqt': r.group.lesson_time?.slice(0, 5) || '-',
        'Oylik narx': r.monthly_price,
        'To\'langan': r.paid_amount,
        'Qarz': r.debt,
        'Holat': r.status === 'paid' ? "To'langan" : r.status === 'unpaid' ? "To'lanmagan" : 'Qisman',
        'To\'lov turi': paymentTypeLabel(r.payment?.payment_type),
        'Naqt': r.payment?.payment_type === 'yarim_naqt_yarim_karta' ? r.payment?.cash_amount ?? '' : r.payment?.payment_type === 'naqt' ? r.payment?.amount ?? '' : '',
        'Karta': r.payment?.payment_type === 'yarim_naqt_yarim_karta' ? r.payment?.card_amount ?? '' : r.payment?.payment_type === 'karta' || r.payment?.payment_type === 'click' ? r.payment?.amount ?? '' : '',
        'To\'lov sanasi': r.payment?.paid_at ? new Date(r.payment.paid_at).toLocaleDateString('uz-UZ') : '-',
        'Izoh': r.payment?.note || '',
      }));

      const wb = XLSX.utils.book_new();

      // Summary sheet
      const s = data.summary;
      const summaryRows: any[][] = [];
      summaryRows.push([`To'lov hisoboti | ${data.teacher.first_name} ${data.teacher.last_name} | ${monthNames[month - 1]} ${year}`]);
      summaryRows.push([]);
      summaryRows.push(['Jami o\'quvchilar', s.students_count]);
      summaryRows.push(["To'langan", s.paid_count]);
      summaryRows.push(["To'lanmagan", s.unpaid_count]);
      summaryRows.push(['Qisman', s.partial_count]);
      summaryRows.push(["To'lov foizi", `${s.paid_percent}%`]);
      summaryRows.push(['Jami to\'langan summa', s.total_paid_amount]);
      summaryRows.push(['Jami qarz', s.total_debt]);
      summaryRows.push(['Jami oylik narx', s.total_monthly_price]);
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Xulosa');

      // Data sheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const colWidths = [
        { wch: 5 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
        { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
        { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 22 },
      ];
      ws['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, ws, 'Oquvchilar');

      const teacherName = `${data.teacher.first_name}_${data.teacher.last_name}`.replace(/\s+/g, '_');
      XLSX.writeFile(wb, `tolovlar_${teacherName}_${monthNames[month - 1]}_${year}.xlsx`);
      toast.success('Excel fayl yuklandi');
    } catch {
      toast.error('Eksport qilishda xatolik');
    }
  };

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('998')) {
      return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    }
    return phone;
  };

  const statusBadge = (status: string) => {
    const map: any = {
      paid: { label: "To'langan", class: 'bg-green-100 text-green-700 border-green-200' },
      unpaid: { label: "To'lanmagan", class: 'bg-red-100 text-red-700 border-red-200' },
      partial: { label: 'Qisman', class: 'bg-amber-100 text-amber-700 border-amber-200' },
    };
    const s = map[status] || map.unpaid;
    return <Badge className={`${s.class} border`}>{s.label}</Badge>;
  };

  if (loading && !data) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="p-6">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-600 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Orqaga
          </Button>
          <Card>
            <CardContent className="text-center py-16 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>Hisobot ma'lumotlari topilmadi</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const s = data.summary;

  return (
    <Layout>
      <div className="space-y-5 p-4 md:p-6 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <Button variant="ghost" onClick={() => router.push(`/teachers/${id}`)} className="text-gray-600">
            <ArrowLeft className="h-4 w-4 mr-2" /> Orqaga
          </Button>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchReport} disabled={loading} className="border-gray-300 h-8 text-xs">
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Yangilash
            </Button>
            <Button size="sm" onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs">
              <Download className="h-3 w-3 mr-1" /> Excel yuklab olish
            </Button>
          </div>
        </div>

        {/* Teacher header */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-blue-600 to-indigo-700">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 flex-wrap">
              <Avatar className="h-14 w-14 border-2 border-white shadow-lg">
                <AvatarImage src={data.teacher.photo ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/teachers/${data.teacher.photo}` : ''} />
                <AvatarFallback className="bg-blue-200 text-blue-800 text-lg font-bold">
                  {data.teacher.first_name?.[0] || ''}{data.teacher.last_name?.[0] || ''}
                </AvatarFallback>
              </Avatar>
              <div className="text-white flex-1 min-w-[200px]">
                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  <Wallet className="h-5 w-5" /> To'lovlar hisoboti
                </h1>
                <p className="text-white/90 text-sm flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{data.teacher.first_name} {data.teacher.last_name}</span>
                  <span className="opacity-70">• ID: {data.teacher.id}</span>
                  <span className="opacity-70">• {formatPhone(data.teacher.phone_number)}</span>
                  <span className="opacity-70">• {monthNames[month - 1]} {year}</span>
                </p>
              </div>
              <Badge className="bg-white/20 text-white border-0 text-sm">{s.paid_percent}% to'lov</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-blue-600 font-medium flex items-center gap-1"><Users className="h-3 w-3" /> O'quvchilar</p>
            <p className="text-xl font-bold text-gray-900">{s.students_count}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> To'langan</p>
            <p className="text-xl font-bold text-green-700">{s.paid_count}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3">
            <p className="text-xs text-red-600 font-medium flex items-center gap-1"><XCircle className="h-3 w-3" /> To'lanmagan</p>
            <p className="text-xl font-bold text-red-700">{s.unpaid_count + s.partial_count}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Yig'ilgan summa</p>
            <p className="text-lg font-bold text-emerald-700">{s.total_paid_amount.toLocaleString()} so'm</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-xs text-amber-600 font-medium flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Qarz</p>
            <p className="text-lg font-bold text-amber-700">{s.total_debt.toLocaleString()} so'm</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3">
            <p className="text-xs text-purple-600 font-medium flex items-center gap-1"><TrendingUp className="h-3 w-3" /> To'lov foizi</p>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={s.paid_percent} className="h-2 w-full max-w-[80px] bg-purple-100" />
              <span className="text-lg font-bold text-purple-700">{s.paid_percent}%</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm text-gray-700">Filtrlar</CardTitle>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Select value={month.toString()} onValueChange={v => { setMonth(Number(v)); }}>
                  <SelectTrigger className="w-28 h-8 text-xs border-blue-300">
                    <SelectValue placeholder="Oy" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((name, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)} className="text-xs">{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={year.toString()} onValueChange={v => setYear(Number(v))}>
                  <SelectTrigger className="w-24 h-8 text-xs border-blue-300">
                    <SelectValue placeholder="Yil" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025, 2026, 2027].map(y => (
                      <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-40 h-8 text-xs border-blue-300">
                    <SelectValue placeholder="Guruh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Barcha guruhlar</SelectItem>
                    {data.groups.map(g => (
                      <SelectItem key={g.id} value={String(g.id)} className="text-xs">{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36 h-8 text-xs border-blue-300">
                    <SelectValue placeholder="Holat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Barcha holatlar</SelectItem>
                    <SelectItem value="paid" className="text-xs">To'langan</SelectItem>
                    <SelectItem value="unpaid" className="text-xs">To'lanmagan</SelectItem>
                    <SelectItem value="partial" className="text-xs">Qisman</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                  <SelectTrigger className="w-36 h-8 text-xs border-blue-300">
                    <SelectValue placeholder="To'lov turi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Barcha turlar</SelectItem>
                    <SelectItem value="naqt" className="text-xs">Naqd</SelectItem>
                    <SelectItem value="karta" className="text-xs">Karta</SelectItem>
                    <SelectItem value="click" className="text-xs">Click</SelectItem>
                    <SelectItem value="yarim_naqt_yarim_karta" className="text-xs">Karta/Naqt</SelectItem>
                    <SelectItem value="none" className="text-xs">To'lovsiz</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Ism, telefon, guruh..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-xs w-48 border-blue-300"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="pb-3 border-b bg-gray-50/80">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" /> O'quvchilar to'lovlari (jadval)
            </CardTitle>
            <CardDescription>{rows.length} / {s.students_count} ta o'quvchi ko'rsatilmoqda</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <RefreshCw className="h-10 w-10 animate-spin text-blue-600" />
                <p className="mt-4 text-gray-500">Hisobot yuklanmoqda...</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center py-24 text-gray-500">
                <Users className="h-14 w-14 mx-auto text-gray-300 mb-3" />
                <p>Bu filtrlarda o'quvchilar topilmadi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                    <TableRow>
                      <TableHead className="w-10 text-gray-700 dark:text-gray-300">№</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">O'quvchi</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Telefon</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Guruh</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Kun</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Vaqt</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 text-right">Oylik narx</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 text-right">To'langan</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300 text-right">Qarz</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Holat</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">To'lov turi</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">Izoh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => {
                      const pv = parityLabel(row.group.parity);
                      return (
                        <TableRow key={`${row.student.id}-${row.group.id}`} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors">
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {row.student.first_name} {row.student.last_name}
                                </p>
                                <p className="text-xs text-gray-400">ID: {row.student.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                            {row.student.phone_number ? formatPhone(row.student.phone_number) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-blue-300 text-blue-800 dark:text-blue-400">
                              {row.group.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${pv.class} border`}>{pv.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                            {row.group.lesson_time?.slice(0, 5) || '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium text-gray-800 dark:text-gray-200">
                            {row.monthly_price.toLocaleString()} so'm
                          </TableCell>
                          <TableCell className="text-right text-green-700 dark:text-green-400 font-medium">
                            {row.paid_amount.toLocaleString()} so'm
                          </TableCell>
                          <TableCell className="text-right">
                            {row.debt > 0 ? (
                              <span className="text-red-600 dark:text-red-400 font-medium">{row.debt.toLocaleString()} so'm</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>{statusBadge(row.status)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {paymentTypeBadge(row.payment?.payment_type)}
                              {row.payment?.payment_type === 'yarim_naqt_yarim_karta' && (
                                <span className="text-xs text-gray-500">
                                  Naqt: {(row.payment?.cash_amount ?? 0).toLocaleString()} + Karta: {(row.payment?.card_amount ?? 0).toLocaleString()} so'm
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 dark:text-gray-400 max-w-[160px] truncate" title={row.payment?.note || undefined}>
                            {row.payment?.note || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button variant="link" asChild className="text-gray-500">
            <Link href="/teachers">Barcha o'qituvchilar ro'yxatiga qaytish</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}