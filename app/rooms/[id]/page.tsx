'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { roomsApi } from '@/api/roomsApi';
import {
  ArrowLeft, Building, Users, Clock, Calendar, MapPin, BookOpen,
  DoorOpen, Hash, Timer,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    roomsApi.getById(id).then(setRoom).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div></Layout>;
  if (!room) return <Layout><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>Xona topilmadi</AlertDescription></Alert></Layout>;

  const groups = room.groups || [];

  // Get today's schedule
  const today = new Date().toISOString().split('T')[0];
  const todayLessons = groups.flatMap((g: any) =>
    (g.lessons || []).filter((l: any) => l.date?.startsWith?.(today))
  ).sort((a: any, b: any) => (a.start_time || a.time)?.localeCompare?.(b.start_time || b.time) || 0);

  return (
    <Layout>
      <div className="space-y-5 p-4 md:p-6 w-full">
        <Button variant="ghost" onClick={() => router.back()} className="text-gray-600">
          <ArrowLeft className="h-4 w-4 mr-2" /> Orqaga
        </Button>

        <Card className="border-0 shadow-md bg-gradient-to-r from-teal-600 to-teal-700">
          <CardContent className="p-5 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl"><Building className="h-8 w-8" /></div>
              <div>
                <h1 className="text-2xl font-bold">{room.name}</h1>
                <div className="flex flex-wrap gap-3 mt-1 text-white/80 text-sm">
                  <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> ID: {room.id}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Sig'imi: {room.capacity} o'rin</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {groups.length} ta guruh</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-teal-50 rounded-xl p-4 text-center">
            <p className="text-xs text-teal-600 font-medium">Sig'imi</p>
            <p className="text-2xl font-bold text-gray-900">{room.capacity} o'rin</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-xs text-blue-600 font-medium">Guruhlar</p>
            <p className="text-2xl font-bold text-gray-900">{groups.length} ta</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <p className="text-xs text-amber-600 font-medium">Jami darslar</p>
            <p className="text-2xl font-bold text-gray-900">{groups.reduce((s: number, g: any) => s + (g.lessons_count || 0), 0)} ta</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-xs text-green-600 font-medium">Bugungi darslar</p>
            <p className="text-2xl font-bold text-gray-900">{todayLessons.length} ta</p>
          </div>
        </div>

        {/* Today's Schedule */}
        {todayLessons.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Timer className="h-4 w-4 text-green-600" /> Bugungi darslar ({today})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-gray-600">Vaqt</th>
                      <th className="text-left p-3 text-gray-600">Guruh</th>
                      <th className="text-center p-3 text-gray-600">O'quvchilar</th>
                      <th className="text-center p-3 text-gray-600">Bo'sh joy</th>
                      <th className="text-center p-3 text-gray-600">Hafta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayLessons.map((l: any) => {
                      const grp = groups.find((g: any) => g.id === l.group_id);
                      return (
                        <tr key={l.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span>{l.start_time?.slice(0, 5) || l.time?.slice(0, 5)}</span>
                              {l.end_time && <><span className="text-gray-400">-</span><span>{l.end_time?.slice(0, 5)}</span></>}
                            </div>
                          </td>
                          <td className="p-3">
                            <Link href={`/groups/${grp?.id || l.group_id}`} className="text-blue-600 hover:underline font-medium">
                              {grp?.name || `Guruh #${l.group_id}`}
                            </Link>
                          </td>
                          <td className="p-3 text-center font-semibold">{grp?.student_count || 0}</td>
                          <td className="p-3 text-center">
                            <span className={`font-semibold ${(grp?.available_seats || 0) <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {grp?.available_seats || room.capacity - (grp?.student_count || 0)}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className={l.parity === 'odd' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}>
                              {l.parity === 'odd' ? 'Toq' : 'Juft'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Groups using this room */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-teal-600" /> Guruhlar ({groups.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            {groups.length === 0 ? (
              <div className="text-center py-12 text-gray-500"><Building className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p>Bu xonada hali guruh yo'q</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-gray-600">Guruh</th>
                      <th className="text-center p-3 text-gray-600">O'quvchilar</th>
                      <th className="text-center p-3 text-gray-600">Bo'sh joy</th>
                      <th className="text-left p-3 text-gray-600">Keyingi dars</th>
                      <th className="text-center p-3 text-gray-600">Darslar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g: any) => (
                      <tr key={g.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">
                          <Link href={`/groups/${g.id}`} className="text-blue-600 hover:underline">{g.name}</Link>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-semibold">{g.student_count}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-gray-500">{room.capacity}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-semibold ${(g.available_seats || 0) <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {g.available_seats >= 0 ? g.available_seats : room.capacity - g.student_count}
                          </span>
                        </td>
                        <td className="p-3">
                          {g.next_lesson_date ? (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(g.next_lesson_date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })}</span>
                              <Clock className="h-3 w-3 ml-1" />
                              <span>{g.next_lesson_time}</span>
                              {g.next_lesson_end_time && <><span className="text-gray-400">-</span><span>{g.next_lesson_end_time}</span></>}
                            </div>
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="p-3 text-center text-gray-500">{g.lessons_count || 0}</td>
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
