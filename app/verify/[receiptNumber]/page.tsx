'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, XCircle, Printer, Clock, AlertTriangle, Building2, User, CalendarDays, ReceiptIcon } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface VerifyData {
  valid: boolean;
  receipt_number: string;
  status: string;
  amount: number;
  discount: number;
  penalty: number;
  total: number;
  printed_at: string | null;
  created_at: string;
  student: { name: string; phone: string } | null;
  group: string | null;
  payment_type: string | null;
  paid_at: string | null;
}

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  printed: { label: 'Haqiqiy', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle },
  pending: { label: 'Kutilmoqda', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock },
  failed: { label: 'Bekor qilingan', color: 'text-red-600 bg-red-50 border-red-200', icon: XCircle },
  reprinted: { label: 'Qayta chop etilgan', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Printer },
};

const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

function formatDate(d: string) {
  try {
    const dt = new Date(d);
    return `${dt.getDate()} ${monthNames[dt.getMonth()]} ${dt.getFullYear()}`;
  } catch { return d; }
}

function formatSum(n: number) {
  return Math.floor(n).toLocaleString() + " so'm";
}

export default function VerifyPage() {
  const params = useParams();
  const receiptNumber = params.receiptNumber as string;
  const [data, setData] = useState<VerifyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!receiptNumber) return;
    fetch(`${API_BASE}/verify/${receiptNumber}`)
      .then(res => {
        if (!res.ok) throw new Error('Chek topilmadi');
        return res.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [receiptNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="h-3 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8 max-w-md w-full text-center">
          <XCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Chek topilmadi</h1>
          <p className="text-gray-500 text-sm mb-1">"{receiptNumber}" raqamli chek mavjud emas.</p>
          <p className="text-gray-400 text-xs">Agar muammo bo'lsa, o'quv markaziga murojaat qiling.</p>
        </div>
      </div>
    );
  }

  const statusInfo = statusMap[data.status] || statusMap.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-center">
          <ReceiptIcon className="h-10 w-10 mx-auto text-white/80 mb-2" />
          <h1 className="text-lg font-bold text-white">Chekni tekshirish</h1>
          <p className="text-blue-100 text-sm mt-0.5">{data.receipt_number}</p>
        </div>

        <div className="p-5 space-y-4">
          <div className={`flex items-center justify-center gap-2 p-3 rounded-xl border ${statusInfo.color}`}>
            <StatusIcon className="h-5 w-5" />
            <span className="font-semibold text-sm">{statusInfo.label}</span>
          </div>

          <div className="space-y-3">
            {data.student && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <User className="h-5 w-5 text-gray-400 shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{data.student.name}</p>
                  <p className="text-xs text-gray-500">{data.student.phone}</p>
                </div>
              </div>
            )}
            {data.group && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Building2 className="h-5 w-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">{data.group}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <CalendarDays className="h-5 w-5 text-gray-400 shrink-0" />
              <div>
                <p className="text-sm text-gray-700">{formatDate(data.created_at)}</p>
                {data.paid_at && (
                  <p className="text-xs text-gray-500">To'lov sanasi: {formatDate(data.paid_at)}</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">To'lov summasi</span>
              <span className="font-medium text-gray-900">{formatSum(data.amount)}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Chegirma</span>
                <span className="font-medium text-green-600">-{formatSum(data.discount)}</span>
              </div>
            )}
            {data.penalty > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Penya</span>
                <span className="font-medium text-red-600">+{formatSum(data.penalty)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
              <span className="font-semibold text-gray-900">Jami</span>
              <span className="font-bold text-lg text-gray-900">{formatSum(data.total)}</span>
            </div>
          </div>

          {data.printed_at && (
            <p className="text-center text-xs text-gray-400">
              Chop etilgan: {formatDate(data.printed_at)}
              {data.payment_type ? ` | ${data.payment_type}` : ''}
            </p>
          )}
        </div>

        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Ushbu chek {data.student?.name ? `${data.student.name} tomonidan ` : ''}
            Ilmify tizimi orqali rasmiylashtirilgan.
          </p>
        </div>
      </div>
    </div>
  );
}
