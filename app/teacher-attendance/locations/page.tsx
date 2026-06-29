'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import {
  MapPin, Save, Navigation, Loader2, CheckCircle, Building2,
  Edit3, X, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { teacherAttendanceApi, type CenterLocation } from '@/api/teacherAttendanceApi';
import toast from 'react-hot-toast';

const LocationPickerMap = dynamic(
  () => import('@/components/location-map/LocationPickerMap'),
  { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 rounded-lg flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> }
);

const ViewOnlyMap = dynamic(
  () => import('@/components/location-map/ViewOnlyMap'),
  { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 rounded-lg flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> }
);

export default function CenterLocationPage() {
  const [location, setLocation] = useState<CenterLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gettingCurrent, setGettingCurrent] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    latitude: '41.2995',
    longitude: '69.2401',
    address: '',
    radius: '100',
  });

  const fetchLocation = async () => {
    try {
      setLoading(true);
      const data = await teacherAttendanceApi.getCenterLocation();
      setLocation(data);
    } catch { } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLocation(); }, []);

  const openEdit = () => {
    if (!location) return;
    setForm({
      name: location.name || '',
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      address: location.address || '',
      radius: location.radius.toString(),
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Lokatsiya nomini kiriting'); return; }
    setConfirmOpen(true);
  };

  const confirmSave = async () => {
    try {
      setSaving(true);
      setConfirmOpen(false);
      const data = {
        name: form.name,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        address: form.address || undefined,
        radius: parseInt(form.radius) || 100,
      };
      await teacherAttendanceApi.updateCenterLocation(data);
      toast.success('Lokatsiya saqlandi');
      setEditOpen(false);
      fetchLocation();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Bu brauzer lokatsiyani qo\'llab-quvvatlamaydi');
      return;
    }
    setGettingCurrent(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({
          ...form,
          latitude: pos.coords.latitude.toString(),
          longitude: pos.coords.longitude.toString(),
        });
        toast.success('Hozirgi joylashuv topildi');
        setGettingCurrent(false);
      },
      (err) => {
        toast.error(`Lokatsiya olinmadi: ${err.message}`);
        setGettingCurrent(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  const currentLat = parseFloat(form.latitude) || 41.2995;
  const currentLng = parseFloat(form.longitude) || 69.2401;

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">O'quv Markazi Lokatsiyasi</h1>
            <p className="text-gray-500">O'quv markazingizning joylashuvini xaritadan belgilang</p>
          </div>
          {location && (
            <Badge variant="secondary" className="text-sm px-3 py-1.5">
              <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-600" /> Lokatsiya sozlangan
            </Badge>
          )}
        </div>

        {location ? (
          <>
            <Card className="mb-6 overflow-hidden">
              <div className="relative">
                <ViewOnlyMap
                  latitude={Number(location.latitude)}
                  longitude={Number(location.longitude)}
                  height="300px"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-lg px-3 py-2 shadow text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  {location.name}
                </div>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Kenglik</p>
                    <p className="font-mono font-bold">{Number(location.latitude).toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Uzunlik</p>
                    <p className="font-mono font-bold">{Number(location.longitude).toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Radius</p>
                    <p className="font-bold">{location.radius}m</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Holat</p>
                    <Badge variant={location.is_active ? 'default' : 'secondary'} className={location.is_active ? 'bg-green-600' : ''}>
                      {location.is_active ? 'Faol' : 'Faol emas'}
                    </Badge>
                  </div>
                </div>
                {location.address && (
                  <p className="text-sm text-gray-500 text-center mb-4">
                    {location.address}
                  </p>
                )}
                <Button onClick={openEdit} className="w-full" variant="outline" size="lg">
                  <Edit3 className="h-5 w-5 mr-2" /> Lokatsiyani o'zgartirish
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Lokatsiya sozlanmagan
              </CardTitle>
              <CardDescription>
                Hali lokatsiya o'rnatilmagan. Quyidagi tugma orqali o'quv markazingiz joylashuvini belgilang.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => {
                setForm({ name: '', latitude: '41.2995', longitude: '69.2401', address: '', radius: '100' });
                setEditOpen(true);
              }} className="w-full" size="lg">
                <MapPin className="h-5 w-5 mr-2" /> Lokatsiyani o'rnatish
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lokatsiyani o'zgartirish</DialogTitle>
              <DialogDescription>
                Xaritadan markaz joylashuvini belgilang va saqlang.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Lokatsiya nomi</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Masalan: Asosiy bino"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Xaritadan tanlash</Label>
                  <Button variant="outline" size="sm" onClick={handleGetCurrentLocation} disabled={gettingCurrent}>
                    {gettingCurrent ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Topilmoqda...</>
                    ) : (
                      <><Navigation className="h-4 w-4 mr-1" /> Hozirgi joyni topish</>
                    )}
                  </Button>
                </div>
                <LocationPickerMap
                  latitude={currentLat}
                  longitude={currentLng}
                  onLocationChange={(lat, lng) => setForm({ ...form, latitude: lat.toString(), longitude: lng.toString() })}
                  height="300px"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Kenglik (Latitude)</Label>
                  <Input value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} type="number" step="any" />
                </div>
                <div className="grid gap-2">
                  <Label>Uzunlik (Longitude)</Label>
                  <Input value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} type="number" step="any" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Radius (metr)</Label>
                  <Input value={form.radius} onChange={e => setForm({ ...form, radius: e.target.value })} type="number" min="10" max="10000" />
                  <p className="text-xs text-gray-500">Shu masofa ichida o'qituvchilar davomat qila oladi</p>
                </div>
                <div className="grid gap-2">
                  <Label>Manzil (ixtiyoriy)</Label>
                  <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Toshkent, Chilonzor..." />
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Saqlanmoqda...</> : <><Save className="h-5 w-5 mr-2" /> Saqlash</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Aniq o'zgartirasizmi?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Lokatsiya ma'lumotlari o'zgartiriladi. Barcha o'qituvchilar yangi lokatsiya orqali davomat qiladi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
              <AlertDialogAction onClick={confirmSave} className="bg-blue-600 hover:bg-blue-700">
                Ha, o'zgartirish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
