'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { paymentsApi, type GroupPaymentSummary } from '@/api/paymentsApi';
import { groupsApi, type Group } from '@/api/groupsApi';
import { academySettingsApi } from '@/api/academySettingsApi';
import { receiptApi } from '@/api/receiptApi';
import { printReceipt } from '@/lib/printReceipt';
import { ArrowLeft, Wallet, CheckCircle, XCircle, Clock, Users, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GroupPaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = Number(params.id);
  const [group, setGroup] = useState<Group | null>(null);
  const [data, setData] = useState<GroupPaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [academySettings, setAcademySettings] = useState<any>(null);
  const now = new Date();
  const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  useEffect(() => {
    academySettingsApi.get().then(setAcademySettings).catch(() => {});
    Promise.all([
      groupsApi.getById(String(groupId)),
      paymentsApi.findByGroup(groupId, Number(month), Number(year)),
    ]).then(([g, d]) => { setGroup(g); setData(d); })
      .catch(() => toast.error('Xatolik'))
      .finally(() => setLoading(false));
  }, [groupId]);

  const loadData = async (m?: string, y?: string) => {
    try {
      setLoading(true);
      const d = await paymentsApi.findByGroup(groupId, Number(m || month), Number(y || year));
      setData(d);
    } catch { toast.error('Xatolik'); }
    finally { setLoading(false); }
  };

  const getCenterLogoUrl = () => {
    try {
      const raw = localStorage.getItem('admin');
      if (!raw) return undefined;
      const a = JSON.parse(raw);
      if (a.center?.logo) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';
        return `${baseUrl}/uploads/centers/${a.center.logo}`;
      }
    } catch {}
    return undefined;
  };

  const handleMarkPaid = async (item: GroupPaymentSummary) => {
    const itemStudentId = item.student.id;
    const existing = data.find(d => d.student.id === itemStudentId)?.payment;
    try {
      let paymentId: number | undefined;
      if (existing) {
        const res = await paymentsApi.update(existing.id, { status: 'paid' });
        paymentId = existing.id;
      } else {
        const res = await paymentsApi.create({
          student_id: itemStudentId,
          group_id: groupId,
          amount: group?.monthly_price || 0,
          month: Number(month),
          year: Number(year),
          status: 'paid',
          payment_type: 'naqt',
        });
        paymentId = res.id;
      }

      toast.success("To'lov tasdiqlandi");

      const adminRaw = typeof window !== 'undefined' ? localStorage.getItem('admin') : '';
      let adminName = 'Admin';
      try { const a = JSON.parse(adminRaw || '{}'); adminName = a.full_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Admin'; } catch {}

      const settings = academySettings || {};
      const paidAtStr = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      printReceipt({
        receiptNumber: undefined,
        academyName: settings.academy_name || '',
        academyLogo: getCenterLogoUrl() || settings.academy_logo || undefined,
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
        studentPassword: item.student.password || '',
        groupName: group?.name || '',
        paidMonth: monthNames[Number(month) - 1],
        paidYear: String(year),
        paidAt: paidAtStr,
        paymentType: 'Naqd',
        amount: group?.monthly_price || 0,
        adminName,
        receiptWidth: settings.receipt_width || 320,
        fontSize: settings.receipt_font_size || 13,
      });

      if (paymentId) {
        receiptApi.print({ payment_id: paymentId }).catch(() => {});
      }

      loadData();
    } catch { toast.error('Xatolik yuz berdi'); }
  };

  const handlePrintReceipt = (item: GroupPaymentSummary) => {
    const adminRaw = typeof window !== 'undefined' ? localStorage.getItem('admin') : '';
    let adminName = 'Admin';
    try { const a = JSON.parse(adminRaw || '{}'); adminName = a.full_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Admin'; } catch {}

    const settings = academySettings || {};
    const paidAtStr = item.payment?.paid_at
      ? new Date(item.payment.paid_at).toLocaleDateString('uz-UZ')
      : `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}`;

    printReceipt({
      receiptNumber: undefined,
      academyName: settings.academy_name || '',
      academyLogo: getCenterLogoUrl() || settings.academy_logo || undefined,
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
      studentPassword: item.student.password || '',
      groupName: group?.name || '',
      paidMonth: monthNames[Number(month) - 1],
      paidYear: String(year),
      paidAt: paidAtStr,
      paymentType: item.payment?.payment_type === 'naqt' ? 'Naqd' : item.payment?.payment_type === 'karta' ? 'Karta' : item.payment?.payment_type === 'click' ? 'Click' : item.payment?.payment_type || 'Naqd',
      amount: item.payment?.amount || group?.monthly_price || 0,
      adminName,
      receiptWidth: settings.receipt_width || 320,
      fontSize: settings.receipt_font_size || 13,
    });

    if (item.payment?.id) {
      receiptApi.print({ payment_id: item.payment.id }).catch(() => {});
    }
  };

  if (!group && loading) return <Layout><div className="p-6"><Skeleton className="h-8 w-48" /></div></Layout>;

  const paidCount = data.filter(d => d.status === 'paid').length;
  const unpaidCount = data.filter(d => d.status === 'unpaid').length;

  return (
    <Layout>
      <div className="space-y-6 p-6 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.push('/payments')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Orqaga
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{group?.name} - To'lovlar</h1>
              <p className="text-sm text-gray-500">
                Oylik narx: <span className="font-semibold text-gray-900">{group?.monthly_price?.toLocaleString() || 0} so'm</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={month} onValueChange={v => { setMonth(v); loadData(v, year); }}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthNames.map((name, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={v => { setYear(v); loadData(month, v); }}>
              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2024,2025,2026].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-lg"><Users className="h-5 w-5 text-blue-600" /></div>
              <div><p className="text-xs text-gray-500">Jami studentlar</p><p className="text-lg font-bold text-gray-900">{data.length}</p></div>
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
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle>Studentlar to'lovlari - {monthNames[Number(month) - 1]} {year}</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-gray-600">#</th>
                      <th className="text-left p-3 text-gray-600">Student</th>
                      <th className="text-left p-3 text-gray-600">Telefon</th>
                      <th className="text-right p-3 text-gray-600">Summa</th>
                      <th className="text-center p-3 text-gray-600">Holat</th>
                      <th className="text-center p-3 text-gray-600">To'lov turi</th>
                      <th className="text-center p-3 text-gray-600">To'langan sana</th>
                      <th className="text-right p-3 text-gray-600">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, idx) => (
                      <tr key={item.student.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 text-gray-400">{idx + 1}</td>
                        <td className="p-3">
                          <Link href={`/payments/students/${item.student.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                            {item.student.first_name} {item.student.last_name}
                          </Link>
                        </td>
                        <td className="p-3 text-gray-600">{item.student.phone_number}</td>
                        <td className="p-3 text-right font-medium text-gray-900">
                          {item.payment?.amount?.toLocaleString() || group?.monthly_price?.toLocaleString() || 0} so'm
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={item.status === 'paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}>
                            {item.status === 'paid' ? "To'langan" : "To'lanmagan"}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          {(() => {
                            const pt = item.payment?.payment_type;
                            const map: any = { naqt: 'Naqd', karta: 'Karta', click: 'Click' };
                            const label = pt ? (map[pt] || pt) : '-';
                            const cls = pt === 'naqt' ? 'text-green-600 bg-green-50 border-green-200' : pt === 'karta' ? 'text-purple-600 bg-purple-50 border-purple-200' : pt === 'click' ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-gray-400';
                            return pt ? (
                              <Badge className={`${cls} text-xs px-1.5 py-0.5 border`}>{label}</Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            );
                          })()}
                        </td>
                        <td className="p-3 text-center text-gray-500">{item.payment?.paid_at || '-'}</td>
                        <td className="p-3 text-right">
                          {item.status !== 'paid' ? (
                            <Button size="sm" onClick={() => handleMarkPaid(item)} className="bg-green-600 hover:bg-green-700 text-white h-8">
                              <CheckCircle className="h-3.5 w-3.5 mr-1" /> To'landi
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handlePrintReceipt(item)} className="h-8 text-xs">
                              <Printer className="h-3.5 w-3.5 mr-1" /> Chek
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
