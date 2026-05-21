'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi, type Admin } from '@/api/adminApi';
import { Plus, User, Trash2, Shield, RefreshCw, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getCenterAdmins();
      setAdmins(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" adminni o'chirasizmi?`)) return;
    try {
      await adminApi.deleteCenterAdmin(id);
      toast.success('Admin o\'chirildi');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik');
    }
  };

  return (
    <Layout>
      <div className="space-y-6 p-6 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" /> Adminlar
            </h1>
            <p className="text-gray-500">O'quv markazingiz adminlarini boshqaring</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData} className="border-gray-300">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Yangilash
            </Button>
            <Button onClick={() => router.push('/admins/create')} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Yangi admin
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>Hali adminlar mavjud emas</p>
                <Button onClick={() => router.push('/admins/create')} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" /> Yangi admin qo'shish
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-gray-600 font-medium">#</th>
                      <th className="text-left p-3 text-gray-600 font-medium">Admin</th>
                      <th className="text-left p-3 text-gray-600 font-medium">Telefon</th>
                      <th className="text-left p-3 text-gray-600 font-medium">Email</th>
                      <th className="text-center p-3 text-gray-600 font-medium">Ruxsatlar</th>
                      <th className="text-right p-3 text-gray-600 font-medium">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin, idx) => {
                      const enabledCount = admin.permissions
                        ? Object.values(admin.permissions).filter(Boolean).length
                        : 0;
                      const totalCount = admin.permissions ? Object.keys(admin.permissions).length : 0;
                      return (
                        <tr key={admin.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 text-gray-400">{idx + 1}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{admin.full_name}</p>
                                <p className="text-xs text-gray-400">ID: {admin.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-gray-600">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 text-gray-400" />
                              {admin.phone_number}
                            </div>
                          </td>
                          <td className="p-3 text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5 text-gray-400" />
                              {admin.email || '-'}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-sm font-medium">
                              {enabledCount}/{totalCount}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admins/${admin.id}`)}
                                className="text-blue-600 h-8 px-2"
                              >
                                Ruxsatlar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(admin.id, admin.full_name)}
                                className="text-red-600 h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
