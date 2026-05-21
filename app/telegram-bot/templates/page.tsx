'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Loader2, Edit2, Trash2, Save, X, Copy, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';
import { telegramBotApi, getCenterIdOrThrow } from '@/api/telegramBotApi';

export default function TemplatesPage() {
  const [centerId, setCenterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const cid = await getCenterIdOrThrow();
      setCenterId(cid);
      const tpls = await telegramBotApi.getTemplates(cid);
      setTemplates(tpls || []);
    } catch { toast.error('Xatolik'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setName('');
    setContent('');
    setShowForm(true);
  };

  const openEdit = (tpl: any) => {
    setEditId(tpl.id);
    setName(tpl.name);
    setContent(tpl.content);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) {
      toast.error('Nom va matn kiritilishi shart');
      return;
    }
    if (!centerId) return;
    setSaving(true);
    try {
      if (editId) {
        await telegramBotApi.updateTemplate(editId, { name, content });
        toast.success('Shablon yangilandi');
      } else {
        await telegramBotApi.createTemplate(centerId, { name, content });
        toast.success('Shablon yaratildi');
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Xatolik');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Shablonni o\'chirasizmi?')) return;
    try {
      await telegramBotApi.deleteTemplate(id);
      toast.success('Shablon o\'chirildi');
      load();
    } catch { toast.error('Xatolik'); }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Matn nusxalandi');
  };

  const getPreview = (text: string) => {
    return text
      .replace(/\{ism\}/g, 'Ism')
      .replace(/\{familiya\}/g, 'Familiya')
      .replace(/\{tel\}/g, '+998901234567')
      .replace(/\{guruh\}/g, 'Guruh nomi')
      .replace(/\{markaz\}/g, 'Markaz nomi');
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Xabar shablonlari
        </h2>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-1" /> Yangi shablon
        </Button>
      </div>

      <div className="grid gap-3">
        {templates.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center text-gray-400">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Shablonlar mavjud emas. Yangi shablon yarating.</p>
            </CardContent>
          </Card>
        )}
        {templates.map(tpl => (
          <Card key={tpl.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{tpl.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2 whitespace-pre-wrap">{tpl.content}</p>
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-400">
                    <Eye className="h-3 w-3 inline mr-1" />
                    {getPreview(tpl.content)}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(tpl.content)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(tpl)}>
                    <Edit2 className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(tpl.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Shablonni tahrirlash' : 'Yangi shablon'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Shablon nomi</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Masalan: To'lov haqida eslatma" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Matn</label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} rows={6}
                placeholder="Salom {ism}, to'lov muddati yaqinlashmoqda..." />
              <p className="text-xs text-gray-400 mt-1">
                Placeholderlar: {'{ism}'}, {'{familiya}'}, {'{tel}'}, {'{guruh}'}, {'{markaz}'}
              </p>
            </div>
            {content && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-gray-600">
                <Eye className="h-3.5 w-3.5 inline mr-1" />
                {getPreview(content)}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Bekor qilish</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-1" /> Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
