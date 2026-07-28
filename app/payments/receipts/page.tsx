'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { receiptApi, type Receipt } from '@/api/receiptApi';
import { ReceiptIcon, RefreshCw, Printer, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const statusColors: Record<string, string> = {
  printed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  reprinted: 'bg-blue-100 text-blue-700 border-blue-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

const statusLabels: Record<string, string> = {
  printed: 'Chop etilgan',
  pending: 'Kutilmoqda',
  failed: 'Xatolik',
  reprinted: 'Qayta chop etilgan',
  cancelled: 'Bekor qilingan',
};

const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

export default function ReceiptHistoryPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async (p: number) => {
    try {
      setLoading(true);
      const data = await receiptApi.getAll(p, 20);
      setReceipts(data.rows);
      setTotalPages(data.totalPages);
      setTotal(data.count);
      setPage(data.page);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, []);

  return (
    <Layout>
      <div className="p-4 md:p-6 w-full max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl shadow-sm">
              <ReceiptIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Cheklar tarixi</h1>
              <p className="text-gray-400 text-xs mt-0.5">Jami: {total} ta chek</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => load(page)} className="text-xs h-9">
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Yangilash
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <ReceiptIcon className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">Cheklar mavjud emas</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left py-3 px-4 text-gray-400 text-[10px] font-semibold uppercase">Chek №</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-[10px] font-semibold uppercase">Student</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-[10px] font-semibold uppercase">Guruh</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-[10px] font-semibold uppercase">Oy</th>
                      <th className="text-right py-3 px-4 text-gray-400 text-[10px] font-semibold uppercase">Summa</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-[10px] font-semibold uppercase">To'lov turi</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-[10px] font-semibold uppercase">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-[10px] font-semibold uppercase">Sana</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map(r => (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-800 text-xs">{r.receipt_number}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs text-gray-900 font-medium">
                            {r.payment?.student ? `${r.payment.student.first_name} ${r.payment.student.last_name}` : '-'}
                          </div>
                          {r.payment?.student?.phone_number && (
                            <div className="text-[10px] text-gray-400">{r.payment.student.phone_number}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-gray-600">{r.payment?.group?.name || '-'}</span>
                        </td>
                        <td className="py-3 px-4">
                          {r.payment ? (
                            <span className="text-xs text-gray-600">{monthNames[(r.payment.month || 1) - 1]} {r.payment.year}</span>
                          ) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-gray-800 text-xs">{Math.floor(r.total).toLocaleString()} so'm</span>
                        </td>
                        <td className="py-3 px-4">
                          {r.payment?.payment_type ? (
                            <Badge className={`text-[10px] px-1.5 py-0.5 ${
                              r.payment.payment_type === 'naqt' ? 'bg-green-50 text-green-700 border-green-200' :
                              r.payment.payment_type === 'karta' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              r.payment.payment_type === 'click' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-gray-50 text-gray-600 border-gray-200'
                            }`}>
                              {r.payment.payment_type === 'naqt' ? 'Naqd' : r.payment.payment_type === 'karta' ? 'Karta' : r.payment.payment_type === 'click' ? 'Click' : r.payment.payment_type}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColors[r.status] || 'bg-gray-100 text-gray-600'}`}>
                            {statusLabels[r.status] || r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-gray-500">
                            {r.created_at ? (() => { const d = new Date(r.created_at); return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`; })() : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400">Sahifa {page} / {totalPages}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => load(page - 1)} disabled={page <= 1} className="h-8 text-xs">
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Oldingi
                </Button>
                <Button variant="outline" size="sm" onClick={() => load(page + 1)} disabled={page >= totalPages} className="h-8 text-xs">
                  Keyingi <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
