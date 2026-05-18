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
import { ArrowLeft, Wallet, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GroupPaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = Number(params.id);
  const [group, setGroup] = useState<Group | null>(null);
  const [data, setData] = useState<GroupPaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  useEffect(() => {
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

  const handleMarkPaid = async (studentId: number) => {
    const existing = data.find(d => d.student.id === studentId)?.payment;
    if (existing) {
      await paymentsApi.update(existing.id, { status: 'paid' });
    } else {
      await paymentsApi.create({
        student_id: studentId,
        group_id: groupId,
        amount: group?.monthly_price || 0,
        month: Number(month),
        year: Number(year),
        status: 'paid',
      });
    }
    toast.success("To'lov tasdiqlandi");
    loadData();
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
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <SelectItem key={m} value={String(m)}>{m}-oy</SelectItem>
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
          <CardHeader><CardTitle>Studentlar to'lovlari - {month}-oy / {year}</CardTitle></CardHeader>
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
                        <td className="p-3 text-center text-gray-500">{item.payment?.paid_at || '-'}</td>
                        <td className="p-3 text-right">
                          {item.status !== 'paid' && (
                            <Button size="sm" onClick={() => handleMarkPaid(item.student.id)} className="bg-green-600 hover:bg-green-700 text-white h-8">
                              <CheckCircle className="h-3.5 w-3.5 mr-1" /> To'landi
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
