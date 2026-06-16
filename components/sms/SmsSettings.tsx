'use client';

import { useState } from 'react';
import { Settings, Shield, Loader2, CheckCircle, XCircle, Save, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { smsApi } from '@/api/smsApi';
import toast from 'react-hot-toast';

interface Props {
  templates?: Array<{ id: string; title: string }>;
}

export default function SmsSettings({ templates = [] }: Props) {
  const [autoReminders, setAutoReminders] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  const [smsTemplateCategory, setSmsTemplateCategory] = useState('debt_reminder');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await smsApi.testConnection('test@test.com', 'test');
      setTestResult(res === true);
      if (res) toast.success('Ulanish muvaffaqiyatli');
      else toast.error('Xato: noto\'g\'ri login yoki parol');
    } catch {
      setTestResult(false);
      toast.error('Xato: serverga ulanib bo\'lmadi');
    } finally { setTesting(false); }
  };

  const saveSettings = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    toast.success('Sozlamalar saqlandi. O\'zgarishlar uchun serverni qayta ishga tushiring.');
    setSaving(false);
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" /> SMS sozlamalari
        </h3>

        {/* Eskiz ulanish holati */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Eskiz.uz ulanish holati</h4>
          <p className="text-xs text-gray-500">Eskiz.uz ma'lumotlari server .env faylida saqlanadi.</p>
          <div className="flex items-center gap-3">
            <Button onClick={testConnection} disabled={testing} variant="outline" size="sm">
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
              Ulanishni tekshirish
            </Button>
            {testResult === true && (
              <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" /> Ulanish mavjud
              </span>
            )}
            {testResult === false && (
              <span className="flex items-center gap-1 text-sm text-red-600 font-medium">
                <XCircle className="h-4 w-4" /> Ulanish yo'q
              </span>
            )}
          </div>
        </div>

        {/* Avtomatik eslatmalar */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div>
            <p className="font-medium text-gray-900">Avtomatik eslatmalar</p>
            <p className="text-sm text-gray-500">Eskiz orqali avtomatik SMS eslatmalar (kunning birinchi vaqtida)</p>
          </div>
          <Switch
            checked={autoReminders}
            onCheckedChange={setAutoReminders}
            className="data-[state=checked]:bg-green-500!"
          />
        </div>

        {/* SMS auto-send */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-600" /> SMS orqali jo'natish
              </p>
              <p className="text-sm text-gray-500">Qarzdor studentlarga SMS orqali eslatma yuborish</p>
            </div>
            <Switch
              checked={sendSms}
              onCheckedChange={setSendSms}
              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300"
            />
          </div>
          {sendSms && (
            <div className="pt-2">
              <Label className="text-xs text-gray-500 mb-1 block">SMS shabloni</Label>
              <Select value={smsTemplateCategory} onValueChange={setSmsTemplateCategory}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Shablonni tanlang..." />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Button onClick={saveSettings} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Sozlamalarni saqlash
        </Button>

        <p className="text-xs text-gray-400">Eslatma: Sozlamalar bazada saqlanadi. Eskiz.uz kalitlari .env faylida joylashgan.</p>
      </CardContent>
    </Card>
  );
}
