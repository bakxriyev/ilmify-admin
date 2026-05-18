'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { tariffsApi, type Tariff, type CreateTariffRequest } from '@/api/tariffsApi';
import { Plus, Edit2, Trash2, Loader2, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tariff | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateTariffRequest>({
    name: '', student_min: 0, student_max: 100,
    price_1month: 0, price_3months: 0, price_6months: 0, price_12months: 0,
    description: '',
  });

  useEffect(() => {
    loadTariffs();
  }, []);

  const loadTariffs = async () => {
    try {
      setLoading(true);
      const data = await tariffsApi.getAll();
      setTariffs(data);
    } catch (err: any) {
      toast.error(err?.message || 'Yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', student_min: 0, student_max: 100, price_1month: 0, price_3months: 0, price_6months: 0, price_12months: 0, description: '' });
    setShowModal(true);
  };

  const openEdit = (t: Tariff) => {
    setEditing(t);
    setForm({
      name: t.name, student_min: t.student_min, student_max: t.student_max,
      price_1month: Number(t.price_1month), price_3months: Number(t.price_3months),
      price_6months: Number(t.price_6months), price_12months: Number(t.price_12months),
      description: t.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) {
        await tariffsApi.update(editing.id, form);
        toast.success('Tarif yangilandi');
      } else {
        await tariffsApi.create(form);
        toast.success('Tarif yaratildi');
      }
      setShowModal(false);
      loadTariffs();
    } catch (err: any) {
      toast.error(err?.message || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tarifni o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await tariffsApi.remove(id);
      toast.success('Tarif o\'chirildi');
      loadTariffs();
    } catch (err: any) {
      toast.error(err?.message || 'O\'chirishda xatolik');
    }
  };

  const fmtPrice = (p: number | string) => Number(p).toLocaleString() + ' so\'m';

  const durationLabels = [
    { key: 'price_1month' as const, label: '1 oy' },
    { key: 'price_3months' as const, label: '3 oy' },
    { key: 'price_6months' as const, label: '6 oy' },
    { key: 'price_12months' as const, label: '12 oy' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-6 w-6 text-purple-600" />
          Tariflar
        </h1>
        <Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md">
          <Plus className="h-4 w-4 mr-2" /> Yangi tarif
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
      ) : (
        <Card className="shadow-md border-0">
          <CardHeader><CardTitle className="text-gray-900">Tariflar ro'yxati</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-gray-700">Nomi</TableHead>
                  <TableHead className="font-semibold text-gray-700">Talabalar</TableHead>
                  {durationLabels.map(d => <TableHead key={d.key} className="font-semibold text-gray-700">{d.label}</TableHead>)}
                  <TableHead className="font-semibold text-gray-700">Holat</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tariffs.map(t => (
                  <TableRow key={t.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{t.name}</TableCell>
                    <TableCell className="text-gray-700">{t.student_min} - {t.student_max}</TableCell>
                    {durationLabels.map(d => (
                      <TableCell key={d.key} className="text-gray-700">{fmtPrice(t[d.key])}</TableCell>
                    ))}
                    <TableCell>
                      <Badge className={t.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {t.is_active ? 'Faol' : 'Nofaol'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)} className="text-blue-600 hover:bg-blue-50">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="text-red-500 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg bg-white rounded-xl shadow-2xl border-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editing ? 'Tarifni tahrirlash' : 'Yangi tarif'}
            </DialogTitle>
            <DialogDescription className="text-gray-500">Narxlarni so'mda kiriting</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <Label className="text-gray-700 font-medium">Nomi</Label>
              <Input
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                required
                placeholder="Masalan, Starter"
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-medium">Min talabalar</Label>
                <Input
                  type="number" min={0}
                  value={form.student_min}
                  onChange={e => setForm({...form, student_min: Number(e.target.value)})}
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Max talabalar</Label>
                <Input
                  type="number" min={1}
                  value={form.student_max}
                  onChange={e => setForm({...form, student_max: Number(e.target.value)})}
                  required
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-medium">1 oylik narx</Label>
                <Input
                  type="number" min={0}
                  value={form.price_1month}
                  onChange={e => setForm({...form, price_1month: Number(e.target.value)})}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">3 oylik narx</Label>
                <Input
                  type="number" min={0}
                  value={form.price_3months}
                  onChange={e => setForm({...form, price_3months: Number(e.target.value)})}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">6 oylik narx</Label>
                <Input
                  type="number" min={0}
                  value={form.price_6months}
                  onChange={e => setForm({...form, price_6months: Number(e.target.value)})}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">12 oylik narx</Label>
                <Input
                  type="number" min={0}
                  value={form.price_12months}
                  onChange={e => setForm({...form, price_12months: Number(e.target.value)})}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Tavsif</Label>
              <Input
                value={form.description || ''}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Qisqa tavsif"
                className="mt-1.5"
              />
            </div>
            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="border-gray-300 hover:bg-gray-100">
                Bekor qilish
              </Button>
              <Button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md min-w-[100px]">
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saqlanmoqda...</>
                ) : 'Saqlash'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
