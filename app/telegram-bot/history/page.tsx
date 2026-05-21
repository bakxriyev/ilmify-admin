'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Loader2, RefreshCw, CheckCircle, XCircle, Clock as ClockIcon, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';
import { telegramBotApi, getCenterIdOrThrow } from '@/api/telegramBotApi';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Kutilmoqda', color: 'bg-yellow-500' },
  sending: { label: 'Jo\'natilmoqda', color: 'bg-blue-500' },
  completed: { label: 'Yakunlandi', color: 'bg-green-500' },
  failed: { label: 'Xatolik', color: 'bg-red-500' },
};

const targetLabels: Record<string, string> = {
  all: 'Barcha studentlar',
  group: 'Guruh bo\'yicha',
  student: 'Bitta student',
};

export default function BroadcastHistoryPage() {
  const [centerId, setCenterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const cid = await getCenterIdOrThrow();
      setCenterId(cid);
      const data = await telegramBotApi.getBroadcasts(cid);
      setBroadcasts(data || []);
    } catch { toast.error('Xatolik'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Xabar tarixi
        </h2>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-1" /> Yangilash
        </Button>
      </div>

      <div className="space-y-3">
        {broadcasts.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center text-gray-400">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Hali xabarlar jo'natilmagan</p>
            </CardContent>
          </Card>
        ) : (
          broadcasts.map(b => {
            const st = statusLabels[b.status] || { label: b.status, color: 'bg-gray-500' };
            return (
              <Card key={b.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={st.color}>{st.label}</Badge>
                        <span className="text-xs text-gray-400">
                          {b.created_at ? new Date(b.created_at).toLocaleString('uz-UZ') : ''}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {targetLabels[b.target_type] || b.target_type}
                        {b.target_id ? ` (#${b.target_id})` : ''}
                      </p>
                      {b.template && (
                        <p className="text-xs text-blue-600 mt-0.5">Shablon: {b.template.name}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2 whitespace-pre-wrap">{b.message_text}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> Jami: <strong>{b.total_count}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" /> Yuborildi: <strong className="text-green-600">{b.sent_count}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-500" /> Xatolik: <strong className="text-red-600">{b.failed_count}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
