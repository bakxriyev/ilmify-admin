'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { educationCentersApi, type EducationCenter, type CenterBranch } from '@/api/educationCentersApi';
import { tariffsApi, type Tariff } from '@/api/tariffsApi';
import {
  ArrowLeft, Building, MapPin, Phone, School,
  Plus, Trash2, Loader2, Package,
} from 'lucide-react';
import toast from 'react-hot-toast';

const featuresList = [
  { key: 'students', label: 'Talabalar' },
  { key: 'teachers', label: "O'qituvchilar" },
  { key: 'groups', label: 'Guruhlar' },
  { key: 'schedule', label: 'Dars jadvali' },
  { key: 'attendance', label: 'Davomat' },
  { key: 'payments', label: "To'lovlar" },
  { key: 'call_center', label: 'Call center' },
  { key: 'news', label: 'Yangiliklar' },
  { key: 'stories', label: 'Hikoyalar' },
  { key: 'reports', label: 'Hisobotlar' },
  { key: 'chat', label: 'Chat' },
  { key: 'notifications', label: 'Bildirishnomalar' },
];

export default function CenterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [center, setCenter] = useState<EducationCenter | null>(null);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [branches, setBranches] = useState<CenterBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', location: '', phone: '' });
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [callCenter, setCallCenter] = useState(false);
  const [tariffId, setTariffId] = useState('');
  const [tariffDuration, setTariffDuration] = useState('');
  const [changingTariff, setChangingTariff] = useState(false);

  const DURATIONS = [
    { value: 1, label: '1 oy' },
    { value: 3, label: '3 oy' },
    { value: 6, label: '6 oy' },
    { value: 12, label: '12 oy' },
  ];

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [c, b, t] = await Promise.all([
        educationCentersApi.getById(id),
        educationCentersApi.getBranches(id),
        tariffsApi.getAll(),
      ]);
      setCenter(c);
      setBranches(b);
      setTariffs(t || []);
      setFeatures(c.features || {});
      setCallCenter(c.call_center_enabled || false);
      setTariffId(c.tariff_id ? String(c.tariff_id) : '');
      setTariffDuration(c.tariff_duration ? String(c.tariff_duration) : '');
    } catch { toast.error('Xatolik'); }
    finally { setLoading(false); }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await educationCentersApi.update(id, {
        call_center_enabled: callCenter,
        features,
      });
      toast.success('Sozlamalar saqlandi');
    } catch {
      toast.error('Xatolik');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (key: string) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await educationCentersApi.addBranch(id, branchForm);
      toast.success('Filial qo\'shildi');
      setBranchForm({ name: '', location: '', phone: '' });
      setShowBranchForm(false);
      const b = await educationCentersApi.getBranches(id);
      setBranches(b);
    } catch { toast.error('Xatolik'); }
  };

  const removeBranch = async (branchId: number) => {
    if (!confirm("Filialni o'chirasizmi?")) return;
    try {
      await educationCentersApi.removeBranch(branchId);
      toast.success('Filial o\'chirildi');
      setBranches(branches.filter(b => b.id !== branchId));
    } catch { toast.error('Xatolik'); }
  };

  const fmtDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString('uz-UZ') : '—';
  const getTrialDays = () => {
    if (!center?.trial_ends_at) return null;
    const diff = new Date(center.trial_ends_at).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };
  const trialDays = getTrialDays();

  if (loading) return <div className="p-4 md:p-6"><Skeleton className="h-8 w-48" /></div>;
  if (!center) return <div className="p-4 md:p-6 text-gray-500">Markaz topilmadi</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.push('/super-admin')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Orqaga
        </Button>

        {/* Header */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-600 to-indigo-700">
          <CardContent className="p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/20 flex items-center justify-center shrink-0">
                {center.logo ? (
                  <img src={`${process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz'}/uploads/centers/${center.logo}`}
                    className="w-full h-full object-cover" alt={center.name} />
                ) : (
                  <School className="h-8 w-8" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{center.name}</h1>
                  <Badge className={center.is_active ? 'bg-green-500' : 'bg-red-500'}>
                    {center.is_active ? 'Faol' : 'Bloklangan'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-white/80 text-sm">
                  {center.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {center.location}</span>}
                  {center.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {center.phone}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tariff & Trial Info */}
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-purple-600" /> Tarif ma'lumotlari</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Joriy tarif</p>
                <p className="font-bold">{center.tariff?.name || 'BETA'}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Talaba chegarasi</p>
                <p className="font-bold">{center.tariff ? `${center.tariff.student_min}–${center.tariff.student_max}` : 'Cheksiz (BETA)'}</p>
              </div>
              {center.tariff?.name && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Tarif boshlangan</p>
                  <p className="font-bold">{fmtDate(center.tariff_started_at)}</p>
                </div>
              )}
              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">
                  {center.tariff_id ? 'Tarif tugash' : 'Sinov tugash'}
                </p>
                <p className="font-bold">
                  {center.tariff_ends_at ? fmtDate(center.tariff_ends_at) : fmtDate(center.trial_ends_at)}
                </p>
                {trialDays !== null && (
                  <p className={`text-xs font-medium mt-1 ${trialDays <= 0 ? 'text-red-600' : trialDays <= 2 ? 'text-amber-600' : 'text-blue-600'}`}>
                    {trialDays <= 0 ? 'Muddat tugagan' : `${trialDays} kun qoldi`}
                  </p>
                )}
              </div>
            </div>
            {center.tariff_id && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">To'lov</p>
                  <p className="font-bold text-green-700">{center.tariff_price ? Number(center.tariff_price).toLocaleString() + ' so\'m' : '—'}</p>
                </div>
                <div className="bg-cyan-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Muddat</p>
                  <p className="font-bold">{center.tariff_duration ? `${center.tariff_duration} oy` : '—'}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
              <Label className="shrink-0">Tarifni o'zgartirish:</Label>
              <Select value={tariffId} onValueChange={v => {
                setTariffId(v);
                setChangingTariff(true);
              }}>
                <SelectTrigger className="w-52"><SelectValue placeholder="Tarifni tanlang" /></SelectTrigger>
                <SelectContent>
                  {tariffs.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {changingTariff && (
                <>
                  <Select value={tariffDuration} onValueChange={setTariffDuration}>
                    <SelectTrigger className="w-28"><SelectValue placeholder="Muddat" /></SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map(d => (
                        <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={async () => {
                      if (!tariffDuration) { toast.error('Muddatni tanlang'); return; }
                      try {
                        await educationCentersApi.update(id, {
                          tariff_id: Number(tariffId),
                          tariff_duration: Number(tariffDuration),
                        });
                        toast.success('Tarif yangilandi');
                        setChangingTariff(false);
                        loadData();
                      } catch { toast.error('Xatolik'); }
                    }}>
                    Saqlash
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setChangingTariff(false); setTariffId(String(center?.tariff_id || '')); }}>
                    Bekor qilish
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Settings: Call Center + Features */}
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-lg">Markaz sozlamalari</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {/* Call Center Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Call markaz (Lead) tizimi</p>
                <p className="text-sm text-gray-500">Lidlarni boshqarish, qo'ng'iroqlar markazi</p>
              </div>
              <button
                type="button"
                onClick={() => setCallCenter(!callCenter)}
                className={`w-14 h-7 rounded-full transition-colors ${callCenter ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${callCenter ? 'translate-x-7' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Features Grid */}
            <div>
              <p className="font-medium text-gray-900 mb-3">Bo'limlarni boshqarish</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {featuresList.map(f => (
                  <div key={f.key}
                    onClick={() => toggleFeature(f.key)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-colors ${
                      features[f.key] !== false
                        ? 'bg-purple-50 border-purple-200 text-purple-900'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    <span className="text-sm font-medium">{f.label}</span>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      features[f.key] !== false ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                    }`}>
                      {features[f.key] !== false && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={saveSettings} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sozlamalarni saqlash
            </Button>
          </CardContent>
        </Card>

        {/* Branches */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Filiallar</CardTitle>
            <Button size="sm" onClick={() => setShowBranchForm(!showBranchForm)} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Filial qo'shish
            </Button>
          </CardHeader>
          <CardContent>
            {showBranchForm && (
              <form onSubmit={addBranch} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                <Input placeholder="Nomi" value={branchForm.name} onChange={e => setBranchForm({...branchForm, name: e.target.value})} required />
                <Input placeholder="Manzil" value={branchForm.location} onChange={e => setBranchForm({...branchForm, location: e.target.value})} />
                <Input placeholder="Telefon" value={branchForm.phone} onChange={e => setBranchForm({...branchForm, phone: e.target.value})} />
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Saqlash</Button>
              </form>
            )}
            {branches.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Filiallar mavjud emas</p>
            ) : (
              <div className="space-y-2">
                {branches.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{b.name}</p>
                      <div className="flex gap-3 text-sm text-gray-500 mt-1">
                        {b.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {b.location}</span>}
                        {b.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {b.phone}</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeBranch(b.id)} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
