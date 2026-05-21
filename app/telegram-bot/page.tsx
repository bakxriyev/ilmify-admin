'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bot, Save, Loader2, CheckCircle, AlertCircle, Key, Power, Plug, Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';
import { telegramBotApi, getCenterIdOrThrow } from '../../api/telegramBotApi';

export default function TelegramBotPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [centerId, setCenterId] = useState<number | null>(null);
  const [botToken, setBotToken] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const cid = await getCenterIdOrThrow();
      setCenterId(cid);
      const config = await telegramBotApi.getConfig(cid);
      setBotToken(config.bot_token || '');
      setIsActive(config.is_active || false);
    } catch (err: any) {
      toast.error('Sozlamalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setTestResult(null);
      if (!botToken.trim()) {
        toast.error('Bot token kiritilishi shart');
        return;
      }
      if (!centerId) return;

      await telegramBotApi.updateConfig(centerId, {
        bot_token: botToken.trim(),
        is_active: isActive,
      });

      try {
        const res = await fetch(`https://api.telegram.org/bot${botToken.trim()}/getMe`);
        const data = await res.json();
        if (data.ok) {
          setTestResult({ success: true, message: `Bot @${data.result.username} ga ulandi!` });
        } else {
          setTestResult({ success: false, message: 'Noto\'g\'ri token' });
        }
      } catch {
        setTestResult({ success: false, message: 'Bot token tekshirib bo\'lmadi' });
      }
      toast.success('Telegram bot sozlamalari saqlandi');
    } catch (err: any) {
      toast.error(err.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-blue-600" />
            Bot ulash
          </CardTitle>
          <CardDescription>
            O'quv markazingiz uchun Telegram bot tokenini kiriting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700 font-medium">
              <Key className="h-4 w-4 text-blue-500" />
              Bot Token <span className="text-red-500">*</span>
            </Label>
            <Input
              value={botToken}
              onChange={e => setBotToken(e.target.value)}
              placeholder="1234567890:ABCdefGHIjklmNOPqrSTUvwXYZ"
              className="font-mono text-sm"
              type="password"
            />
            <p className="text-xs text-gray-400">@BotFather dan olingan tokenni kiriting</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-3">
              {isActive ? (
                <Plug className="h-5 w-5 text-green-600" />
              ) : (
                <Unplug className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800">Bot holati</p>
                  <Badge className={isActive ? 'bg-green-500' : 'bg-gray-400'}>
                    {isActive ? 'Faol' : 'O\'chiq'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {isActive ? 'Bot ishlamoqda, foydalanuvchilar ulanishi mumkin' : 'Bot o\'chiq, foydalanuvchilar ulana olmaydi'}
                </p>
              </div>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {testResult && (
            <div className={`flex items-center gap-3 p-4 rounded-xl ${
              testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {testResult.success
                ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                : <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              }
              <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {testResult.message}
              </p>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6">
            {saving ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Saqlanmoqda...</>
            ) : (
              <><Save className="h-5 w-5 mr-2" /> Saqlash va ulash</>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-6 text-sm text-gray-600 space-y-2">
          <p className="font-medium text-gray-800">Qanday ishlaydi:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>@BotFather da bot yarating va tokenni oling</li>
            <li>Yuqoridagi maydonga tokenni kiriting va saqlang</li>
            <li>Bot faol holatga o'tkazilganda avtomatik ishga tushadi</li>
            <li>Studentlar botga kirib chat_id saqlanadi</li>
            <li>"Xabar yuborish" bo'limidan barcha studentlarga xabar jo'natishingiz mumkin</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
