'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, Loader2, Users, User, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';
import { telegramBotApi, getCenterIdOrThrow } from '@/api/telegramBotApi';
import { groupsApi } from '@/api/groupsApi';
import { studentsApi } from '@/api/studentApi';

export default function SendMessagePage() {
  const [centerId, setCenterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [targetType, setTargetType] = useState('all');
  const [targetId, setTargetId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const [groups, setGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');

  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');

  const init = useCallback(async () => {
    try {
      const cid = await getCenterIdOrThrow();
      setCenterId(cid);
      const [tpls, grps] = await Promise.all([
        telegramBotApi.getTemplates(cid),
        groupsApi.getAll({ limit: 200 }),
      ]);
      setTemplates(tpls || []);
      setGroups(grps?.data || []);
    } catch { toast.error('Xatolik'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (targetType === 'student' && studentSearch.length >= 2) {
      const timer = setTimeout(async () => {
        setStudentsLoading(true);
        try {
          const res = await studentsApi.getAll({ search: studentSearch, limit: 20 });
          setStudents(res.data || []);
        } catch { setStudents([]); }
        finally { setStudentsLoading(false); }
      }, 400);
      return () => clearTimeout(timer);
    } else if (targetType === 'student') {
      setStudents([]);
    }
  }, [studentSearch, targetType]);

  const replacePlaceholders = (text: string): string => {
    return text
      .replace(/\{ism\}/g, 'Ism')
      .replace(/\{familiya\}/g, 'Familiya')
      .replace(/\{tel\}/g, 'Telefon')
      .replace(/\{guruh\}/g, 'Guruh')
      .replace(/\{markaz\}/g, 'Markaz');
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tpl = templates.find(t => String(t.id) === templateId);
    if (tpl) setMessageText(tpl.content);
  };

  const getTargetId = (): number | undefined => {
    if (targetType === 'group') {
      return selectedGroup ? Number(selectedGroup) : undefined;
    }
    if (targetType === 'student') {
      return selectedStudent ? Number(selectedStudent) : undefined;
    }
    return undefined;
  };

  const handleSend = async () => {
    if (!messageText.trim()) {
      toast.error('Xabar matnini kiriting');
      return;
    }
    if (!centerId) return;
    if ((targetType === 'group' && !selectedGroup) || (targetType === 'student' && !selectedStudent)) {
      toast.error(targetType === 'group' ? 'Guruh tanlang' : 'Student tanlang');
      return;
    }

    setSending(true);
    try {
      const payload: any = {
        target_type: targetType,
        text: messageText.trim(),
      };
      const tid = getTargetId();
      if (tid) payload.target_id = tid;
      if (selectedTemplate) payload.template_id = Number(selectedTemplate);

      const result = await telegramBotApi.sendMessage(centerId, payload);
      toast.success(
        `Xabar jo'natildi!\nJami: ${result.total_count}\nYuborildi: ${result.sent_count}\nXatolik: ${result.failed_count}`
      );
      setMessageText('');
      setSelectedTemplate('');
      setSelectedGroup('');
      setSelectedStudent('');
      setStudentSearch('');
    } catch (err: any) {
      toast.error(err.message || 'Xatolik');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 rounded-xl" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Send className="h-5 w-5 text-blue-600" />
            Xabar yuborish
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Qabul qiluvchilar</Label>
            <Select value={targetType} onValueChange={(v) => { setTargetType(v); setSelectedGroup(''); setSelectedStudent(''); setStudentSearch(''); }}>
              <SelectTrigger>
                <SelectValue placeholder="Tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2"><Users className="h-4 w-4" /> Barcha studentlar</div>
                </SelectItem>
                <SelectItem value="group">
                  <div className="flex items-center gap-2"><Users className="h-4 w-4" /> Guruh bo'yicha</div>
                </SelectItem>
                <SelectItem value="student">
                  <div className="flex items-center gap-2"><User className="h-4 w-4" /> Bitta student</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetType === 'group' && (
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Guruhni tanlang</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Guruhni tanlang..." />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {targetType === 'student' && (
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Studentni qidirish</Label>
              <Input
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                placeholder="Ism, familiya yoki telefon raqam..."
              />
              {studentsLoading && <p className="text-xs text-gray-400">Qidirilmoqda...</p>}
              {students.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-1">
                  {students.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        String(s.id) === selectedStudent ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedStudent(String(s.id))}
                    >
                      {s.first_name} {s.last_name} {s.phone_number ? `— ${s.phone_number}` : ''}
                    </button>
                  ))}
                </div>
              )}
              {selectedStudent && (() => {
                const s = students.find(st => String(st.id) === selectedStudent);
                return s ? (
                  <p className="text-xs text-green-600">Tanlandi: {s.first_name} {s.last_name}</p>
                ) : null;
              })()}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Shablondan foydalanish (ixtiyoriy)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Shablon tanlang" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">
              Xabar matni <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Xabar matnini kiriting..."
              rows={6}
            />
            <p className="text-xs text-gray-400">
              Placeholderlar: {'{ism}'}, {'{familiya}'}, {'{tel}'}, {'{guruh}'}, {'{markaz}'}
            </p>
            {messageText && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <div className="flex items-center gap-1 mb-1 font-medium text-gray-700">
                  <Eye className="h-3.5 w-3.5" /> Ko'rinishi:
                </div>
                {replacePlaceholders(messageText)}
              </div>
            )}
          </div>

          <Button onClick={handleSend} disabled={sending}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6">
            {sending ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Jo'natilmoqda...</>
            ) : (
              <><Send className="h-5 w-5 mr-2" /> Xabarni jo'natish</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
