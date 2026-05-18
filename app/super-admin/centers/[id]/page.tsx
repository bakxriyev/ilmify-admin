'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { educationCentersApi, type EducationCenter, type CenterBranch } from '@/api/educationCentersApi';
import {
  ArrowLeft, Building, MapPin, Phone, DollarSign, School,
  Plus, Trash2, Power, PowerOff,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CenterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [center, setCenter] = useState<EducationCenter | null>(null);
  const [branches, setBranches] = useState<CenterBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchForm, setBranchForm] = useState({ name: '', location: '', phone: '' });
  const [showBranchForm, setShowBranchForm] = useState(false);

  useEffect(() => {
    Promise.all([
      educationCentersApi.getById(id),
      educationCentersApi.getBranches(id),
    ]).then(([c, b]) => { setCenter(c); setBranches(b); })
      .catch(() => toast.error('Xatolik'))
      .finally(() => setLoading(false));
  }, [id]);

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

  if (loading) return <div className="p-6"><Skeleton className="h-8 w-48" /></div>;
  if (!center) return <div className="p-6 text-gray-500">Markaz topilmadi</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.push('/super-admin')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Orqaga
        </Button>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-600 to-indigo-700">
          <CardContent className="p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl"><School className="h-8 w-8" /></div>
              <div>
                <h1 className="text-2xl font-bold">{center.name}</h1>
                <div className="flex flex-wrap gap-4 mt-2 text-white/80 text-sm">
                  {center.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {center.location}</span>}
                  {center.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {center.phone}</span>}
                  <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> {Number(center.balance).toLocaleString()} so'm</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
