'use client';

import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { leadSourcesApi, type LeadSource } from '@/api/leadSourcesApi';
import { levelsApi } from '@/api/levelsApi';
import { educationCentersApi } from '@/api/educationCentersApi';
import {
  Link, Plus, Trash2, Copy, Check, Globe,
  Search, ExternalLink, Sparkles, Zap, ChevronDown, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';

const InstagramIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
    <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.8" fill="none" />
    <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
    <defs>
      <linearGradient id="ig-grad" x1="2" y1="2" x2="22" y2="22">
        <stop stopColor="#FED373" /><stop offset="0.3" stopColor="#F15245" /><stop offset="0.6" stopColor="#D92B7B" /><stop offset="1" stopColor="#9F2EE6" />
      </linearGradient>
    </defs>
  </svg>
);

const TelegramIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#2AABEE" />
    <path d="M17.2 7.2L5.8 11.6C5.2 11.8 5.2 12.4 5.7 12.6L8.6 13.5L10.3 16.2C10.4 16.4 10.7 16.4 10.9 16.2L12.3 14.7C12.5 14.5 12.8 14.5 13 14.7L16.5 17.5C16.8 17.7 17.2 17.5 17.2 17.1L18.7 8.1C18.7 7.6 18.2 7.3 17.7 7.5L17.2 7.2Z" fill="white" />
  </svg>
);

const TikTokIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="black" />
    <path d="M16.5 7.8C15.5 7.2 14.8 6.1 14.8 4.8H12.1V14.3C12.1 15.5 11.1 16.5 9.9 16.5C8.7 16.5 7.7 15.5 7.7 14.3C7.7 13.1 8.7 12.1 9.9 12.1V9.4C7.2 9.4 5 11.6 5 14.3C5 17 7.2 19.2 9.9 19.2C12.6 19.2 14.8 17 14.8 14.3V9.8C15.7 10.4 16.8 10.8 18 10.8V8.1C17.4 8.1 16.9 7.9 16.5 7.8Z" fill="white" />
  </svg>
);

const FacebookIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path d="M15.5 7.8H13.8C13.2 7.8 12.5 8.5 12.5 9.3V11H15L14.5 14H12.5V20.2H9.5V14H8V11H9.5V9.3C9.5 7.2 11.2 5.5 13.3 5.5H15.5V7.8Z" fill="white" />
  </svg>
);

const websiteColors: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  instagram:  { color: '#E1306C', bg: 'linear-gradient(135deg, #FED373, #F15245, #D92B7B, #9F2EE6)', border: '#E1306C30', glow: 'rgba(225,48,108,0.15)' },
  telegram:   { color: '#2AABEE', bg: '#2AABEE', border: '#2AABEE30', glow: 'rgba(42,171,238,0.15)' },
  tiktok:     { color: '#111111', bg: '#111111', border: '#11111130', glow: 'rgba(0,0,0,0.1)' },
  website:    { color: '#7C3AED', bg: 'linear-gradient(135deg, #7C3AED, #A855F7)', border: '#7C3AED30', glow: 'rgba(124,58,237,0.15)' },
  facebook:   { color: '#1877F2', bg: '#1877F2', border: '#1877F230', glow: 'rgba(24,119,242,0.15)' },
};

const platformNames: Record<string, string> = {
  instagram: 'Instagram', telegram: 'Telegram', tiktok: 'TikTok', website: 'Web sayt', facebook: 'Facebook',
};

function PlatformIconComponent({ platform, size = 26 }: { platform: string; size?: number }) {
  switch (platform) {
    case 'instagram': return <InstagramIcon size={size} />;
    case 'telegram': return <TelegramIcon size={size} />;
    case 'tiktok': return <TikTokIcon size={size} />;
    case 'facebook': return <FacebookIcon size={size} />;
    default: return <div style={{ width: size, height: size, borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Globe style={{ width: size * 0.6, height: size * 0.6, color: 'white' }} /></div>;
  }
}

export default function LeadSourcesPage() {
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', platform: 'instagram', code: '', courses: '', comment: '' });
  const [copied, setCopied] = useState<number | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [centerName, setCenterName] = useState<string>('');
  const [centerLogo, setCenterLogo] = useState<string>('');
  const [levels, setLevels] = useState<any[]>([]);
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [searchLevel, setSearchLevel] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowLevelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sourcesData, tokenData, levelsData] = await Promise.all([
        leadSourcesApi.getAll(),
        educationCentersApi.getMyPublicToken().catch(() => null),
        levelsApi.getAll({ limit: 100 }).catch(() => ({ data: [] })),
      ]);
      setSources(sourcesData);
      const tk = tokenData?.token || null;
      setPublicToken(tk);
      if (!tk) toast.error('Markaz tokeni olinmadi. Linklarda token bo\'lmaydi.');
      setLevels(levelsData?.data || []);

      try {
        const adminRaw = localStorage.getItem('admin');
        if (adminRaw) {
          const admin = JSON.parse(adminRaw);
          if (admin.center) {
            setCenterName(admin.center.name || '');
            setCenterLogo(admin.center.logo || '');
          } else if (admin.center_id) {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/education-centers/${admin.center_id}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
              const c = await res.json();
              setCenterName(c.name || '');
              setCenterLogo(c.logo || '');
            }
          }
        }
      } catch {}
    } catch { toast.error('Xatolik'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const coursesStr = selectedLevels.join(',');
      await leadSourcesApi.create({
        name: form.name,
        platform: form.platform,
        code: form.code,
        comment: form.comment || undefined,
        courses: coursesStr || undefined,
      });
      toast.success("Manba yaratildi");
      setShowCreate(false);
      setForm({ name: '', platform: 'instagram', code: '', courses: '', comment: '' });
      setSelectedLevels([]);
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

  const buildUrl = (code: string, courses?: string, comment?: string) => {
    const base = window.location.origin;
    const params = new URLSearchParams();
    if (publicToken) params.set('token', publicToken);
    params.set('source', code);
    if (courses) params.set('courses', courses);
    if (centerName) params.set('cname', centerName);
    if (centerLogo) params.set('clogo', centerLogo);
    if (comment) params.set('comment', comment);
    return `${base}/leads/landing?${params.toString()}`;
  };

  const copyToClipboard = (code: string, id: number, courses?: string, comment?: string) => {
    const link = buildUrl(code, courses, comment);
    navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Link nusxalandi');
  };

  const toggleLevel = (levelName: string) => {
    setSelectedLevels(prev =>
      prev.includes(levelName) ? prev.filter(l => l !== levelName) : [...prev, levelName]
    );
  };

  const filteredLevels = levels.filter(l =>
    l.name?.toLowerCase().includes(searchLevel.toLowerCase()) ||
    l.title?.toLowerCase().includes(searchLevel.toLowerCase())
  );

  return (
    <Layout>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmerS {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .source-card {
          animation: floatIn 0.5s ease both;
          transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s cubic-bezier(0.22,1,0.36,1);
        }
        .source-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.1) !important;
        }
        .source-card:nth-child(1) { animation-delay: 0s; }
        .source-card:nth-child(2) { animation-delay: 0.07s; }
        .source-card:nth-child(3) { animation-delay: 0.14s; }
        .source-card:nth-child(4) { animation-delay: 0.21s; }
        .source-card:nth-child(5) { animation-delay: 0.28s; }
        .source-card:nth-child(6) { animation-delay: 0.35s; }
        .copy-btn:active { transform: scale(0.92); }
        .gradient-text {
          background: linear-gradient(135deg, #6366F1, #8B5CF6, #A855F7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      ` }} />

      <div className="min-h-full w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Link className="h-5 w-5 text-white" />
                </span>
                Lead <span className="gradient-text">Manbalari</span>
              </h1>
              <p className="text-gray-500 mt-1.5 text-base">Instagram, Telegram, TikTok va sayt uchun aqlli havolalar yarating</p>
            </div>
            <Button
              onClick={() => setShowCreate(true)}
              className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-6 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-[0.98]"
              style={{ fontSize: '15px' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-[shimmerS_2s_ease_infinite] bg-[length:200%_100%]" />
              <Plus className="h-5 w-5 mr-2" /> Yangi manba
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="border border-gray-200/60 shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-11 h-11 rounded-xl" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-6 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-9 w-full rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sources.length === 0 ? (
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                  <Link className="h-10 w-10 text-blue-300" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-1">Manbalar mavjud emas</p>
                <p className="text-gray-500 mb-6">Lead yig'ish uchun birinchi manba yarating</p>
                <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                  <Plus className="h-4 w-4 mr-2" /> Yangi manba
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sources.map((s, idx) => {
                const colors = websiteColors[s.platform] || websiteColors.website;
                const coursesArr = s.courses ? s.courses.split(',').filter(Boolean) : [];
                return (
                  <Card
                    key={s.id}
                    className="source-card relative border border-gray-200/60 shadow-sm rounded-2xl overflow-hidden group"
                    style={{ animationDelay: `${idx * 0.07}s` }}
                  >
                    <div className="h-1 w-full transition-all duration-300 group-hover:h-1.5" style={{ background: colors.bg }} />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3.5">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105"
                            style={{ background: colors.bg, boxShadow: `0 4px 14px ${colors.glow}` }}
                          >
                            <PlatformIconComponent platform={s.platform} size={22} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-base leading-tight">{s.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500">{platformNames[s.platform] || s.platform}</span>
                              <code className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{s.code}</code>
                            </div>
                          </div>
                        </div>
                        <Badge className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                          {s.is_active ? 'Faol' : 'Nofaol'}
                        </Badge>
                      </div>

                      {coursesArr.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {coursesArr.map((c, i) => (
                            <span key={i} className="text-[11px] bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-md border border-blue-100">{c}</span>
                          ))}
                        </div>
                      )}

                      {s.comment && (
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{s.comment}</p>
                      )}

                      <div className="flex items-center gap-1.5 mt-2">
                        <code className="flex-1 text-[11px] bg-gray-50 text-gray-600 p-2.5 rounded-xl border border-gray-200 truncate font-mono leading-relaxed group-hover:bg-gray-100 transition-colors">
                          {buildUrl(s.code, s.courses, s.comment)}
                        </code>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(s.code, s.id, s.courses, s.comment)}
                            className={`copy-btn h-8 w-8 p-0 rounded-lg ${copied === s.id ? 'text-emerald-600 bg-emerald-50' : 'text-blue-600 hover:bg-blue-50'}`}>
                            {copied === s.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { window.open(buildUrl(s.code, s.courses, s.comment), '_blank'); }}
                            className="copy-btn h-8 w-8 p-0 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}
                            className="copy-btn h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-white max-w-lg rounded-2xl shadow-2xl border-0 overflow-hidden p-0">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" /> Yangi manba yaratish
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                Lead yig'ish uchun platforma va kurslarni tanlang
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Platforma</Label>
                <div className="grid grid-cols-5 gap-2">
                  {['instagram', 'telegram', 'tiktok', 'website', 'facebook'].map(p => (
                    <button key={p} type="button" onClick={() => setForm({ ...form, platform: p })}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all duration-200 ${form.platform === p ? 'border-blue-500 bg-blue-50 shadow-md scale-105' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                      <PlatformIconComponent platform={p} size={20} />
                      <span className="text-[9px] font-semibold text-gray-600">{platformNames[p]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nomi <span className="text-red-500">*</span></Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Masalan: Instagram reklama" className="rounded-xl h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500" required />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Kod (unique) <span className="text-red-500">*</span></Label>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                  placeholder="masalan: insta-ad-1" className="rounded-xl h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 font-mono text-sm" required />
              </div>

              <div className="space-y-1.5" ref={dropdownRef}>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Kurslar</Label>
                <div className="relative">
                  <div onClick={() => setShowLevelDropdown(!showLevelDropdown)}
                    className="w-full min-h-[42px] flex items-center flex-wrap gap-1.5 p-2 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition-colors bg-white">
                    {selectedLevels.length === 0 ? (
                      <span className="text-sm text-gray-400 px-2">Kurslarni tanlang...</span>
                    ) : (
                      selectedLevels.map(name => (
                        <span key={name} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-lg border border-blue-200">
                          {name}
                          <button type="button" onClick={(e) => { e.stopPropagation(); toggleLevel(name); }} className="hover:text-red-500 transition-colors"><X className="h-3 w-3" /></button>
                        </span>
                      ))
                    )}
                    <ChevronDown className={`h-4 w-4 text-gray-400 ml-auto transition-transform shrink-0 ${showLevelDropdown ? 'rotate-180' : ''}`} />
                  </div>
                  {showLevelDropdown && (
                    <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-hidden">
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                          <Input value={searchLevel} onChange={e => setSearchLevel(e.target.value)}
                            placeholder="Qidirish..." className="pl-8 h-8 text-xs rounded-lg border-gray-200" />
                        </div>
                      </div>
                      <div className="max-h-36 overflow-y-auto p-1">
                        {filteredLevels.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-4">Kurslar topilmadi</p>
                        ) : (
                          filteredLevels.map(level => (
                            <div key={level.id} onClick={() => toggleLevel(level.name || level.title)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${selectedLevels.includes(level.name || level.title) ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}>
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selectedLevels.includes(level.name || level.title) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                {selectedLevels.includes(level.name || level.title) && <Check className="h-2.5 w-2.5 text-white" />}
                              </div>
                              <span className="truncate">{level.name || level.title}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Izoh</Label>
                <Input value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })}
                  placeholder="Manba haqida qo'shimcha ma'lumot..." className="rounded-xl h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500" />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setSelectedLevels([]); }} className="rounded-xl border-gray-200 hover:bg-gray-50">
                  Bekor qilish
                </Button>
                <Button type="submit" className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md shadow-blue-500/25">
                  <Zap className="h-4 w-4 mr-1.5" /> Yaratish
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
