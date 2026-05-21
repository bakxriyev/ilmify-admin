'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import {
  Bot, Save, Loader2, CheckCircle, AlertCircle, Plus, X, Trash2,
  RefreshCw, Key, Users, Hash, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import toast from 'react-hot-toast';
import { telegramApi } from '../../api/telegramApi';

export default function TelegramBotPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [channels, setChannels] = useState<string[]>(['']);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await telegramApi.getSettings();
      setBotToken(settings.bot_token || '');
      setIsActive(settings.is_active !== false);
      const savedChannels = (settings.channel_usernames || '')
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);
      setChannels(savedChannels.length > 0 ? savedChannels : ['']);
    } catch (err: any) {
      toast.error('Sozlamalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChannel = () => {
    setChannels(prev => [...prev, '']);
  };

  const handleRemoveChannel = (index: number) => {
    setChannels(prev => prev.filter((_, i) => i !== index));
  };

  const handleChannelChange = (index: number, value: string) => {
    const clean = value.replace('@', '').trim();
    setChannels(prev => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setTestResult(null);

      if (!botToken.trim()) {
        toast.error('Bot token kiritilishi shart');
        return;
      }

      const channelStr = channels.filter(Boolean).join(',');
      await telegramApi.updateSettings({
        bot_token: botToken.trim(),
        channel_usernames: channelStr,
        is_active: isActive,
      });
      toast.success('Telegram bot sozlamalari saqlandi');

      // Test bot token
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
    } catch (err: any) {
      toast.error(err.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="w-full h-full p-4 md:p-6 lg:p-8">
          <div className="space-y-4 w-full max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  Telegram Bot Sozlamalari
                </h1>
                <p className="text-sm text-gray-500 mt-1">Bot token va kanallarni boshqarish</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadSettings} className="text-xs">
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Yangilash
              </Button>
            </div>

            {/* Main Card */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3 px-6 pt-6">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  Bot ma'lumotlari
                </CardTitle>
                <CardDescription>
                  Bot tokenni kiriting va majburiy kanallarni qo'shing
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-6">
                {/* Bot Token */}
                <div className="space-y-2">
                  <Label htmlFor="bot_token" className="text-gray-700 font-medium flex items-center gap-2">
                    <Key className="h-4 w-4 text-purple-500" />
                    Bot Token <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bot_token"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="1234567890:ABCdefGHIjklmNOPqrSTUvwXYZ"
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 font-mono text-sm"
                    type="password"
                  />
                  <p className="text-xs text-gray-400">
                    @BotFather dan olingan bot tokenni kiriting
                  </p>
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-800">Bot faol</p>
                      <p className="text-sm text-gray-500">Bot yoqilgan bo'lsa ishlaydi</p>
                    </div>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>

                {/* Channels */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-700 font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      Majburiy kanallar
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddChannel}
                      className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Kanal qo'shish
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Botga start bosganda obuna tekshiriladigan kanallar (bir nechta bo'lishi mumkin)
                  </p>
                  <div className="space-y-2">
                    {channels.map((ch, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            value={ch}
                            onChange={(e) => handleChannelChange(index, e.target.value)}
                            placeholder="kanal_username"
                            className="pl-9 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                        {channels.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveChannel(index)}
                            className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test result */}
                {testResult && (
                  <div className={`flex items-center gap-3 p-4 rounded-xl ${
                    testResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    {testResult.success
                      ? <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      : <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    }
                    <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {testResult.message}
                    </p>
                  </div>
                )}

                {/* Save button */}
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-6 text-lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Saqlash
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border border-gray-200 shadow-sm bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                  <ExternalLink className="h-4 w-4 text-purple-600" />
                  Bot qanday ishlaydi
                </h3>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Bot tokenni kiriting va saqlang</li>
                  <li>Majburiy kanallarni qo'shing (obuna tekshirish uchun)</li>
                  <li>Bot avtomatik ravishda <code className="bg-purple-100 px-1 rounded">bot/index.js</code> dagi tokenni yangilaydi</li>
                  <li>Studentlar botga /start bosadi → kanal obunasini tekshiradi → telefon nomer + parol orqali kiradi</li>
                  <li>Barcha ma'lumotlarni (profil, to'lovlar, guruh, davomat) bot orqali ko'radi</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
