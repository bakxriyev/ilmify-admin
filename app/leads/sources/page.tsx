'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { leadSourcesApi, type LeadSource } from '@/api/leadSourcesApi';
import { educationCentersApi } from '@/api/educationCentersApi';
import {
  Link, Plus, Trash2, Copy, Check, Globe, Instagram, MessageCircle, Youtube,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LeadSourcesPage() {
  const router = useRouter();
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', platform: 'instagram', code: '' });
  const [copied, setCopied] = useState<number | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sourcesData, tokenData] = await Promise.all([
        leadSourcesApi.getAll(),
        educationCentersApi.getMyPublicToken().catch(() => null),
      ]);
      setSources(sourcesData);
      const tk = tokenData?.token || null;
      setPublicToken(tk);
      if (!tk) toast.error('Markaz tokeni olinmadi. Linklarda token bo\'lmaydi.');
    } catch { toast.error('Xatolik'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await leadSourcesApi.create({ name: form.name, platform: form.platform, code: form.code });
      toast.success("Manba yaratildi");
      setShowCreate(false);
      setForm({ name: '', platform: 'instagram', code: '' });
      loadData();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Xatolik'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Manbani o'chirasizmi?")) return;
    try {
      await leadSourcesApi.remove(id);
      toast.success("Manba o'chirildi");
      loadData();
    } catch { toast.error('Xatolik'); }
  };

  const buildUrl = (code: string) => {
    const base = window.location.origin;
    const params = new URLSearchParams();
    if (publicToken) params.set('token', publicToken);
    params.set('source', code);
    return `${base}/leads/landing?${params.toString()}`;
  };

  const copyToClipboard = (code: string, id: number) => {
    const link = buildUrl(code);
    navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Link nusxalandi');
  };

  const platformIcons: any = {
    instagram: Instagram || Globe,
    telegram: MessageCircle || Globe,
    tiktok: Youtube || Globe,
    website: Globe,
    facebook: Globe,
  };

  const platformColors: any = {
    instagram: 'bg-pink-100 text-pink-600',
    telegram: 'bg-blue-100 text-blue-600',
    tiktok: 'bg-gray-100 text-gray-900',
    website: 'bg-purple-100 text-purple-600',
  };

  return (
    <Layout>
      <div className="space-y-6 p-6 w-full">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Link className="h-6 w-6 text-blue-600" /> Lead manbalari
            </h1>
            <p className="text-gray-500">Instagram, Telegram, TikTok va sayt uchun linklar</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Yangi manba
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
        ) : sources.length === 0 ? (
          <Card className="border-0 shadow-md"><CardContent className="text-center py-12 text-gray-500">
            <Link className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p>Manbalar mavjud emas</p>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map(s => (
              <Card key={s.id} className="border-0 shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${platformColors[s.platform] || 'bg-gray-100 text-gray-600'}`}>
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{s.name}</h3>
                        <p className="text-xs text-gray-500 capitalize">{s.platform}</p>
                      </div>
                    </div>
                    <Badge className={s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {s.is_active ? 'Faol' : 'No faol'}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="flex-1 text-xs bg-gray-50 p-2 rounded border truncate">
                      {buildUrl(s.code)}
                    </code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(s.code, s.id)} className="text-blue-600">
                      {copied === s.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader><DialogTitle>Yangi manba</DialogTitle>
          <DialogDescription>Lead keladigan platforma uchun link yarating</DialogDescription></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2"><Label>Nomi</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Masalan: Instagram reklama" required /></div>
            <div className="space-y-2"><Label>Platforma</Label>
              <select value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm">
                <option value="instagram">Instagram</option>
                <option value="telegram">Telegram</option>
                <option value="tiktok">TikTok</option>
                <option value="website">Web sayt</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>
            <div className="space-y-2"><Label>Kod (unique)</Label>
              <Input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="masalan: insta-reklama-1" required />
              <p className="text-xs text-gray-400">Link: /leads/landing?token={publicToken ? publicToken.substring(0,8)+'...' : '...'}&amp;source={form.code || 'your-code'}</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Bekor qilish</Button>
              <Button type="submit" className="bg-blue-600 text-white">Yaratish</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
