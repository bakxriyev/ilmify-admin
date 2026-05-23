'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Send, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { smsApi } from '@/api/smsApi';
import type { SmsStats } from '@/types/sms.types';

export default function SmsStatsDashboard() {
  const [stats, setStats] = useState<SmsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    smsApi.getStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!stats) return null;

  const chartData = [
    { name: 'Yuborilgan', value: stats.sent },
    { name: 'Yetkazilgan', value: stats.delivered },
    { name: 'Kutilmoqda', value: stats.pending },
    { name: 'Xato', value: stats.failed },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-blue-600" /> SMS statistika
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600"><Send className="h-4 w-4" /><span className="text-xs">Bugun</span></div>
            <p className="text-2xl font-bold">{stats.today}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600"><CheckCircle className="h-4 w-4" /><span className="text-xs">Oy</span></div>
            <p className="text-2xl font-bold">{stats.month}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600"><TrendingUp className="h-4 w-4" /><span className="text-xs">Muvaffaqiyat</span></div>
            <p className="text-2xl font-bold">{stats.total > 0 ? Math.round((stats.sent + stats.delivered) / stats.total * 100) : 0}%</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-600"><Clock className="h-4 w-4" /><span className="text-xs">Jami</span></div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
