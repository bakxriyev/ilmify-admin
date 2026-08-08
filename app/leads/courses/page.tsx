'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { coursesApi, type Course } from '@/api/coursesApi';
import { GraduationCap, Plus, Trash2, BookOpen, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await coursesApi.getAll();
      setCourses(data);
    } catch { toast.error('Kurslarni yuklashda xatolik'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) { toast.error('Kurs nomini kiriting'); return; }
    try {
      setCreating(true);
      await coursesApi.create({ name });
      toast.success(`"${name}" kursi yaratildi`);
      setNewName('');
      loadData();
    } catch (err: unknown) {
      const message = (err && typeof err === 'object' && 'response' in err && (err as { response?: { data?: { message?: string } } }).response?.data?.message) || 'Xatolik';
      toast.error(message);
    }
    finally { setCreating(false); }
  };

  const handleDelete = async (c: Course) => {
    if (!confirm(`"${c.name}" kursini o'chirasizmi?`)) return;
    try {
      await coursesApi.remove(c.id);
      toast.success("Kurs o'chirildi");
      loadData();
    } catch { toast.error('Xatolik'); }
  };

  const filtered = courses.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="min-h-full w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <GraduationCap className="h-5 w-5 text-white" />
                </span>
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Kurslar</span>
              </h1>
              <p className="text-gray-500 mt-1.5 text-base">Kurslarni boshqarish — yaratilgan kurslar landing sahifada chiqadi</p>
            </div>
            <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full">
              Jami: {courses.length} ta kurs
            </span>
          </div>

          <Card className="border border-gray-200/60 shadow-sm rounded-2xl overflow-hidden mb-6">
            <CardContent className="p-5">
              <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                  <Input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Yangi kurs nomini kiriting... (masalan: Ingliz tili)"
                    className="rounded-xl h-11 pl-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <Button type="submit" disabled={creating}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md shadow-indigo-500/25 h-11 px-6">
                  <Plus className="h-4 w-4 mr-2" /> {creating ? 'Yaratilmoqda...' : 'Kurs qo\'shish'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mb-4 relative max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Kurs qidirish..." className="pl-9 rounded-xl h-10 border-gray-200" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="border border-gray-200/60 shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-4 space-y-2.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                  <GraduationCap className="h-8 w-8 text-indigo-300" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-1">Kurslar mavjud emas</p>
                <p className="text-gray-500 text-sm">Yuqorida kurs nomini yozib qo&apos;shing — darhol landing sahifada chiqadi</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((c, i) => (
                <Card key={c.id} className="group relative border border-gray-200/60 shadow-sm rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md" style={{ animationDelay: `${i * 0.05}s`, animation: 'fadeUpFast 0.4s ease both' }}>
                  <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <BookOpen className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{c.name}</p>
                        <p className="text-[11px] text-gray-400">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('uz-UZ') : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c)}
                        className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes fadeUpFast {
              from { opacity: 0; transform: translateY(10px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          ` }} />
        </div>
      </div>
    </Layout>
  );
}