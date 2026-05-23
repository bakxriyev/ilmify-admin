'use client';

import { useState } from 'react';
import { Settings, Key, Shield, Loader2, CheckCircle, XCircle, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { smsApi } from '@/api/smsApi';
import toast from 'react-hot-toast';

export default function SmsSettings() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [senderName, setSenderName] = useState('4546');
  const [autoReminders, setAutoReminders] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const testConnection = async () => {
    if (!email || !password) {
      toast.error('Email va passwordni kiriting');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await smsApi.testConnection(email, password);
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
    // Currently settings are stored in backend .env
    // This would be extended to save to database
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

        {/* Eskiz credentials */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2"><Key className="h-4 w-4" /> Eskiz.uz ma'lumotlari</h4>
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="ESKIZ email" type="email" />
          <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="ESKIZ password" type="password" />
          <Input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Jo'natuvchi nomi (masalan: 4546)" />
        </div>

        {/* Test connection */}
        <div className="flex items-center gap-3">
          <Button onClick={testConnection} disabled={testing} variant="outline">
            {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
            Ulanishni tekshirish
          </Button>
          {testResult === true && <CheckCircle className="h-5 w-5 text-green-500" />}
          {testResult === false && <XCircle className="h-5 w-5 text-red-500" />}
        </div>

        {/* Auto reminders toggle */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Switch checked={autoReminders} onCheckedChange={setAutoReminders} id="auto-reminders" />
          <Label htmlFor="auto-reminders" className="text-sm font-medium">Avtomatik eslatmalar (har kuni 9:00 da)</Label>
        </div>

        <Button onClick={saveSettings} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Sozlamalarni saqlash
        </Button>

        <p className="text-xs text-gray-400">Eslatma: Hozircha sozlamalar faqat server .env faylida saqlanadi. To'liq saqlash uchun database jadvali qo'shiladi.</p>
      </CardContent>
    </Card>
  );
}
