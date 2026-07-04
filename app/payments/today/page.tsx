'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { paymentsApi, type Payment } from '@/api/paymentsApi';
import {
  Wallet, RefreshCw, Banknote, CreditCard, SplitSquareHorizontal,
  CalendarDays, DollarSign, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function TodayPaymentsPage() {
  const [payments, setPayments] = useState<(Payment & { student?: any; group?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteDialog, setNoteDialog] = useState<{ paymentId: number; note: string } | null>(null);

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isDirector, setIsDirector] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('admin');
      if (raw) {
        const admin = JSON.parse(raw);
        setIsDirector(admin.role === 'director' || admin.role === 'super_admin');
      }
    } catch {}
  }, []);

  const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

  const loadData = async (date: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await paymentsApi.getAll({
        date_from: date,
        date_to: date,
      });
      setPayments(data);
    } catch (err: any) {
      setError(err?.message || 'Ma\'lumotlarni yuklashda xatolik');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) loadData(selectedDate);
  }, [selectedDate, mounted]);

  const formatSum = (n: number) => Math.floor(n).toLocaleString();

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const displayDate = `${selectedDateObj.getDate().toString().padStart(2, '0')}.${(selectedDateObj.getMonth() + 1).toString().padStart(2, '0')}.${selectedDateObj.getFullYear()}`;

  const navigateDate = (delta: number) => {
    if (!isDirector) return;
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Calculate stats from payments
  const stats = (() => {
    let totalAmount = 0;
    let totalCash = 0;
    let totalCard = 0;
    let splitCount = 0;
    let splitCashAmount = 0;
    let splitCardAmount = 0;
    let naqtCount = 0;
    let naqtAmount = 0;
    let kartaCount = 0;
    let kartaAmount = 0;

    for (const p of payments) {
      const amount = Number(p.amount) || 0;
      totalAmount += amount;

      if (p.payment_type === 'yarim_naqt_yarim_karta') {
        splitCount++;
        const cashPart = Number(p.cash_amount) || 0;
        const cardPart = Number(p.card_amount) || 0;
        splitCashAmount += cashPart;
        splitCardAmount += cardPart;
        totalCash += cashPart;
        totalCard += cardPart;
      } else if (p.payment_type === 'naqt') {
        naqtCount++;
        naqtAmount += amount;
        totalCash += amount;
      } else if (p.payment_type === 'karta') {
        kartaCount++;
        kartaAmount += amount;
        totalCard += amount;
      }
    }

    return {
      total_count: payments.length,
      total_amount: totalAmount,
      total_cash: totalCash,
      total_card: totalCard,
      split_count: splitCount,
      split_cash_amount: splitCashAmount,
      split_card_amount: splitCardAmount,
      naqt_count: naqtCount,
      naqt_amount: naqtAmount,
      karta_count: kartaCount,
      karta_amount: kartaAmount,
    };
  })();

  const paymentTypeBadge = (type: string | null | undefined) => {
    const map: any = {
      naqt: { label: 'Naqt', class: 'text-green-700 bg-green-50 border-green-200' },
      karta: { label: 'Karta', class: 'text-purple-700 bg-purple-50 border-purple-200' },
      yarim_naqt_yarim_karta: { label: 'Yarim naqt/karta', class: 'text-orange-700 bg-orange-50 border-orange-200' },
      click: { label: 'Click', class: 'text-blue-700 bg-blue-50 border-blue-200' },
    };
    const m = map[type || ''] || { label: type || '-', class: 'text-gray-600 bg-gray-50 border-gray-200' };
    return <Badge className={`${m.class} text-xs px-1.5 py-0.5 border`}>{m.label}</Badge>;
  };

  if (!mounted) return <Layout><div className="p-4 md:p-6" /></Layout>;

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6 w-full">
        {/* Header with date filter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              {isDirector ? 'To\'lovlar' : 'Bugungi to\'lovlar'}
            </h1>
            <p className="text-xs md:text-sm text-gray-500">
              {displayDate} — sanasida to'langan barcha to'lovlar
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isDirector ? (
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                <button onClick={() => navigateDate(-1)} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="text-sm text-gray-800 font-medium border-0 outline-none bg-transparent w-[130px] text-center cursor-pointer"
                />
                <button onClick={() => navigateDate(1)} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-600 font-medium bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                {displayDate}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => loadData(selectedDate)} className="border-gray-300 h-8 text-xs">
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Yangilash
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[1,2,3,4].map(i => (
                <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
              ))}
            </div>
            <Card className="border-0 shadow-sm"><CardContent className="p-4"><Skeleton className="h-40 w-full" /></CardContent></Card>
          </div>
        ) : error ? (
          <Card className="border-0 shadow-sm border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={() => loadData(selectedDate)} className="mt-3">Qayta yuklash</Button>
            </CardContent>
          </Card>
        ) : payments.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 md:p-12 text-center">
              <Wallet className="h-12 w-12 md:h-16 md:w-16 mx-auto text-gray-300 mb-3" />
              <p className="text-sm md:text-base text-gray-500 font-medium">{displayDate} sanasida to'lovlar mavjud emas</p>
              <p className="text-xs md:text-sm text-gray-400 mt-1">Bu sanada hech qanday to'lov bo'lmagan</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-blue-600 font-medium">Jami to'lovlar</p>
                      <p className="text-xl md:text-3xl font-bold text-blue-800 mt-1">{stats.total_count} ta</p>
                    </div>
                    <div className="p-2.5 md:p-3 bg-blue-200 rounded-full">
                      <Wallet className="h-5 w-5 md:h-7 md:w-7 text-blue-700" />
                    </div>
                  </div>
                  <p className="text-lg md:text-2xl font-bold text-blue-900 mt-2">{formatSum(stats.total_amount)} so'm</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-green-600 font-medium">Naqt tushum</p>
                      <p className="text-xl md:text-3xl font-bold text-green-800 mt-1">{stats.naqt_count + stats.split_count} ta</p>
                    </div>
                    <div className="p-2.5 md:p-3 bg-green-200 rounded-full">
                      <Banknote className="h-5 w-5 md:h-7 md:w-7 text-green-700" />
                    </div>
                  </div>
                  <p className="text-lg md:text-2xl font-bold text-green-900 mt-2">{formatSum(stats.total_cash)} so'm</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-purple-600 font-medium">Karta tushum</p>
                      <p className="text-xl md:text-3xl font-bold text-purple-800 mt-1">{stats.karta_count + stats.split_count} ta</p>
                    </div>
                    <div className="p-2.5 md:p-3 bg-purple-200 rounded-full">
                      <CreditCard className="h-5 w-5 md:h-7 md:w-7 text-purple-700" />
                    </div>
                  </div>
                  <p className="text-lg md:text-2xl font-bold text-purple-900 mt-2">{formatSum(stats.total_card)} so'm</p>
                </CardContent>
              </Card>

              {stats.split_count > 0 && (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-orange-600 font-medium">Yarim naqt/karta</p>
                        <p className="text-xl md:text-3xl font-bold text-orange-800 mt-1">{stats.split_count} ta</p>
                      </div>
                      <div className="p-2.5 md:p-3 bg-orange-200 rounded-full">
                        <SplitSquareHorizontal className="h-5 w-5 md:h-7 md:w-7 text-orange-700" />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-2 text-xs">
                      <span className="text-green-700">Naqt: {formatSum(stats.split_cash_amount)} so'm</span>
                      <span className="text-purple-700">Karta: {formatSum(stats.split_card_amount)} so'm</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Cash vs Card Total */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <Card className="border-0 shadow-sm bg-green-50 border border-green-200">
                <CardContent className="p-4 md:p-5 flex items-center gap-3">
                  <div className="p-2 md:p-3 bg-green-200 rounded-full">
                    <Banknote className="h-5 w-5 md:h-6 md:w-6 text-green-700" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-green-700 font-medium">Jami naqt tushum</p>
                    <p className="text-xl md:text-3xl font-bold text-green-900 mt-0.5">{formatSum(stats.total_cash)} so'm</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-purple-50 border border-purple-200">
                <CardContent className="p-4 md:p-5 flex items-center gap-3">
                  <div className="p-2 md:p-3 bg-purple-200 rounded-full">
                    <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-purple-700" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-purple-700 font-medium">Jami karta tushum</p>
                    <p className="text-xl md:text-3xl font-bold text-purple-900 mt-0.5">{formatSum(stats.total_card)} so'm</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed table with per-payment-type breakdown */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-4">
                <CardTitle className="text-gray-800 text-sm md:text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-600" /> To'lov turlari bo'yicha
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 md:px-6 pb-3 md:pb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2 md:p-3 text-gray-600 font-medium">To'lov turi</th>
                        <th className="text-center p-2 md:p-3 text-gray-600 font-medium">Soni</th>
                        <th className="text-right p-2 md:p-3 text-gray-600 font-medium">Summa</th>
                        <th className="text-right p-2 md:p-3 text-gray-600 font-medium">Naqt</th>
                        <th className="text-right p-2 md:p-3 text-gray-600 font-medium">Karta</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 md:p-3 font-medium text-green-700">Naqt</td>
                        <td className="p-2 md:p-3 text-center">{stats.naqt_count} ta</td>
                        <td className="p-2 md:p-3 text-right font-medium">{formatSum(stats.naqt_amount)} so'm</td>
                        <td className="p-2 md:p-3 text-right font-medium">{formatSum(stats.naqt_amount)} so'm</td>
                        <td className="p-2 md:p-3 text-right text-gray-400">-</td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 md:p-3 font-medium text-purple-700">Karta</td>
                        <td className="p-2 md:p-3 text-center">{stats.karta_count} ta</td>
                        <td className="p-2 md:p-3 text-right font-medium">{formatSum(stats.karta_amount)} so'm</td>
                        <td className="p-2 md:p-3 text-right text-gray-400">-</td>
                        <td className="p-2 md:p-3 text-right font-medium">{formatSum(stats.karta_amount)} so'm</td>
                      </tr>
                      {stats.split_count > 0 && (
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-2 md:p-3 font-medium text-orange-700">Yarim naqt/karta</td>
                          <td className="p-2 md:p-3 text-center">{stats.split_count} ta</td>
                          <td className="p-2 md:p-3 text-right font-medium">{formatSum(stats.split_cash_amount + stats.split_card_amount)} so'm</td>
                          <td className="p-2 md:p-3 text-right font-medium">{formatSum(stats.split_cash_amount)} so'm</td>
                          <td className="p-2 md:p-3 text-right font-medium">{formatSum(stats.split_card_amount)} so'm</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-100 font-bold">
                      <tr>
                        <td className="p-2 md:p-3 text-gray-800">JAMI</td>
                        <td className="p-2 md:p-3 text-center text-gray-800">{stats.total_count} ta</td>
                        <td className="p-2 md:p-3 text-right text-gray-800">{formatSum(stats.total_amount)} so'm</td>
                        <td className="p-2 md:p-3 text-right text-gray-800">{formatSum(stats.total_cash)} so'm</td>
                        <td className="p-2 md:p-3 text-right text-gray-800">{formatSum(stats.total_card)} so'm</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Individual payments list */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-4">
                <CardTitle className="text-gray-800 text-sm md:text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-gray-600" /> {displayDate} to'langan to'lovlar ({payments.length} ta)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2 md:p-3 text-gray-600 font-medium">#</th>
                        <th className="text-left p-2 md:p-3 text-gray-600 font-medium">Student</th>
                        <th className="hidden md:table-cell text-left p-3 text-gray-600 font-medium">Guruh</th>
                        <th className="text-center p-2 md:p-3 text-gray-600 font-medium">Oy</th>
                        <th className="text-right p-2 md:p-3 text-gray-600 font-medium">Summa</th>
                        <th className="text-center p-2 md:p-3 text-gray-600 font-medium">To'lov turi</th>
                        <th className="text-right p-2 md:p-3 text-gray-600 font-medium">Naqt</th>
                        <th className="text-right p-2 md:p-3 text-gray-600 font-medium">Karta</th>
                        <th className="hidden lg:table-cell text-center p-2 md:p-3 text-gray-600 font-medium">To'langan</th>
                        <th className="hidden lg:table-cell text-left p-2 md:p-3 text-gray-600 font-medium">Izoh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p, idx) => (
                        <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-2 md:p-3 text-gray-400 font-mono">{idx + 1}</td>
                          <td className="p-2 md:p-3">
                            <Link href={`/students/${p.student_id}`} className="font-medium text-gray-900 hover:text-blue-600">
                              {p.student ? `${p.student.first_name} ${p.student.last_name}` : `Student #${p.student_id}`}
                            </Link>
                            <div className="text-[10px] text-gray-400">{p.student?.phone_number || ''}</div>
                          </td>
                          <td className="hidden md:table-cell p-3 text-gray-600">{p.group?.name || '-'}</td>
                          <td className="p-2 md:p-3 text-center text-gray-600">
                            {monthNames[p.month - 1]} {p.year}
                          </td>
                          <td className="p-2 md:p-3 text-right font-medium text-gray-900">
                            {formatSum(Number(p.amount))} so'm
                          </td>
                          <td className="p-2 md:p-3 text-center">
                            {paymentTypeBadge(p.payment_type)}
                            {p.payment_type === 'yarim_naqt_yarim_karta' && (
                              <div className="text-[9px] text-gray-500 mt-0.5">
                                N:{formatSum(Number(p.cash_amount) || 0)} | K:{formatSum(Number(p.card_amount) || 0)}
                              </div>
                            )}
                          </td>
                          <td className="p-2 md:p-3 text-right text-green-700 font-medium">
                            {p.payment_type === 'yarim_naqt_yarim_karta'
                              ? formatSum(Number(p.cash_amount) || 0)
                              : p.payment_type === 'naqt'
                                ? formatSum(Number(p.amount))
                                : '-'}
                          </td>
                          <td className="p-2 md:p-3 text-right text-purple-700 font-medium">
                            {p.payment_type === 'yarim_naqt_yarim_karta'
                              ? formatSum(Number(p.card_amount) || 0)
                              : p.payment_type === 'karta'
                                ? formatSum(Number(p.amount))
                                : '-'}
                          </td>
                          <td className="hidden lg:table-cell p-2 md:p-3 text-center text-[10px] md:text-xs text-gray-500">
                            {p.paid_at ? (() => {
                              try {
                                const dt = new Date(p.paid_at!);
                                const h = String(dt.getHours()).padStart(2, '0');
                                const min = String(dt.getMinutes()).padStart(2, '0');
                                const s = String(dt.getSeconds()).padStart(2, '0');
                                return `${dt.getDate()} ${monthNames[dt.getMonth()]} ${dt.getFullYear()} ${h}:${min}:${s}`;
                              } catch { return p.paid_at; }
                            })() : '-'}
                          </td>
                          <td className="hidden lg:table-cell p-2 md:p-3 text-left text-[10px] text-gray-500 max-w-[120px] truncate cursor-pointer hover:text-blue-600 hover:underline" onClick={() => setNoteDialog({ paymentId: p.id, note: p.note || '' })} title={p.note || ''}>
                            <div className="flex items-center gap-1">
                              <span className="truncate">{p.note || '-'}</span>
                              {<span className="text-[8px] text-blue-400 shrink-0">✎</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Dialog open={noteDialog !== null} onOpenChange={(open) => { if (!open) setNoteDialog(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>To'lov izohini tahrirlash</DialogTitle>
              <DialogDescription />
            </DialogHeader>
            <div className="space-y-3 py-2">
              <textarea
                className="w-full min-h-[80px] p-2 border border-gray-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={noteDialog?.note || ''}
                onChange={(e) => setNoteDialog(prev => prev ? { ...prev, note: e.target.value } : null)}
                placeholder="To'lov haqida izoh..."
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setNoteDialog(null)} className="h-8 text-xs">
                  Bekor qilish
                </Button>
                <Button size="sm" onClick={async () => {
                  if (!noteDialog) return;
                  try {
                    await paymentsApi.update(noteDialog.paymentId, { note: noteDialog.note || '' });
                    toast.success("Izoh saqlandi");
                    setNoteDialog(null);
                    loadData(selectedDate);
                  } catch { toast.error("Xatolik"); }
                }} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                  Saqlash
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
