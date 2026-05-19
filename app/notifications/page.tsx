'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import {
  Bell, Send, History, FileText, Plus, Trash2, Edit, X, CheckCircle,
  AlertCircle, Loader2, Users, User, UserCheck, School, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { notificationApi, type SendNotificationData, type TemplateData } from '@/api/notificationApi';
import { studentsApi } from '@/api/studentApi';
import { teachersApi } from '@/api/teachersApi';
import { groupsApi } from '@/api/groupsApi';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('send');

  // Send form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [targetType, setTargetType] = useState('all_students');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);

  // History
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  // Templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateCategory, setTemplateCategory] = useState('payment');
  const [editTemplateId, setEditTemplateId] = useState<number | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);

  useEffect(() => {
    studentsApi.getAll().then(r => setStudents(r.data || [])).catch(() => {});
    teachersApi.getAll().then(r => setTeachers(r.data || [])).catch(() => {});
    groupsApi.getAll().then(r => setGroups(r.data || [])).catch(() => {});
  }, []);

  const loadHistory = async (page = 1) => {
    setHistoryLoading(true);
    try {
      const res = await notificationApi.findAll(page, 20);
      setHistory(res.data.data || []);
      setHistoryTotal(res.data.total || 0);
      setHistoryPage(page);
    } catch {} finally { setHistoryLoading(false); }
  };

  const loadTemplates = async () => {
    try {
      const res = await notificationApi.findAllTemplates();
      setTemplates(res.data || []);
    } catch {}
  };

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
    if (activeTab === 'templates') loadTemplates();
  }, [activeTab]);

  const handleSend = async () => {
    if (!title.trim()) { toast.error('Sarlavha kiriting'); return; }
    setSending(true);
    setSendResult(null);
    try {
      const data: SendNotificationData = { title: title.trim(), description: description.trim() || undefined, link: link.trim() || undefined };

      switch (targetType) {
        case 'student':
          if (!selectedStudent) { toast.error('Student tanlang'); setSending(false); return; }
          data.student_id = Number(selectedStudent);
          break;
        case 'teacher':
          if (!selectedTeacher) { toast.error("O'qituvchi tanlang"); setSending(false); return; }
          data.teacher_id = Number(selectedTeacher);
          break;
        case 'group':
          if (!selectedGroup) { toast.error('Guruh tanlang'); setSending(false); return; }
          data.group_id = Number(selectedGroup);
          break;
        case 'all_students':
          data.send_to_all_students = true;
          break;
        case 'all_teachers':
          data.send_to_all_teachers = true;
          break;
      }

      const res = await notificationApi.send(data);
      setSendResult(res.data);
      toast.success(`Xabar yuborildi (${res.data.count} ta)`);
      setTitle('');
      setDescription('');
      setLink('');
    } catch (err: any) {
      toast.error(err.message || 'Xatolik');
    } finally { setSending(false); }
  };

  const handleDeleteHistory = async (id: number) => {
    try {
      await notificationApi.remove(id);
      toast.success("O'chirildi");
      loadHistory(historyPage);
    } catch { toast.error('Xatolik'); }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !templateTitle.trim()) { toast.error('Nom va sarlavha kiritish shart'); return; }
    setTemplateSaving(true);
    try {
      const data: TemplateData = {
        name: templateName.trim(),
        title: templateTitle.trim(),
        description: templateDesc.trim() || undefined,
        category: templateCategory,
      };
      if (editTemplateId) {
        await notificationApi.updateTemplate(editTemplateId, data);
        toast.success('Shablon yangilandi');
      } else {
        await notificationApi.createTemplate(data);
        toast.success('Shablon yaratildi');
      }
      setShowTemplateDialog(false);
      setEditTemplateId(null);
      setTemplateName('');
      setTemplateTitle('');
      setTemplateDesc('');
      setTemplateCategory('payment');
      loadTemplates();
    } catch { toast.error('Xatolik'); } finally { setTemplateSaving(false); }
  };

  const handleEditTemplate = (tpl: any) => {
    setEditTemplateId(tpl.id);
    setTemplateName(tpl.name);
    setTemplateTitle(tpl.title);
    setTemplateDesc(tpl.description || '');
    setTemplateCategory(tpl.category || 'payment');
    setShowTemplateDialog(true);
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      await notificationApi.deleteTemplate(id);
      toast.success("O'chirildi");
      loadTemplates();
    } catch { toast.error('Xatolik'); }
  };

  const useTemplate = (tpl: any) => {
    setTitle(tpl.title);
    setDescription(tpl.description || '');
    setActiveTab('send');
    toast.success('Shablon qo\'llanildi');
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Bildirishnomalar</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="send" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Send className="h-4 w-4 mr-1.5" /> Xabar yuborish
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <History className="h-4 w-4 mr-1.5" /> Tarix
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-1.5" /> Shablonlar
            </TabsTrigger>
          </TabsList>

          {/* ====== SEND TAB ====== */}
          <TabsContent value="send" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle>Xabar yuborish</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {sendResult && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      Xabar muvaffaqiyatli yuborildi — {sendResult.count} ta qabul qiluvchiga
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label>Qabul qiluvchi turi</Label>
                  <Select value={targetType} onValueChange={setTargetType}>
                    <SelectTrigger className="w-full md:w-72">
                      <SelectValue placeholder="Tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_students">
                        <div className="flex items-center gap-2"><Users className="h-4 w-4" /> Barcha studentlar</div>
                      </SelectItem>
                      <SelectItem value="all_teachers">
                        <div className="flex items-center gap-2"><UserCheck className="h-4 w-4" /> Barcha o'qituvchilar</div>
                      </SelectItem>
                      <SelectItem value="group">
                        <div className="flex items-center gap-2"><School className="h-4 w-4" /> Guruh bo'yicha</div>
                      </SelectItem>
                      <SelectItem value="student">
                        <div className="flex items-center gap-2"><User className="h-4 w-4" /> Bitta student</div>
                      </SelectItem>
                      <SelectItem value="teacher">
                        <div className="flex items-center gap-2"><UserCheck className="h-4 w-4" /> Bitta o'qituvchi</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {targetType === 'student' && (
                  <div className="space-y-2">
                    <Label>Student</Label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                      <SelectTrigger><SelectValue placeholder="Student tanlang" /></SelectTrigger>
                      <SelectContent>
                        {students.map((s: any) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.first_name} {s.last_name} — {s.phone_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {targetType === 'teacher' && (
                  <div className="space-y-2">
                    <Label>O'qituvchi</Label>
                    <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                      <SelectTrigger><SelectValue placeholder="O'qituvchi tanlang" /></SelectTrigger>
                      <SelectContent>
                        {teachers.map((t: any) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.first_name} {t.last_name} — {t.phone_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {targetType === 'group' && (
                  <div className="space-y-2">
                    <Label>Guruh</Label>
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                      <SelectTrigger><SelectValue placeholder="Guruh tanlang" /></SelectTrigger>
                      <SelectContent>
                        {groups.map((g: any) => (
                          <SelectItem key={g.id} value={String(g.id)}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Sarlavha <span className="text-red-500">*</span></Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Xabar sarlavhasi" />
                </div>

                <div className="space-y-2">
                  <Label>Matn</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Xabar matni..." rows={4} />
                </div>

                <div className="space-y-2">
                  <Label>Havola (ixtiyoriy)</Label>
                  <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSend} disabled={sending} className="bg-blue-600 hover:bg-blue-700">
                    {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Yuborilmoqda...</> : <><Send className="h-4 w-4 mr-2" /> Yuborish</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== HISTORY TAB ====== */}
          <TabsContent value="history" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Yuborilgan xabarlar tarixi</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => loadHistory(historyPage)}>
                    <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                    Yangilash
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                ) : history.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p>Xabarlar mavjud emas</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sarlavha</TableHead>
                          <TableHead>Qabul qiluvchi</TableHead>
                          <TableHead>Vaqt</TableHead>
                          <TableHead>Holat</TableHead>
                          <TableHead className="text-right">Amal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((n: any) => (
                          <TableRow key={n.id}>
                            <TableCell className="font-medium">{n.title}</TableCell>
                            <TableCell>
                              {n.student_id ? <Badge className="bg-blue-100 text-blue-700">Student #{n.student_id}</Badge>
                                : n.teacher_id ? <Badge className="bg-purple-100 text-purple-700">Teacher #{n.teacher_id}</Badge>
                                : n.role ? <Badge className="bg-green-100 text-green-700">{n.role}</Badge>
                                : n.user_id ? <Badge className="bg-gray-100 text-gray-700">User #{n.user_id}</Badge>
                                : <Badge className="bg-orange-100 text-orange-700">Barcha</Badge>}
                            </TableCell>
                            <TableCell className="text-gray-500 text-sm">
                              {new Date(n.createdAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                            <TableCell>
                              {n.is_read ? <Badge className="bg-green-100 text-green-700">O'qilgan</Badge>
                                : <Badge className="bg-amber-100 text-amber-700">Yangi</Badge>}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteHistory(n.id)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {historyTotal > 20 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button variant="outline" size="sm" disabled={historyPage <= 1}
                      onClick={() => loadHistory(historyPage - 1)}>Oldingi</Button>
                    <span className="px-3 py-1 text-sm text-gray-500">
                      {historyPage} / {Math.ceil(historyTotal / 20)}
                    </span>
                    <Button variant="outline" size="sm" disabled={historyPage >= Math.ceil(historyTotal / 20)}
                      onClick={() => loadHistory(historyPage + 1)}>Keyingi</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== TEMPLATES TAB ====== */}
          <TabsContent value="templates" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tayyor shablonlar</CardTitle>
                  <Button onClick={() => { setEditTemplateId(null); setTemplateName(''); setTemplateTitle(''); setTemplateDesc(''); setTemplateCategory('payment'); setShowTemplateDialog(true); }}>
                    <Plus className="h-4 w-4 mr-1.5" /> Yangi shablon
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p>Shablonlar mavjud emas</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((tpl: any) => (
                      <Card key={tpl.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={
                              tpl.category === 'payment' ? 'bg-green-100 text-green-700' :
                              tpl.category === 'holiday' ? 'bg-red-100 text-red-700' :
                              tpl.category === 'event' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              {tpl.category === 'payment' ? "To'lov" :
                               tpl.category === 'holiday' ? 'Bayram' :
                               tpl.category === 'event' ? "Tadbir" : 'Boshqa'}
                            </Badge>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(tpl)} className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(tpl.id)} className="h-8 w-8 p-0">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                          <h3 className="font-semibold text-gray-900">{tpl.title}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{tpl.description || 'Tavsif yo\'q'}</p>
                          <p className="text-xs text-gray-400 mt-2">{tpl.name}</p>
                          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => useTemplate(tpl)}>
                            <Send className="h-3 w-3 mr-1" /> Foydalanish
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editTemplateId ? 'Shablonni tahrirlash' : 'Yangi shablon'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom (ichki) <span className="text-red-500">*</span></Label>
              <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Masalan: To'lov eslatmasi" />
            </div>
            <div className="space-y-2">
              <Label>Sarlavha <span className="text-red-500">*</span></Label>
              <Input value={templateTitle} onChange={e => setTemplateTitle(e.target.value)} placeholder="Xabar sarlavhasi" />
            </div>
            <div className="space-y-2">
              <Label>Matn</Label>
              <Textarea value={templateDesc} onChange={e => setTemplateDesc(e.target.value)} rows={3} placeholder="Xabar matni..." />
            </div>
            <div className="space-y-2">
              <Label>Kategoriya</Label>
              <Select value={templateCategory} onValueChange={setTemplateCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment">To'lov</SelectItem>
                  <SelectItem value="holiday">Bayram</SelectItem>
                  <SelectItem value="event">Tadbir</SelectItem>
                  <SelectItem value="other">Boshqa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Bekor qilish</Button>
            <Button onClick={handleSaveTemplate} disabled={templateSaving} className="bg-blue-600">
              {templateSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saqlanmoqda...</> : 'Saqlash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
