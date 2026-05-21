'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminApi } from '@/api/adminApi';
import { ArrowLeft, User, Phone, Mail, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateAdminPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone_number || !form.email || !form.password) {
      toast.error('Barcha maydonlarni to\'ldiring');
      return;
    }
    try {
      setSaving(true);
      await adminApi.createCenterAdmin(form);
      toast.success('Admin yaratildi');
      router.push('/admins');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 p-6 w-full max-w-2xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/admins')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Orqaga
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Yangi admin qo'shish</h1>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Admin ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>To'liq ism</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    placeholder="To'liq ism familiya"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Telefon raqam</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={form.phone_number}
                    onChange={e => setForm({ ...form, phone_number: e.target.value })}
                    placeholder="+998901234567"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="admin@example.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Parol</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Kamida 6 belgidan iborat"
                    className="pl-9"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push('/admins')}>
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
