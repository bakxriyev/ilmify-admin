'use client';

import { useState, useEffect } from 'react';
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
  BookOpen, X, Loader2, AlertCircle, Package, BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [centers, setCenters] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', location: '', phone: '', tariff_id: '',
    admin_first_name: '', admin_last_name: '', admin_email: '', admin_phone: '', admin_password: '',
  });
  const [editForm, setEditForm] = useState({ name: '', location: '', phone: '', tariff_id: '', call_center_enabled: false, features: '' });

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await educationCentersApi.create({
        name: form.name, location: form.location || undefined, phone: form.phone || undefined,
        tariff_id: form.tariff_id ? Number(form.tariff_id) : undefined,
        admin: {
          first_name: form.admin_first_name, last_name: form.admin_last_name,
          email: form.admin_email, phone_number: form.admin_phone, password: form.admin_password,
        },
      });
      toast.success("Markaz yaratildi");
      setShowCreate(false);
      setForm({ name: '', location: '', phone: '', tariff_id: '', admin_first_name: '', admin_last_name: '', admin_email: '', admin_phone: '', admin_password: '' });
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Xatolik');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit) return;
    try {
      const payload: any = {
        name: editForm.name, location: editForm.location || undefined,
        phone: editForm.phone || undefined,
        call_center_enabled: editForm.call_center_enabled,
      };
      if (editForm.tariff_id) payload.tariff_id = Number(editForm.tariff_id);
      await educationCentersApi.update(showEdit.id, payload);
      toast.success("Markaz yangilandi");
      setShowEdit(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Xatolik');
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

  const getTariffName = (c: any) => c.tariff?.name || (c.tariff_id ? 'Tarif o\'chirilgan' : '—');
  const getTrialStatus = (c: any) => {
    if (!c.trial_ends_at && c.tariff_id) return { label: 'To\'lovli', color: 'bg-green-100 text-green-700' as const };
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
                              <span className="text-gray-400">—</span>
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
              <Button onClick={() => setShowCreate(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
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
                          <div className={`p-3 rounded-xl ${c.is_active ? 'bg-purple-100' : 'bg-gray-100'}`}>
                            <School className={`h-6 w-6 ${c.is_active ? 'text-purple-600' : 'text-gray-400'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-gray-900 text-lg">{c.name}</h3>
                              <Badge className={c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                {c.is_active ? 'Faol' : 'Bloklangan'}
                              </Badge>
                              {c.tariff && (
                                <Badge className="bg-purple-100 text-purple-700">{c.tariff.name}</Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                              {c.location && <span><MapPin className="h-3.5 w-3.5 inline mr-1" />{c.location}</span>}
                              {c.phone && <span><Phone className="h-3.5 w-3.5 inline mr-1" />{c.phone}</span>}
                              <span><Users className="h-3.5 w-3.5 inline mr-1" />{c.student_count || 0} o'quvchi</span>
                              <span><GraduationCap className="h-3.5 w-3.5 inline mr-1" />{c.teacher_count || 0} o'qituvchi</span>
                              <span><BookOpen className="h-3.5 w-3.5 inline mr-1" />{c.group_count || 0} guruh</span>
                              {c.call_center_enabled && (
                                <Badge className="bg-teal-100 text-teal-700">Call center yoqilgan</Badge>
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
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleActive(c)}
                            className={`p-2 rounded-lg transition-colors ${c.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                            title={c.is_active ? 'Bloklash' : 'Faollashtirish'}>
                            {c.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </button>
                          <button onClick={() => {
                            setShowEdit(c);
                            setEditForm({
                              name: c.name, location: c.location || '', phone: c.phone || '',
                              tariff_id: c.tariff_id ? String(c.tariff_id) : '',
                              call_center_enabled: c.call_center_enabled || false,
                              features: JSON.stringify(c.features || {}),
                            });
                          }}
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Yangi o'quv markaz</DialogTitle><DialogDescription>Markaz va admin ma'lumotlarini kiriting</DialogDescription></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <h4 className="font-semibold text-gray-800 border-b pb-2">Markaz ma'lumotlari</h4>
            <div><Label>Nomi <span className="text-red-500">*</span></Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Manzil</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
              <div><Label>Telefon</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            </div>
            <div>
              <Label>Tarif <span className="text-red-500">*</span></Label>
              <Select value={form.tariff_id} onValueChange={v => setForm({...form, tariff_id: v})}>
                <SelectTrigger><SelectValue placeholder="Tarifni tanlang" /></SelectTrigger>
                <SelectContent>
                  {tariffs.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name} ({t.student_min}–{t.student_max} talaba)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!form.tariff_id && <p className="text-xs text-amber-600 mt-1">Tarif tanlanmasa 7 kunlik sinov rejimi boshlanadi</p>}
            </div>
            <h4 className="font-semibold text-gray-800 border-b pb-2">Admin ma'lumotlari</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ism <span className="text-red-500">*</span></Label><Input value={form.admin_first_name} onChange={e => setForm({...form, admin_first_name: e.target.value})} required /></div>
              <div><Label>Familiya <span className="text-red-500">*</span></Label><Input value={form.admin_last_name} onChange={e => setForm({...form, admin_last_name: e.target.value})} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email <span className="text-red-500">*</span></Label><Input type="email" value={form.admin_email} onChange={e => setForm({...form, admin_email: e.target.value})} required /></div>
              <div><Label>Telefon <span className="text-red-500">*</span></Label><Input value={form.admin_phone} onChange={e => setForm({...form, admin_phone: e.target.value})} required /></div>
            </div>
            <div><Label>Parol <span className="text-red-500">*</span></Label><Input type="password" value={form.admin_password} onChange={e => setForm({...form, admin_password: e.target.value})} required /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Bekor qilish</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">Yaratish</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showEdit} onOpenChange={v => !v && setShowEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Markazni tahrirlash</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div><Label>Nomi</Label><Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Manzil</Label><Input value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} /></div>
              <div><Label>Telefon</Label><Input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} /></div>
            </div>
            <div>
              <Label>Tarif</Label>
              <Select value={editForm.tariff_id} onValueChange={v => setEditForm({...editForm, tariff_id: v})}>
                <SelectTrigger><SelectValue placeholder="Tarifni tanlang (o'zgartirilmaydi)" /></SelectTrigger>
                <SelectContent>
                  {tariffs.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Label>Call center</Label>
              <button
                type="button"
                onClick={() => setEditForm({...editForm, call_center_enabled: !editForm.call_center_enabled})}
                className={`w-12 h-6 rounded-full transition-colors ${editForm.call_center_enabled ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${editForm.call_center_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-gray-500">{editForm.call_center_enabled ? 'Yoqilgan' : 'O\'chirilgan'}</span>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEdit(null)}>Bekor qilish</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Saqlash</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
