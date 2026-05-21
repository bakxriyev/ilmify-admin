'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users as UsersIcon, Loader2, RefreshCw, Phone, User, Search, Trash2, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { telegramBotApi, getCenterIdOrThrow } from '@/api/telegramBotApi';

export default function UsersPage() {
  const [centerId, setCenterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const cid = await getCenterIdOrThrow();
      setCenterId(cid);
      const data = await telegramBotApi.getChats(cid, search);
      setUsers(data || []);
    } catch { toast.error('Xatolik'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (chatId: number) => {
    if (!centerId) return;
    if (!confirm('Bu foydalanuvchini o\'chirasizmi?')) return;
    setDeletingId(chatId);
    try {
      await telegramBotApi.deleteChat(centerId, chatId);
      toast.success('Foydalanuvchi o\'chirildi');
      load();
    } catch { toast.error('Xatolik'); }
    finally { setDeletingId(null); }
  };

  const handleDeleteAll = async () => {
    if (!centerId) return;
    setDeletingAll(true);
    try {
      const res = await telegramBotApi.deleteAllChats(centerId);
      toast.success(`${res.deleted} ta foydalanuvchi o'chirildi`);
      setShowDeleteAll(false);
      load();
    } catch { toast.error('Xatolik'); }
    finally { setDeletingAll(false); }
  };

  const displayName = (u: any): string => {
    if (u.student_name) return u.student_name;
    return [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Noma\'lum';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-blue-600" />
          Bot foydalanuvchilari
          {users.length > 0 && (
            <Badge className="bg-blue-500 text-white ml-2">{users.length}</Badge>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {users.length > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteAll(true)}>
              <Trash2 className="h-4 w-4 mr-1" /> Hammasini o'chirish
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Yangilash
          </Button>
        </div>
      </div>

      <Input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Ism, familiya, telefon raqam yoki username bo'yicha qidirish..."
      />

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : users.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center text-gray-400">
            <UsersIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Botga hali hech kim ulanmagan</p>
            <p className="text-sm mt-1">Studentlar botga /start bosganda avtomatik qo'shiladi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <Card key={u.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {displayName(u)}
                      </p>
                      {u.student_name && (
                        <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                          Student
                        </Badge>
                      )}
                      <Badge className={u.is_active ? 'bg-green-500' : 'bg-gray-400'}>
                        {u.is_active ? 'Faol' : 'Blok'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                      {u.student_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {u.student_phone}
                        </span>
                      )}
                      {!u.student_name && u.phone_number && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {u.phone_number}
                        </span>
                      )}
                      {u.student_id && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> Student ID: {u.student_id}
                        </span>
                      )}
                      {u.username && (
                        <span className="text-gray-400">@{u.username}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400 hidden sm:inline">ID: {u.chat_id}</span>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => handleDelete(u.chat_id)}
                      disabled={deletingId === u.chat_id}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingId === u.chat_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDeleteAll} onOpenChange={setShowDeleteAll}>
        <DialogContent className="bg-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Barcha foydalanuvchilarni o'chirish
            </DialogTitle>
            <DialogDescription>
              {users.length} ta foydalanuvchi va ularning barcha xabarlari o'chiriladi. Bu amalni qaytarib bo'lmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteAll(false)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={handleDeleteAll} disabled={deletingAll}>
              {deletingAll && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ha, o'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
