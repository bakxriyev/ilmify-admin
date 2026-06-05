'use client';

import { useState } from 'react';
import { Clock, Smartphone, MessageSquare, CheckCircle, XCircle, Loader2, Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSmsLogs } from '@/hooks/useSms';
import type { SmsLog } from '@/types/sms.types';

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Kutilmoqda', className: 'bg-yellow-100 text-yellow-800' },
  sent: { label: 'Yuborilgan', className: 'bg-blue-100 text-blue-800' },
  delivered: { label: 'Yetkazilgan', className: 'bg-green-100 text-green-800' },
  failed: { label: 'Xato', className: 'bg-red-100 text-red-800' },
};

export default function SmsLogTable() {
  const [filters, setFilters] = useState<{ start_date?: string; end_date?: string; status?: string; page?: number }>({ page: 1 });
  const { data, loading, refetch } = useSmsLogs(filters);

  const exportCsv = () => {
    if (!data?.data.length) return;
    const headers = ['Sana', 'Telefon', 'Xabar', 'Holat', 'Eskiz ID'];
    const rows = data.data.map((l: SmsLog) => [
      new Date(l.created_at).toLocaleString('uz-UZ'),
      l.phone,
      `"${l.message.replace(/"/g, '""')}"`,
      l.status,
      l.eskiz_message_id || '',
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `sms_logs_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" /> SMS tarixi
            {data && <Badge className="bg-blue-500">{data.total}</Badge>}
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!data?.data.length}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
              <Loader2 className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Yangilashh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Input type="date" value={filters.start_date || ''} onChange={e => setFilters({ ...filters, start_date: e.target.value })} className="w-40" />
          <Input type="date" value={filters.end_date || ''} onChange={e => setFilters({ ...filters, end_date: e.target.value })} className="w-40" />
          <select value={filters.status || ''} onChange={e => setFilters({ ...filters, status: e.target.value })} className="border rounded-md px-3 py-2 text-sm">
            <option value="">Barcha holat</option>
            <option value="pending">Kutilmoqda</option>
            <option value="sent">Yuborilgan</option>
            <option value="delivered">Yetkazilgan</option>
            <option value="failed">Xato</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : !data?.data.length ? (
          <p className="text-center text-gray-400 py-8">SMS tarixi yo'q</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">Sana</th>
                  <th className="pb-2 pr-4">Telefon</th>
                  <th className="pb-2 pr-4">Xabar</th>
                  <th className="pb-2 pr-4">Holat</th>
                  <th className="pb-2">Eskiz ID</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((log: SmsLog) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 pr-4 text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString('uz-UZ')}</td>
                    <td className="py-2 pr-4"><span className="flex items-center gap-1"><Smartphone className="h-3 w-3" />{log.phone}</span></td>
                    <td className="py-2 pr-4 max-w-xs truncate" title={log.message}>{log.message}</td>
                    <td className="py-2 pr-4"><Badge className={statusConfig[log.status]?.className}>{statusConfig[log.status]?.label}</Badge></td>
                    <td className="py-2 text-xs text-gray-400">{log.eskiz_message_id || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: data.total_pages }, (_, i) => i + 1).map(p => (
              <Button key={p} variant={p === (filters.page || 1) ? 'default' : 'outline'} size="sm" onClick={() => setFilters({ ...filters, page: p })}>
                {p}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
