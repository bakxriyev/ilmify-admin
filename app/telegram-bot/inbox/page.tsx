'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Loader2, User, RefreshCw, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';
import { telegramBotApi, getCenterIdOrThrow } from '@/api/telegramBotApi';

export default function InboxPage() {
  const [centerId, setCenterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<number | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const cid = await getCenterIdOrThrow();
      setCenterId(cid);
      const data = await telegramBotApi.getInbox(cid, search);
      setConversations(data || []);
    } catch { toast.error('Xatolik'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleReply = async (chatId: number) => {
    if (!replyText.trim() || !centerId) return;
    setSending(chatId);
    try {
      await telegramBotApi.sendReply(centerId, chatId, replyText.trim());
      toast.success('Javob yuborildi');
      setReplyText('');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Xatolik');
    } finally { setSending(null); }
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 rounded-xl" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          Botga kelgan xabarlar
        </h2>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-1" /> Yangilash
        </Button>
      </div>

      <div className="space-y-3">
        {conversations.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center text-gray-400">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Hali xabarlar mavjud emas</p>
            </CardContent>
          </Card>
        ) : (
          conversations.map(conv => (
            <Card key={conv.chat_id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between cursor-pointer"
                  onClick={() => setExpanded(expanded === conv.chat_id ? null : conv.chat_id)}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {conv.user ? `${conv.user.first_name || ''} ${conv.user.last_name || ''}`.trim() || 'Foydalanuvchi' : 'Noma\'lum'}
                        </p>
                        {conv.unread && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {conv.last_message_at ? new Date(conv.last_message_at).toLocaleString('uz-UZ') : ''}
                      </p>
                    </div>
                  </div>
                  <div className="ml-2">
                    {expanded === conv.chat_id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {expanded === conv.chat_id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {conv.replies && conv.replies.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase">Bot javoblari:</p>
                        {conv.replies.map((r: any, i: number) => (
                          <div key={i} className="bg-blue-50 p-3 rounded-lg text-sm text-blue-900">
                            <p>{r.text}</p>
                            <p className="text-xs text-blue-500 mt-1">
                              {r.sent_at ? new Date(r.sent_at).toLocaleString('uz-UZ') : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Javob yozish..."
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(conv.chat_id); } }}
                      />
                      <Button onClick={() => handleReply(conv.chat_id)} disabled={sending === conv.chat_id}
                        className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                        {sending === conv.chat_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
