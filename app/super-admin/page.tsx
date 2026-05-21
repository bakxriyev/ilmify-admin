'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import CenterStatusChecker from '@/components/CenterStatusChecker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { educationCentersApi } from '@/api/educationCentersApi';
import { tariffsApi, type Tariff } from '@/api/tariffsApi';
import {
  Plus, Building, MapPin, Phone, Power, PowerOff,
  Eye, Edit2, Trash2, RefreshCw, School, Users, GraduationCap,
  BookOpen, X, Loader2, AlertCircle, Package, BarChart3, Image,
  Calendar, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

const DURATIONS = [
  { value: 1, label: '1 oy' },
  { value: 3, label: '3 oy' },
  { value: 6, label: '6 oy' },
  { value: 12, label: '12 oy' },
];

interface FormState {
  name: string;
  location: string;
  phone: string;
  tariff_id: string;
  tariff_duration: string;
  admin_first_name: string;
  admin_last_name: string;
  admin_email: string;
  admin_phone: string;
  admin_password: string;
}

interface EditFormState {
  name: string;
  location: string;
  phone: string;
  tariff_id: string;
  tariff_duration: string;
  call_center_enabled: boolean;
  director_full_name: string;
  director_email: string;
  director_phone: string;
  director_password: string;
  logoPreview?: string;
}

const emptyForm: FormState = {
  name: '', location: '', phone: '', tariff_id: '', tariff_duration: '',
  admin_first_name: '', admin_last_name: '', admin_email: '', admin_phone: '', admin_password: '',
};

const emptyEditForm: EditFormState = {
  name: '', location: '', phone: '', tariff_id: '', tariff_duration: '1',
  call_center_enabled: false,
  director_full_name: '', director_email: '', director_phone: '', director_password: '',
};

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [centers, setCenters] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [editForm, setEditForm] = useState<EditFormState>({ ...emptyEditForm });

  const [createLogoFile, setCreateLogoFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingServerCost, setEditingServerCost] = useState(false);
  const [serverCostInput, setServerCostInput] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.replace('/super-admin/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('access_token');
      if (!token) { router.replace('/super-admin/login'); return; }
      const [c, s, t] = await Promise.all([
        educationCentersApi.getAll(),
        educationCentersApi.getStats(),
        tariffsApi.getAll(),
      ]);
      setCenters(c || []);
      setStats(s);
      setTariffs(t || []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Xatolik yuz berdi';
      setError(msg);
      if (err?.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('admin');
        router.replace('/super-admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedTariff = useMemo(() => {
    if (!form.tariff_id || form.tariff_id === '0') return null;
    return tariffs.find(t => t.id === Number(form.tariff_id)) || null;
  }, [form.tariff_id, tariffs]);

  const selectedEditTariff = useMemo(() => {
    if (!editForm.tariff_id || editForm.tariff_id === '0') return null;
    return tariffs.find(t => t.id === Number(editForm.tariff_id)) || null;
  }, [editForm.tariff_id, tariffs]);

  const calcPrice = (tariff: Tariff | null, months: string): number => {
    if (!tariff || !months) return 0;
    const m = Number(months);
    if (m === 1) return Number(tariff.price_1month);
    if (m === 3) return Number(tariff.price_3months);
    if (m === 6) return Number(tariff.price_6months);
    if (m === 12) return Number(tariff.price_12months);
    return Number(tariff.price_1month) * m;
  };

  const createPrice = useMemo(() => calcPrice(selectedTariff, form.tariff_duration), [selectedTariff, form.tariff_duration]);
  const editPrice = useMemo(() => calcPrice(selectedEditTariff, editForm.tariff_duration), [selectedEditTariff, editForm.tariff_duration]);

  const fmtPrice = (p: number) => p ? p.toLocaleString() + ' so\'m' : '—';

  const fmtDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString('uz-UZ') : '—';

  const calcEndDate = (months: string) => {
    if (!months) return null;
    const d = new Date();
    d.setMonth(d.getMonth() + Number(months));
    return d;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const created = await educationCentersApi.create({
        name: form.name,
        location: form.location || undefined,
        phone: form.phone || undefined,
        tariff_id: form.tariff_id && form.tariff_id !== '0' ? Number(form.tariff_id) : undefined,
        tariff_duration: form.tariff_duration ? Number(form.tariff_duration) : undefined,
        admin: {
          first_name: form.admin_first_name,
          last_name: form.admin_last_name,
          email: form.admin_email,
          phone_number: form.admin_phone,
          password: form.admin_password,
        },
      });
      if (createLogoFile && created?.id) {
        try {
          await educationCentersApi.uploadLogo(created.id, createLogoFile);
          toast.success('Logo yuklandi');
        } catch {
          toast.error('Markaz yaratildi, lekin logo yuklanmadi');
        }
      }
      toast.success('Markaz yaratildi');
      setShowCreate(false);
      setCreateLogoFile(null);
      setForm({ ...emptyForm });
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit) return;
    try {
      setSaving(true);
      const payload: any = {
        name: editForm.name,
        location: editForm.location || undefined,
        phone: editForm.phone || undefined,
        call_center_enabled: editForm.call_center_enabled,
      };
      if (editForm.tariff_id) payload.tariff_id = Number(editForm.tariff_id);
      if (editForm.tariff_duration) payload.tariff_duration = Number(editForm.tariff_duration);
      if (editForm.director_password) payload.director_password = editForm.director_password;
      if (editForm.director_full_name) payload.director_full_name = editForm.director_full_name;
      if (editForm.director_email) payload.director_email = editForm.director_email;
      if (editForm.director_phone) payload.director_phone = editForm.director_phone;
      await educationCentersApi.update(showEdit.id, payload);
      toast.success('Markaz yangilandi');
      setShowEdit(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (center: any) => {
    try {
      await educationCentersApi.update(center.id, { is_active: !center.is_active });
      toast.success(center.is_active ? 'Markaz bloklandi' : 'Markaz faollashtirildi');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Xatolik');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Markazni o'chirasizmi?")) return;
    try {
      await educationCentersApi.remove(id);
      toast.success("Markaz o'chirildi");
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Xatolik');
    }
  };

  const getTariffName = (c: any) => c.tariff?.name || (c.tariff_id ? 'Tarif o\'chirilgan' : 'BETA (sinov)');
  const getTrialStatus = (c: any) => {
    if (!c.trial_ends_at && c.tariff_id) return null;
    if (!c.trial_ends_at) return null;
    const now = new Date();
    const end = new Date(c.trial_ends_at);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return { label: 'Sinov tugagan', color: 'bg-red-100 text-red-700' as const };
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return { label: `Sinov: ${days} kun`, color: days <= 2 ? 'bg-yellow-100 text-yellow-700' as const : 'bg-blue-100 text-blue-700' as const };
  };
  const getTariffEndStatus = (c: any) => {
    if (!c.tariff_ends_at) return null;
    const now = new Date();
    const end = new Date(c.tariff_ends_at);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return { label: 'Muddat tugagan', color: 'bg-red-100 text-red-700' as const };
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return { label: `${days} kun qoldi`, color: days <= 7 ? 'bg-yellow-100 text-yellow-700' as const : 'bg-green-100 text-green-700' as const };
  };

  const openEditDialog = (c: any) => {
    setLogoFile(null);
    setEditForm({
      name: c.name,
      location: c.location || '',
      phone: c.phone || '',
      tariff_id: c.tariff_id ? String(c.tariff_id) : '',
      tariff_duration: c.tariff_duration ? String(c.tariff_duration) : '1',
      call_center_enabled: c.call_center_enabled || false,
      director_full_name: '',
      director_email: '',
      director_phone: '',
      director_password: '',
    });
    setShowEdit(c);
  };

  return (
    <>
      <CenterStatusChecker />
      <div className="p-4 md:p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700"><X className="h-4 w-4" /></button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Yangilash
          </Button>
        </div>

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-5 shadow-lg">
                <p className="text-sm text-blue-200 font-medium">Markazlar</p>
                <p className="text-3xl font-bold mt-1">{stats.total_centers || 0}</p>
                <p className="text-xs text-blue-300 mt-1">{stats.active_centers || 0} ta faol</p>
              </div>
              <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl p-5 shadow-lg">
                <p className="text-sm text-green-200 font-medium">O'quvchilar</p>
                <p className="text-3xl font-bold mt-1">{stats.total_students || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-xl p-5 shadow-lg">
                <p className="text-sm text-indigo-200 font-medium">O'qituvchilar</p>
                <p className="text-3xl font-bold mt-1">{stats.total_teachers || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl p-5 shadow-lg">
                <p className="text-sm text-purple-200 font-medium">Guruhlar</p>
                <p className="text-3xl font-bold mt-1">{stats.total_groups || 0}</p>
              </div>
            </div>

            {/* Moliyaviy statistika */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" /> Moliyaviy statistika
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-xl p-5 shadow-lg">
                  <p className="text-sm text-emerald-200 font-medium">Jami daromad (tariflar)</p>
                  <p className="text-2xl font-bold mt-1">{fmtPrice(stats.total_income || 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-600 to-orange-700 text-white rounded-xl p-5 shadow-lg">
                  <p className="text-sm text-orange-200 font-medium">Server xarajati</p>
                  <p className="text-2xl font-bold mt-1">{fmtPrice(stats.server_cost || 0)}</p>
                  <button
                    onClick={() => {
                      setServerCostInput(String(stats.server_cost || 0));
                      setEditingServerCost(true);
                    }}
                    className="text-xs text-orange-200 hover:text-white underline mt-1"
                  >
                    O'zgartirish
                  </button>
                </div>
                <div className={`rounded-xl p-5 shadow-lg text-white ${
                  (stats.net_profit || 0) >= 0
                    ? 'bg-gradient-to-br from-green-700 to-green-800'
                    : 'bg-gradient-to-br from-red-600 to-red-700'
                }`}>
                  <p className="text-sm opacity-80 font-medium">Sof foyda</p>
                  <p className="text-2xl font-bold mt-1">{fmtPrice(stats.net_profit || 0)}</p>
                </div>
              </div>

              {/* Tariflar bo'yicha daromad */}
              {stats.tariff_income && Object.keys(stats.tariff_income).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Tariflar bo'yicha daromad:</p>
                  <div className="space-y-2">
                    {Object.entries(stats.tariff_income as Record<string, number>)
                      .sort(([,a], [,b]) => b - a)
                      .map(([name, amount]) => (
                        <div key={name} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                          <span className="text-sm font-medium text-gray-700">{name}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                                style={{ width: `${stats.total_income > 0 ? (amount / stats.total_income) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-gray-900 w-28 text-right">{fmtPrice(amount)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Server cost modal */}
            <Dialog open={editingServerCost} onOpenChange={setEditingServerCost}>
              <DialogContent className="max-w-sm bg-white rounded-xl shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-gray-900">Server xarajati</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Label className="text-gray-700 font-medium">Oylik server xarajati (so'm)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={serverCostInput}
                    onChange={e => setServerCostInput(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <DialogFooter className="gap-2 pt-2">
                  <Button variant="outline" onClick={() => setEditingServerCost(false)} className="border-gray-300">
                    Bekor qilish
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={async () => {
                      if (!stats?.centers?.length) {
                        toast.error('Markaz topilmadi');
                        return;
                      }
                      try {
                        const firstCenterId = stats.centers[0].id;
                        await educationCentersApi.updateServerCost(firstCenterId, Number(serverCostInput) || 0);
                        toast.success('Server xarajati yangilandi');
                        setEditingServerCost(false);
                        loadData();
                      } catch (err: any) {
                        toast.error(err?.response?.data?.message || 'Xatolik');
                      }
                    }}
                  >
                    Saqlash
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        {stats?.centers && stats.centers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" /> Markazlar bo'yicha statistika
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 text-gray-600 font-medium">Markaz</th>
                    <th className="text-center p-3 text-gray-600 font-medium">Holat</th>
                    <th className="text-center p-3 text-gray-600 font-medium">Tarif</th>
                    <th className="text-center p-3 text-gray-600 font-medium">O'quvchilar</th>
                    <th className="text-center p-3 text-gray-600 font-medium">O'qituvchilar</th>
                    <th className="text-center p-3 text-gray-600 font-medium">Guruhlar</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.centers.map((c: any) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{c.name}</td>
                      <td className="p-3 text-center">
                        <Badge className={c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {c.is_active ? 'Faol' : 'Bloklangan'}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        {c.tariff ? (
                          <Badge className="bg-purple-100 text-purple-700">{c.tariff.name}</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700">BETA</Badge>
                        )}
                      </td>
                      <td className="p-3 text-center font-semibold text-blue-600">{c.students}</td>
                      <td className="p-3 text-center font-semibold text-indigo-600">{c.teachers}</td>
                      <td className="p-3 text-center font-semibold text-purple-600">{c.groups}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">O'quv markazlari</h2>
          <Button onClick={() => setShowCreate(true)} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md">
            <Plus className="h-4 w-4 mr-2" /> Yangi markaz
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
        ) : centers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
            <Building className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-lg font-medium">Markazlar mavjud emas</p>
            <p className="text-sm mt-1">Yangi o'quv markazi yaratish uchun tugmani bosing</p>
          </div>
        ) : (
          <div className="space-y-3">
            {centers.map((c) => {
              const trialStatus = getTrialStatus(c);
              const tariffEnd = getTariffEndStatus(c);
              return (
                <div key={c.id} className={`bg-white rounded-xl shadow-sm border p-5 ${!c.is_active ? 'opacity-70' : ''}`}>
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 ${c.is_active ? 'bg-purple-100' : 'bg-gray-100'} flex items-center justify-center`}>
                        {c.logo ? (
                          <img src={`${process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz'}/uploads/centers/${c.logo}`}
                            className="w-full h-full object-cover" alt={c.name} />
                        ) : (
                          <School className={`h-7 w-7 ${c.is_active ? 'text-purple-600' : 'text-gray-400'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-lg">{c.name}</h3>
                          <Badge className={c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {c.is_active ? 'Faol' : 'Bloklangan'}
                          </Badge>
                          {c.tariff ? (
                            <Badge className="bg-purple-100 text-purple-700">{c.tariff.name}</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700">BETA</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                          {c.location && <span><MapPin className="h-3.5 w-3.5 inline mr-1" />{c.location}</span>}
                          {c.phone && <span><Phone className="h-3.5 w-3.5 inline mr-1" />{c.phone}</span>}
                          <span><Users className="h-3.5 w-3.5 inline mr-1" />{c.student_count || 0} o'quvchi</span>
                          <span><GraduationCap className="h-3.5 w-3.5 inline mr-1" />{c.teacher_count || 0} o'qituvchi</span>
                          <span><BookOpen className="h-3.5 w-3.5 inline mr-1" />{c.group_count || 0} guruh</span>
                          {c.tariff_duration && (
                            <span><Calendar className="h-3.5 w-3.5 inline mr-1" />{c.tariff_duration} oy</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {trialStatus && <Badge className={trialStatus.color}>{trialStatus.label}</Badge>}
                          {tariffEnd && <Badge className={tariffEnd.color}>{tariffEnd.label}</Badge>}
                          {c.tariff && (
                            <span className="text-xs text-gray-400">
                              Cheklov: {c.tariff.student_min}–{c.tariff.student_max} talaba
                            </span>
                          )}
                          {c.tariff_price && (
                            <span className="text-xs text-gray-400">
                              To'lov: {fmtPrice(Number(c.tariff_price))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleActive(c)}
                        className={`p-2 rounded-lg transition-colors ${c.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                        title={c.is_active ? 'Bloklash' : 'Faollashtirish'}>
                        {c.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </button>
                      <button onClick={() => openEditDialog(c)}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => router.push(`/super-admin/centers/${c.id}`)}
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Yangi o'quv markaz</DialogTitle>
            <DialogDescription>Markaz va admin ma'lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <h4 className="font-semibold text-gray-800 border-b pb-2">Markaz ma'lumotlari</h4>
            <div>
              <Label className="text-gray-700 font-medium">Nomi <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-700 font-medium">Manzil</Label>
                <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="mt-1" />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Telefon</Label>
                <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Logo</Label>
              <Input type="file" accept="image/*" onChange={e => {
                const file = e.target.files?.[0];
                if (file) setCreateLogoFile(file);
              }} className="mt-1" />
              {createLogoFile && <p className="text-xs text-gray-500 mt-1">{createLogoFile.name} tanlandi</p>}
            </div>

            <h4 className="font-semibold text-gray-800 border-b pb-2">Tarif tanlash</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-700 font-medium">Tarif</Label>
                <Select value={form.tariff_id} onValueChange={v => {
                  setForm({...form, tariff_id: v, tariff_duration: ''});
                }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Tarifni tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">BETA (7 kunlik sinov)</SelectItem>
                    {tariffs.map(t => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name} ({t.student_min}–{t.student_max} talaba)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Muddat</Label>
                <Select value={form.tariff_duration} onValueChange={v => setForm({...form, tariff_duration: v})}
                  disabled={!form.tariff_id || form.tariff_id === '0'}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={form.tariff_id && form.tariff_id !== '0' ? "Muddatni tanlang" : "Avval tarifni tanlang"} /></SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map(d => (
                      <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.tariff_id && form.tariff_duration && selectedTariff && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tanlangan tarif:</span>
                  <span className="font-bold text-purple-700">{selectedTariff.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Talaba chegarasi:</span>
                  <span className="font-medium">{selectedTariff.student_min}–{selectedTariff.student_max}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Muddat:</span>
                  <span className="font-medium">{Number(form.tariff_duration)} oy</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">To'lov:</span>
                  <span className="text-lg font-bold text-green-700">{fmtPrice(createPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Boshlanish sanasi:</span>
                  <span className="font-medium text-xs text-gray-500">{fmtDate(new Date().toISOString())}</span>
                </div>
                {calcEndDate(form.tariff_duration) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tugash sanasi:</span>
                    <span className="font-medium text-xs text-gray-500">{fmtDate(calcEndDate(form.tariff_duration)!.toISOString())}</span>
                  </div>
                )}
              </div>
            )}

            {(!form.tariff_id || form.tariff_id === '0') && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-medium text-amber-800">BETA rejimi (7 kunlik sinov)</p>
                <p className="text-xs text-amber-600 mt-1">Cheklovsiz barcha imkoniyatlardan foydalanishingiz mumkin. 7 kundan keyin avtomatik bloklanadi.</p>
              </div>
            )}

            <h4 className="font-semibold text-gray-800 border-b pb-2">Admin (direktor) ma'lumotlari</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-700 font-medium">Ism <span className="text-red-500">*</span></Label>
                <Input value={form.admin_first_name} onChange={e => setForm({...form, admin_first_name: e.target.value})} required className="mt-1" />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Familiya <span className="text-red-500">*</span></Label>
                <Input value={form.admin_last_name} onChange={e => setForm({...form, admin_last_name: e.target.value})} required className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-700 font-medium">Email <span className="text-red-500">*</span></Label>
                <Input type="email" value={form.admin_email} onChange={e => setForm({...form, admin_email: e.target.value})} required className="mt-1" />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Telefon <span className="text-red-500">*</span></Label>
                <Input value={form.admin_phone} onChange={e => setForm({...form, admin_phone: e.target.value})} required className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Parol <span className="text-red-500">*</span></Label>
              <Input type="password" value={form.admin_password} onChange={e => setForm({...form, admin_password: e.target.value})} required className="mt-1" />
            </div>
            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="border-gray-300 hover:bg-gray-100">
                Bekor qilish
              </Button>
              <Button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md min-w-[120px]">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Yaratilmoqda...</> : 'Yaratish'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={!!showEdit} onOpenChange={v => !v && setShowEdit(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Markazni tahrirlash</DialogTitle>
            <DialogDescription>Barcha ma'lumotlarni o'zgartirishingiz mumkin</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <h4 className="font-semibold text-gray-800 border-b pb-2">Asosiy ma'lumotlar</h4>
            <div>
              <Label className="text-gray-700 font-medium">Nomi</Label>
              <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-700 font-medium">Manzil</Label>
                <Input value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} className="mt-1" />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Telefon</Label>
                <Input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="mt-1" />
              </div>
            </div>

            <h4 className="font-semibold text-gray-800 border-b pb-2">Tarif va muddat</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-700 font-medium">Tarif</Label>
                <Select value={editForm.tariff_id} onValueChange={v => setEditForm({...editForm, tariff_id: v})}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Tarifni tanlang" /></SelectTrigger>
                  <SelectContent>
                    {tariffs.map(t => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Muddat</Label>
                <Select value={editForm.tariff_duration} onValueChange={v => setEditForm({...editForm, tariff_duration: v})}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Muddat" /></SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map(d => (
                      <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showEdit && editForm.tariff_id && editForm.tariff_duration && selectedEditTariff && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tanlangan tarif:</span>
                  <span className="font-bold text-purple-700">{selectedEditTariff.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Talaba chegarasi:</span>
                  <span className="font-medium">{selectedEditTariff.student_min}–{selectedEditTariff.student_max}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Muddat:</span>
                  <span className="font-medium">{Number(editForm.tariff_duration)} oy</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">To'lov:</span>
                  <span className="text-lg font-bold text-green-700">{fmtPrice(editPrice)}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Label className="text-gray-700 font-medium shrink-0">Call center</Label>
              <button
                type="button"
                onClick={() => setEditForm({...editForm, call_center_enabled: !editForm.call_center_enabled})}
                className={`w-12 h-6 rounded-full transition-colors ${editForm.call_center_enabled ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${editForm.call_center_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-gray-500">{editForm.call_center_enabled ? 'Yoqilgan' : "O'chirilgan"}</span>
            </div>

            <h4 className="font-semibold text-gray-800 border-b pb-2">Direktor ma'lumotlari (o'zgartirish uchun to'ldiring)</h4>
            <div>
              <Label className="text-gray-700 font-medium">Ism Familiya</Label>
              <Input value={editForm.director_full_name} onChange={e => setEditForm({...editForm, director_full_name: e.target.value})}
                placeholder="Yangi ism familiya" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-700 font-medium">Email</Label>
                <Input type="email" value={editForm.director_email} onChange={e => setEditForm({...editForm, director_email: e.target.value})}
                  placeholder="Yangi email" className="mt-1" />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Telefon</Label>
                <Input value={editForm.director_phone} onChange={e => setEditForm({...editForm, director_phone: e.target.value})}
                  placeholder="Yangi telefon" className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Yangi parol</Label>
              <Input type="password" value={editForm.director_password} onChange={e => setEditForm({...editForm, director_password: e.target.value})}
                placeholder="Yangi parol (o'zgartirish uchun)" className="mt-1" />
              <p className="text-xs text-gray-400 mt-1">Faqat o'zgartirmoqchi bo'lsangiz to'ldiring</p>
            </div>

            <h4 className="font-semibold text-gray-800 border-b pb-2">Logo</h4>
            <div>
              <div className="flex items-center gap-3">
                {showEdit && (showEdit.logo || editForm.logoPreview) && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border bg-gray-50 shrink-0">
                    <img src={showEdit.logo ? `${process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz'}/uploads/centers/${showEdit.logo}` : editForm.logoPreview}
                      alt="Logo" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <Input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setLogoFile(file);
                  }} />
                </div>
                {logoFile && (
                  <Button type="button" variant="outline" size="sm" disabled={logoUploading}
                    onClick={async () => {
                      if (!showEdit || !logoFile) return;
                      setLogoUploading(true);
                      try {
                        await educationCentersApi.uploadLogo(showEdit.id, logoFile);
                        toast.success('Logo yuklandi');
                        setLogoFile(null);
                        loadData();
                      } catch (err: any) {
                        toast.error(err?.response?.data?.message || err?.message || 'Xatolik');
                      } finally {
                        setLogoUploading(false);
                      }
                    }}>
                    {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4 mr-1" />}
                    Yuklash
                  </Button>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEdit(null)} className="border-gray-300 hover:bg-gray-100">
                Bekor qilish
              </Button>
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md min-w-[120px]">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saqlanmoqda...</> : 'Saqlash'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}