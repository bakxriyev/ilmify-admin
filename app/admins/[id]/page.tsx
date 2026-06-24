'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { adminApi, type Admin } from '@/api/adminApi';
import { ArrowLeft, User, Phone, Mail, Save, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const ALL_PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard', desc: 'Asosiy sahifani ko\'rish' },
  { key: 'students', label: 'Studentlar', desc: 'Studentlar bilan ishlash' },
  { key: 'teachers', label: "O'qituvchilar", desc: "O'qituvchilar bilan ishlash" },
  { key: 'parents', label: 'Ota-onalar', desc: 'Ota-onalar bilan ishlash' },
  { key: 'groups', label: 'Guruhlar', desc: 'Guruhlar bilan ishlash' },
  { key: 'attendance', label: 'Davomat', desc: 'Davomatni boshqarish' },
  { key: 'rooms', label: 'Xonalar', desc: 'Xonalarni boshqarish' },
  { key: 'payments', label: "To'lovlar", desc: "To'lovlar bilan ishlash" },
  { key: 'crm', label: 'CRM', desc: 'Leadlar va call-center bilan ishlash' },
  { key: 'notifications', label: 'Bildirishnomalar', desc: 'Bildirishnomalarni ko\'rish' },
  { key: 'telegram', label: 'Telegram Bot', desc: 'Telegram botni boshqarish' },
  { key: 'reports', label: 'Hisobotlar', desc: 'Hisobotlarni ko\'rish' },
  { key: 'admins', label: 'Adminlar', desc: 'Adminlarni boshqarish' },
  { key: 'monitoring', label: 'Monitoring', desc: 'Monitoringni ko\'rish' },
];

export default function EditAdminPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.id as string;
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [editForm, setEditForm] = useState({ full_name: '', phone_number: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminApi.getCenterAdmins();
        const found = data.find(a => String(a.id) === adminId);
        if (found) {
          setAdmin(found);
          setPermissions(found.permissions || {});
          setEditForm({
            full_name: found.full_name || '',
            phone_number: found.phone_number || '',
            email: found.email || '',
            password: '',
          });
        } else {
          toast.error('Admin topilmadi');
          router.push('/admins');
        }
      } catch {
        toast.error('Xatolik yuz berdi');
        router.push('/admins');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [adminId, router]);

  const togglePermission = (key: string) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      await adminApi.updateAdminPermissions(adminId, permissions);
      toast.success('Ruxsatlar saqlandi');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateInfo = async () => {
    try {
      setSaving(true);
      const payload: any = {
        full_name: editForm.full_name,
        phone_number: editForm.phone_number,
        email: editForm.email,
      };
      if (editForm.password) payload.password = editForm.password;
      await adminApi.updateCenterAdmin(adminId, payload);
      toast.success('Ma\'lumotlar saqlandi');
      setEditForm(prev => ({ ...prev, password: '' }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!admin) return null;

  const enabledCount = Object.values(permissions).filter(Boolean).length;
  const totalCount = ALL_PERMISSIONS.length;

  return (
    <Layout>
      <div className="space-y-6 p-6 w-full max-w-3xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/admins')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Orqaga
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" /> {admin.full_name}
            </h1>
            <p className="text-gray-500">Admin ruxsatlarini boshqarish</p>
          </div>
        </div>

        {/* Permissions */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ruxsatlar ({enabledCount}/{totalCount})</CardTitle>
              <Button
                onClick={handleSavePermissions}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {ALL_PERMISSIONS.map(p => (
                <div
                  key={p.key}
                  className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{p.label}</p>
                    <p className="text-sm text-gray-500">{p.desc}</p>
                  </div>
                  <Switch
                    checked={permissions[p.key] === true}
                    onCheckedChange={() => togglePermission(p.key)}
                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300 data-[state=checked]:shadow-md"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Admin Info Edit */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Admin ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>To'liq ism</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={editForm.full_name}
                    onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Telefon raqam</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={editForm.phone_number}
                    onChange={e => setEditForm({ ...editForm, phone_number: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Yangi parol (agar o'zgartirmoqchi bo'lsangiz)</Label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={editForm.password}
                  onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Yangi parol"
                  minLength={6}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleUpdateInfo}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Saqlanmoqda...' : 'Ma\'lumotlarni saqlash'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
