'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Bell, Settings, BarChart3, Save, Loader2, Clock, MessageSquare,
  CheckCircle, XCircle, PhoneOff, Calendar, ToggleRight, Send,
  AlertTriangle, Info, RefreshCw, Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import { autoNotificationApi } from '../../api/autoNotificationApi';
import { smsApi } from '@/api/smsApi';

function getCenterId(): number | null {
  try {
    const admin = JSON.parse(localStorage.getItem('admin') || '{}');
    return admin.center_id || null;
  } catch { return null; }
}

export default function AutoNotificationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [centerId, setCenterId] = useState<number | null>(null);

  // Config state
  const [enabled, setEnabled] = useState(false);
  const [sendTelegram, setSendTelegram] = useState(true);
  const [sendTimes, setSendTimes] = useState<string[]>(['09:00', '14:00', '20:00']);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [timeInput, setTimeInput] = useState('');

  // SMS config state
  const [sendSms, setSendSms] = useState(false);
  const [smsTemplateCategory, setSmsTemplateCategory] = useState('debt_reminder');
  const [smsTemplates, setSmsTemplates] = useState<Array<{ id: string; title: string }>>([]);

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const cid = getCenterId();
      if (!cid) { toast.error('Markaz aniqlanmadi'); return; }
      setCenterId(cid);

      const [configRes, statsRes, templatesRes] = await Promise.all([
        autoNotificationApi.getConfig(cid),
        autoNotificationApi.getStats(cid),
        smsApi.getTemplates().catch(() => []),
      ]);
      setSmsTemplates(templatesRes || []);
      const config = configRes.data;
      setEnabled(config.enabled);
      setSendTelegram(config.send_telegram);
      setSendSms(config.send_sms || false);
      setSmsTemplateCategory(config.sms_template_category || 'debt_reminder');
      setMessageTemplate(config.message_template || '');
      try {
        setSendTimes(JSON.parse(config.send_times || '[]'));
      } catch { setSendTimes(['09:00', '14:00', '20:00']); }
      setStats(statsRes.data);
    } catch (err: any) {
      toast.error('Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const loadLogs = async (page = 1) => {
    if (!centerId) return;
    try {
      const res = await autoNotificationApi.getLogs(centerId, page, 50);
      setLogs(res.data.data);
      setLogTotal(res.data.total);
      setLogPage(page);
    } catch { /* ignore */ }
  };

  const handleSave = async () => {
    if (!centerId) return;
    try {
      setSaving(true);
      await autoNotificationApi.updateConfig(centerId, {
        enabled,
        send_telegram: sendTelegram,
        send_sms: sendSms,
        sms_template_category: smsTemplateCategory,
        send_times: sendTimes,
        message_template: messageTemplate,
      });
      toast.success('Sozlamalar saqlandi');
      const statsRes = await autoNotificationApi.getStats(centerId);
      setStats(statsRes.data);
    } catch {
      toast.error('Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async () => {
    if (!centerId) return;
    try {
      setTesting(true);
      const res = await autoNotificationApi.triggerManual(centerId);
      if (res.data?.success) {
        toast.success(res.data?.message || 'Test jo\'natildi');
      } else {
        toast.error(res.data?.message || 'Jo\'natishda xatolik');
      }
      loadLogs(1);
      const statsRes = await autoNotificationApi.getStats(centerId);
      setStats(statsRes.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Test jo\'natishda xatolik');
    } finally {
      setTesting(false);
    }
  };

  const addTime = () => {
    if (!timeInput) return;
    if (sendTimes.includes(timeInput)) { toast.error('Bu vaqt allaqachon qo\'shilgan'); return; }
    setSendTimes([...sendTimes, timeInput].sort());
    setTimeInput('');
  };

  const removeTime = (t: string) => {
    setSendTimes(sendTimes.filter(v => v !== t));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <Layout><div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Bell className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avto bildirishnomalar</h1>
          <p className="text-sm text-gray-500">To'lov qilmagan studentlarga avtomatik xabar jo'natish</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button
            onClick={handleTestSend}
            disabled={testing}
            variant="outline"
            className="border-blue-200 text-blue-700"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Test jo'natish
          </Button>
          <Badge className={`px-4 py-1.5 text-sm ${enabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
            {enabled ? 'FAOL' : 'FAOL EMAS'}
          </Badge>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Eslatma</p>
          <p>Avtomatik xabarlar har 2 daqiqada tekshiriladi (Toshkent vaqti bilan). Siz belgilagan vaqtda to'lov qilmagan studentlarga xabar ketadi.</p>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Settings className="h-4 w-4 mr-2" />
            Sozlamalar
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Hisobot
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Xabarlar
          </TabsTrigger>
        </TabsList>

        {/* ─── Settings Tab ─── */}
        <TabsContent value="settings">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ToggleRight className="h-5 w-5 text-blue-600" />
                  Asosiy sozlamalar
                </CardTitle>
                <CardDescription>Avtomatik xabar jo'natishni yoqish/o'chirish</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">Avtomatik jo'natish</p>
                    <p className="text-sm text-gray-500">To'lov qilmagan studentlarga avtomatik xabar jo'natish</p>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={setEnabled}
                    className="data-[state=checked]:bg-green-500! data-[state=unchecked]:bg-gray-300!"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">Telegram orqali jo'natish</p>
                    <p className="text-sm text-gray-500">Telegram bot orqali xabar jo'natish</p>
                  </div>
                  <Switch
                    checked={sendTelegram}
                    onCheckedChange={setSendTelegram}
                    className="data-[state=checked]:bg-blue-500! data-[state=unchecked]:bg-gray-300!"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900">SMS orqali jo'natish</p>
                    <p className="text-sm text-gray-500">SMS orqali eslatma yuborish (debt_reminder shabloni asosida)</p>
                  </div>
                  <Switch
                    checked={sendSms}
                    onCheckedChange={setSendSms}
                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300"
                  />
                </div>

                {sendSms && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <Label className="text-sm font-medium">SMS shabloni</Label>
                    <Select value={smsTemplateCategory} onValueChange={setSmsTemplateCategory}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Shablonni tanlang..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {smsTemplates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-400 mt-1">Avtomatik SMS uchun ishlatiladigan shablon</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Jo'natish vaqtlari
                </CardTitle>
                <CardDescription>Kuniga necha marta va qaysi vaqtlarda xabar jo'natilishi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {sendTimes.map(t => (
                    <Badge key={t} variant="outline" className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {t}
                      <button onClick={() => removeTime(t)} className="text-blue-400 hover:text-red-500 ml-1">&times;</button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={timeInput}
                    onChange={e => setTimeInput(e.target.value)}
                    className="w-40"
                  />
                  <Button variant="outline" onClick={addTime} className="border-blue-200 text-blue-700">
                    Vaqt qo'shish
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Xabar matni
                </CardTitle>
                <CardDescription>
                  Quyidagi placeholderlardan foydalanishingiz mumkin: {'{ism}'}, {'{familiya}'}, {'{tel}'}, {'{guruh}'}, {'{markaz}'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={messageTemplate}
                  onChange={e => setMessageTemplate(e.target.value)}
                  rows={4}
                  className="text-base"
                  placeholder="Assalomu alaykum, {ism}! Sizning to'lovingiz muddati o'tgan. Iltimos, o'quv markaziga murojaat qiling."
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                onClick={handleTestSend}
                disabled={testing}
                variant="outline"
                className="border-blue-200 text-blue-700"
              >
                {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Test jo'natish
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 shadow-lg">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Saqlash
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ─── Reports Tab ─── */}
        <TabsContent value="reports">
          <div className="grid gap-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold">{stats?.totalLogs || 0}</p>
                  <p className="text-xs text-gray-500">Jami jo'natilgan</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">{stats?.todayLogs || 0}</p>
                  <p className="text-xs text-gray-500">Bugun</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{stats?.totalSent || 0}</p>
                  <p className="text-xs text-gray-500">Yetkazilgan</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <XCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold">{stats?.totalFailed || 0}</p>
                  <p className="text-xs text-gray-500">Yetkazilmagan</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <PhoneOff className="h-6 w-6 mx-auto mb-2 text-gray-500" />
                  <p className="text-2xl font-bold">{stats?.noTelegram || 0}</p>
                  <p className="text-xs text-gray-500">Telegram bog'lanmagan</p>
                </CardContent>
              </Card>
            </div>

            {stats?.last7Days && stats.last7Days.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Oxirgi 7 kunlik hisobot</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.last7Days.map((day: any) => (
                      <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{day.date}</span>
                        <div className="flex gap-4 text-sm">
                          <span className="text-blue-600">Jami: {day.count}</span>
                          <span className="text-green-600">Yetkazilgan: {day.sent || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ─── Logs Tab ─── */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Yuborilgan xabarlar
              </CardTitle>
              <CardDescription>
                <Button variant="link" className="p-0 h-auto text-blue-600" onClick={() => loadLogs()}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Yangilash
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Hali xabarlar yo'q</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {logs.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="font-medium text-gray-900 truncate">{log.message_text}</p>
                          <p className="text-xs text-gray-400">
                            Student ID: {log.student_id}
                            {log.telegram_chat_id ? ` | Chat: ${log.telegram_chat_id}` : ' | Telegram yo\'q'}
                          </p>
                          {log.telegram_error && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Xatolik: {log.telegram_error}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-400">
                            {new Date(log.createdAt).toLocaleString('uz-UZ')}
                          </span>
                          {log.telegram_sent ? (
                            <span title="Yetkazildi"><CheckCircle className="h-4 w-4 text-green-500" /></span>
                          ) : log.telegram_chat_id ? (
                            <div className="flex items-center gap-1">
                              <span title="Xatolik"><XCircle className="h-4 w-4 text-red-500" /></span>
                              <span title={log.telegram_error || 'Noma\'lum xatolik'}><Info className="h-3 w-3 text-red-400" /></span>
                            </div>
                          ) : (
                            <span title="Telegram bog'lanmagan"><PhoneOff className="h-4 w-4 text-gray-400" /></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {logTotal > 50 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button variant="outline" size="sm" disabled={logPage <= 1}
                        onClick={() => loadLogs(logPage - 1)}>
                        Oldingi
                      </Button>
                      <span className="text-sm text-gray-500 self-center">
                        {logPage} / {Math.ceil(logTotal / 50)}
                      </span>
                      <Button variant="outline" size="sm" disabled={logPage >= Math.ceil(logTotal / 50)}
                        onClick={() => loadLogs(logPage + 1)}>
                        Keyingi
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div></Layout>
  );
}
