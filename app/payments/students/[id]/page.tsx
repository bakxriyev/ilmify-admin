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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { paymentsApi, type Payment } from '@/api/paymentsApi';
import { ArrowLeft, Wallet, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';

export default function StudentPaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = Number(params.id);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDialog, setNoteDialog] = useState<string | null>(null);
  const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

  useEffect(() => {
    paymentsApi.findByStudent(studentId).then(setPayments).catch(() => {}).finally(() => setLoading(false));
  }, [studentId]);

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalUnpaid = payments.filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);

  return (
    <Layout>
      <div className="space-y-6 p-6 w-full">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Orqaga
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-lg"><Wallet className="h-5 w-5 text-blue-600" /></div>
              <div><p className="text-xs text-gray-500">Jami to'lovlar</p><p className="text-lg font-bold text-gray-900">{payments.length} ta</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-green-50 rounded-lg"><DollarSign className="h-5 w-5 text-green-600" /></div>
              <div><p className="text-xs text-gray-500">To'langan</p><p className="text-lg font-bold text-green-600">{totalPaid.toLocaleString()} so'm</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-red-50 rounded-lg"><DollarSign className="h-5 w-5 text-red-600" /></div>
              <div><p className="text-xs text-gray-500">Qarzdorlik</p><p className="text-lg font-bold text-red-600">{totalUnpaid.toLocaleString()} so'm</p></div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle>To'lov tarixi</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">To'lovlar mavjud emas</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-gray-600">Guruh</th>
                      <th className="text-left p-3 text-gray-600">Oy</th>
                      <th className="text-right p-3 text-gray-600">Summa</th>
                      <th className="text-center p-3 text-gray-600">Holat</th>
                      <th className="text-center p-3 text-gray-600">To'lov turi</th>
                      <th className="text-center p-3 text-gray-600">To'langan sana</th>
                      <th className="text-left p-3 text-gray-600">Izoh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 text-gray-900 font-medium">{p.group?.name}</td>
                        <td className="p-3 text-gray-600">{monthNames[p.month - 1]} {p.year}</td>
                        <td className="p-3 text-right text-gray-900 font-medium">{p.amount.toLocaleString()} so'm</td>
                        <td className="p-3 text-center">
                          <Badge className={p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                            {p.status === 'paid' ? "To'langan" : p.status === 'partial' ? 'Qisman' : "To'lanmagan"}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          {(() => {
                            const pt = p.payment_type;
                            const map: any = { naqt: 'Naqt', karta: 'Karta', yarim_naqt_yarim_karta: 'Yarim naqt/karta' };
                            const label = pt ? (map[pt] || pt) : '-';
                            let cls = 'text-gray-400';
                            if (pt === 'naqt') cls = 'text-green-600 bg-green-50 border-green-200';
                            else if (pt === 'karta') cls = 'text-purple-600 bg-purple-50 border-purple-200';
                            else if (pt === 'yarim_naqt_yarim_karta') cls = 'text-orange-600 bg-orange-50 border-orange-200';
                            return pt ? (
                              <div>
                                <Badge className={`${cls} text-xs px-1.5 py-0.5 border`}>{label}</Badge>
                                {pt === 'yarim_naqt_yarim_karta' && p.cash_amount != null && p.card_amount != null && (
                                  <div className="text-[9px] text-gray-500 mt-0.5">
                                    Naqt: {Number(p.cash_amount).toLocaleString()} | Karta: {Number(p.card_amount).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            );
                          })()}
                        </td>
                        <td className="p-3 text-center text-gray-500">{p.paid_at || '-'}</td>
                        <td className="p-3 text-gray-500 cursor-pointer hover:text-blue-600 hover:underline" onClick={() => p.note && setNoteDialog(p.note)} title={p.note || ''}>{p.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={noteDialog !== null} onOpenChange={(open) => { if (!open) setNoteDialog(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>To'lov izohi</DialogTitle>
              <DialogDescription />
            </DialogHeader>
            <div className="p-2 max-h-60 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap break-words">
              {noteDialog || '-'}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
