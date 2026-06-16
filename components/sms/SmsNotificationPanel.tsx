'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Send, Loader2, Users, MessageSquare, Eye,
  CheckCircle, XCircle, AlertTriangle, Search,
  GraduationCap, BookOpen, Key, UserCheck, X,
  RefreshCw, CheckSquare, Square,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useSendSms } from '@/hooks/useSms';
import { smsApi } from '@/api/smsApi';
import type { SmsTemplate, StudentBrief, RecipientType } from '@/types/sms.types';
import toast from 'react-hot-toast';

interface Props {
  templates: SmsTemplate[];
  centerId: number;
}

export default function SmsNotificationPanel({ templates, centerId }: Props) {
  const { sendToStudent, sendToAllStudents, sendToTeacher, sendToAllTeachers, sendToGroup, sending } = useSendSms();

  // ─── Asosiy state ───
  const [recipientType, setRecipientType] = useState<RecipientType>('single_student');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('login_credentials');
  const [customMessage, setCustomMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [centerName, setCenterName] = useState('');

  // ─── Studentlar ───
  const [allStudents, setAllStudents] = useState<StudentBrief[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentBrief | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<StudentBrief[]>([]);

  // ─── Teacher ───
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  // ─── Guruhlar ───
  const [allGroups, setAllGroups] = useState<Array<{ id: number; name: string }>>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  // ─── Qarzdorlik ma'lumoti ───
  const [debtData, setDebtData] = useState<{ oy: string; summa: string } | null>(null);
  const [debtLoading, setDebtLoading] = useState(false);

  // ─── Yuklash ───
  useEffect(() => {
    (async () => {
      try {
        const admin = JSON.parse(localStorage.getItem('admin') || '{}');
        if (admin.center_name) setCenterName(admin.center_name);
        else if (admin.name) setCenterName(admin.name);
        else {
          const info = await smsApi.getCenterInfo();
          setCenterName(info?.name || '');
        }
      } catch {}
    })();
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setStudentsLoading(true);
    try {
      const res = await smsApi.searchStudents({ page: 1, limit: 99999 });
      setAllStudents(res.data || []);
    } catch { setAllStudents([]); }
    finally { setStudentsLoading(false); }
  };

  const loadTeachers = async () => {
    setTeachersLoading(true);
    try {
      const res = await smsApi.searchTeachers({ page: 1, limit: 99999 });
      setAllTeachers(res.data || []);
    } catch { setAllTeachers([]); }
    finally { setTeachersLoading(false); }
  };

  const loadGroups = async () => {
    setGroupsLoading(true);
    try {
      const res = await smsApi.listGroups({});
      setAllGroups(res || []);
    } catch { setAllGroups([]); }
    finally { setGroupsLoading(false); }
  };

  useEffect(() => {
    if (recipientType === 'single_teacher' || recipientType === 'all_teachers') loadTeachers();
    if (recipientType === 'group_students') loadGroups();
    if (recipientType === 'selected_students' && allStudents.length === 0) loadStudents();
  }, [recipientType]);

  // debt_reminder shabloni tanlansa va student tanlansa — qarzdorlikni yuklash
  useEffect(() => {
    if (selectedTemplate !== 'debt_reminder' || !selectedStudent) {
      setDebtData(null);
      return;
    }
    (async () => {
      setDebtLoading(true);
      try {
        const res = await smsApi.getStudentDebt(selectedStudent.id);
        if (res?.debts && res.debts.length > 0) {
          const first = res.debts[0];
          const months = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
          const monthName = first.month_name || months[first.month] || `${first.month}-oy`;
          const debtSum = first.amount || res.total_debt || 0;
          setDebtData({ oy: monthName, summa: Number(debtSum).toLocaleString() });
        } else {
          const now = new Date();
          const months = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
          setDebtData({ oy: months[now.getMonth() + 1] || '', summa: '0' });
        }
      } catch {
        setDebtData(null);
      }
      finally { setDebtLoading(false); }
    })();
  }, [selectedTemplate, selectedStudent]);

  // ─── Filterlangan student/teacher list ───
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery) return allStudents;
    const q = studentSearchQuery.toLowerCase();
    return allStudents.filter(s =>
      s.first_name?.toLowerCase().includes(q) ||
      (s.last_name || '').toLowerCase().includes(q) ||
      (s.phone_number || '').toLowerCase().includes(q)
    );
  }, [allStudents, studentSearchQuery]);

  const filteredTeachers = useMemo(() => {
    if (!teacherSearchQuery) return allTeachers;
    const q = teacherSearchQuery.toLowerCase();
    return allTeachers.filter((t: any) =>
      t.first_name?.toLowerCase().includes(q) ||
      (t.last_name || '').toLowerCase().includes(q) ||
      (t.phone_number || '').includes(q)
    );
  }, [allTeachers, teacherSearchQuery]);

  // ─── Shablon ───
  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  const buildResolvedMessage = useCallback((student: StudentBrief, template: SmsTemplate | undefined, custom: string, debt?: { oy: string; summa: string } | null) => {
    if (!template) return custom;
    let msg = template.body;
    msg = msg.replace(/\{ism\}/g, student.first_name);
    msg = msg.replace(/\{familiya\}/g, student.last_name || '');
    msg = msg.replace(/\{markaz\}/g, centerName);
    msg = msg.replace(/\{login\}/g, student.phone_number || '');
    msg = msg.replace(/\{password\}/g, '********');
    msg = msg.replace(/\{bot\}/g, '');
    msg = msg.replace(/\{oy\}/g, debt?.oy || '');
    msg = msg.replace(/\{summa\}/g, debt?.summa || '');
    return msg;
  }, [centerName]);

  const previewMessage = useMemo(() => {
    if (selectedTemplate === '' || !currentTemplate) return customMessage;
    if (recipientType === 'single_student' && selectedStudent) {
      return buildResolvedMessage(selectedStudent, currentTemplate, customMessage, debtData);
    }
    if ((recipientType === 'selected_students' || recipientType === 'group_students' || recipientType === 'all_students') && allStudents.length > 0) {
      const sample = selectedStudents[0] || allStudents[0];
      if (sample) return buildResolvedMessage(sample, currentTemplate, customMessage, debtData);
    }
    if (recipientType === 'single_teacher') return customMessage;
    if (allStudents.length > 0) {
      return buildResolvedMessage(allStudents[0], currentTemplate, customMessage, debtData);
    }
    return currentTemplate.body;
  }, [selectedTemplate, currentTemplate, customMessage, recipientType, selectedStudent, selectedStudents, allStudents, debtData, buildResolvedMessage]);

  // ─── Tanlash helper ───
  const toggleStudent = (s: StudentBrief) => {
    setSelectedStudents(prev =>
      prev.find(x => x.id === s.id) ? prev.filter(x => x.id !== s.id) : [...prev, s]
    );
  };

  const toggleGroup = (id: number) => {
    setSelectedGroupIds(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  // ─── Jo'natish ───
  const smsVars = useMemo(() => {
    if (!debtData) return undefined;
    return { oy: debtData.oy, summa: debtData.summa };
  }, [debtData]);

  const sendCredentials = async (student: StudentBrief) => {
    try {
      await smsApi.sendCredentials({ student_id: student.id });
      toast.success(`${student.first_name} ${student.last_name} — login/password yuborildi`);
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik');
      return false;
    }
  };

  const handleSend = async () => {
    setShowConfirm(false);
    let successCount = 0;
    let failCount = 0;

    try {
      switch (recipientType) {
        case 'single_student': {
          if (!selectedStudent) return;
          if (selectedTemplate === 'login_credentials') {
            const ok = await sendCredentials(selectedStudent);
            if (ok) successCount = 1;
            else failCount = 1;
          } else {
            const res = await sendToStudent({ student_id: selectedStudent.id, template_or_message: selectedTemplate || customMessage, variables: smsVars });
            if (res?.success) successCount = 1;
            else failCount = 1;
          }
          break;
        }
        case 'all_students': {
          const res = await sendToAllStudents({ template_or_message: selectedTemplate || customMessage, variables: smsVars });
          if (res?.success) successCount = res.success || 0;
          failCount = res?.failed || 0;
          break;
        }
        case 'single_teacher': {
          if (!selectedTeacher) return;
          const res = await sendToTeacher({ teacher_id: selectedTeacher.id, message: customMessage });
          if (res?.success) successCount = 1;
          else failCount = 1;
          break;
        }
        case 'all_teachers': {
          const res = await sendToAllTeachers({ message: customMessage });
          if (res?.success) successCount = res.success || 0;
          failCount = res?.failed || 0;
          break;
        }
        case 'group_students': {
          if (selectedGroupIds.length === 0) { toast.error('Kamida 1 ta guruh tanlang'); return; }
          for (const gid of selectedGroupIds) {
            const res = await sendToGroup({ group_id: gid, template_or_message: selectedTemplate || customMessage, variables: smsVars });
            if (res?.success) successCount++;
            else failCount++;
          }
          break;
        }
        case 'selected_students': {
          if (selectedStudents.length === 0) { toast.error('Kamida 1 ta student tanlang'); return; }
          for (const s of selectedStudents) {
            if (selectedTemplate === 'login_credentials') {
              const ok = await sendCredentials(s);
              if (ok) successCount++;
              else failCount++;
            } else {
              const res = await sendToStudent({ student_id: s.id, template_or_message: selectedTemplate || customMessage, variables: smsVars });
              if (res?.success) successCount++;
              else failCount++;
            }
          }
          break;
        }
      }
      setResult({ success: successCount, failed: failCount });
      if (failCount === 0) toast.success(`${successCount} ta SMS muvaffaqiyatli yuborildi`);
      else toast.error(`${successCount} ta yuborildi, ${failCount} ta xato`);
    } catch (err: any) {
      toast.error(err?.message || 'Xatolik yuz berdi');
    }
  };

  // ─── Send button text ───
  const sendButtonText = useMemo(() => {
    switch (recipientType) {
      case 'single_student': return selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}ga SMS yuborish` : 'Student tanlanmagan';
      case 'all_students': return 'Barcha studentlarga SMS yuborish';
      case 'single_teacher': return selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}ga SMS yuborish` : "O'qituvchi tanlanmagan";
      case 'all_teachers': return "Barcha o'qituvchilarga SMS yuborish";
      case 'group_students': return selectedGroupIds.length > 0 ? `${selectedGroupIds.length} ta guruhga SMS yuborish` : 'Guruh tanlanmagan';
      case 'selected_students': return selectedStudents.length > 0 ? `${selectedStudents.length} ta studentga SMS yuborish` : 'Student tanlanmagan';
      default: return 'SMS yuborish';
    }
  }, [recipientType, selectedStudent, selectedTeacher, selectedGroupIds, selectedStudents]);

  const canSend = useMemo(() => {
    switch (recipientType) {
      case 'single_student': return !!selectedStudent;
      case 'all_students': return true;
      case 'single_teacher': return !!selectedTeacher;
      case 'all_teachers': return true;
      case 'group_students': return selectedGroupIds.length > 0;
      case 'selected_students': return selectedStudents.length > 0;
      default: return false;
    }
  }, [recipientType, selectedStudent, selectedTeacher, selectedGroupIds, selectedStudents]);

  const recipientCount = useMemo(() => {
    switch (recipientType) {
      case 'single_student': return 1;
      case 'all_students': return allStudents.length;
      case 'single_teacher': return 1;
      case 'all_teachers': return allTeachers.length;
      case 'group_students': return selectedGroupIds.length;
      case 'selected_students': return selectedStudents.length;
      default: return 0;
    }
  }, [recipientType, allStudents, allTeachers, selectedGroupIds, selectedStudents]);

  return (
    <div className="space-y-6">
      {/* ───────── RECIPIENT TYPE ───────── */}
      <Card>
        <CardContent className="p-5 space-y-5">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" /> SMS yuborish
            <Badge variant="outline" className="ml-auto text-xs bg-blue-50 text-blue-700 border-blue-200">
              {recipientCount} ta qabul qiluvchi
            </Badge>
          </h3>

          <div className="flex flex-wrap gap-2">
            {[
              { key: 'single_student', label: 'Bitta student', icon: GraduationCap },
              { key: 'all_students', label: 'Barcha studentlar', icon: Users },
              { key: 'single_teacher', label: "Bitta o'qituvchi", icon: UserCheck },
              { key: 'all_teachers', label: "Barcha o'qituvchilar", icon: Users },
              { key: 'group_students', label: 'Guruh lar', icon: BookOpen },
              { key: 'selected_students', label: 'Tanlangan studentlar', icon: CheckSquare },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={recipientType === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setRecipientType(key as RecipientType); }}
                className={recipientType === key ? 'bg-blue-600' : ''}
              >
                <Icon className="h-4 w-4 mr-1" /> {label}
              </Button>
            ))}
          </div>

          {/* ───────── STUDENT TANLASH ───────── */}
          {(recipientType === 'single_student' || recipientType === 'selected_students') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {recipientType === 'single_student' ? 'Studentni tanlang' : 'Studentlarni tanlang'}
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{allStudents.length} ta student</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2" onClick={loadStudents} disabled={studentsLoading}>
                    <RefreshCw className={`h-3 w-3 ${studentsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={studentSearchQuery}
                  onChange={e => setStudentSearchQuery(e.target.value)}
                  placeholder="Ism, familiya yoki telefon bo'yicha qidirish..."
                  className="pl-9"
                />
              </div>

              {studentsLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Yuklanmoqda...
                </div>
              ) : (
                <>
                  {recipientType === 'selected_students' && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setSelectedStudents(filteredStudents)}
                      >
                        Hammasini tanlash
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setSelectedStudents([])}
                      >
                        Bekor qilish
                      </Button>
                    </div>
                  )}

                  <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                    {filteredStudents.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        {studentSearchQuery ? 'Hech narsa topilmadi' : 'Studentlar mavjud emas'}
                      </div>
                    ) : filteredStudents.map(s => {
                      const isSelected = recipientType === 'single_student'
                        ? selectedStudent?.id === s.id
                        : selectedStudents.find(x => x.id === s.id) != null;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                            isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            if (recipientType === 'single_student') setSelectedStudent(s);
                            else toggleStudent(s);
                          }}
                        >
                          {recipientType === 'selected_students' && (
                            isSelected
                              ? <CheckSquare className="h-4 w-4 text-blue-600 shrink-0" />
                              : <Square className="h-4 w-4 text-gray-300 shrink-0" />
                          )}
                          <span className="font-medium text-gray-900">
                            {s.first_name} {s.last_name}
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">{s.phone_number}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tanlangan studentlar badges */}
                  {recipientType === 'selected_students' && selectedStudents.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedStudents.map(s => (
                        <Badge
                          key={s.id}
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 px-2 py-1"
                        >
                          {s.first_name} {s.last_name}
                          <button onClick={() => toggleStudent(s)} className="text-green-400 hover:text-red-500 ml-1">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {recipientType === 'single_student' && selectedStudent && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800 text-sm">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                          <p className="text-xs text-green-600">{selectedStudent.phone_number}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-300">Tanlandi</Badge>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ───────── O'QITUVCHI TANLASH ───────── */}
          {recipientType === 'single_teacher' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">O'qituvchini tanlang</Label>
                <span className="text-xs text-gray-400">{allTeachers.length} ta o'qituvchi</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={teacherSearchQuery}
                  onChange={e => setTeacherSearchQuery(e.target.value)}
                  placeholder="Ism, familiya yoki telefon..."
                  className="pl-9"
                />
              </div>
              {teachersLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Yuklanmoqda...
                </div>
              ) : (
                <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                  {filteredTeachers.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">O'qituvchilar mavjud emas</div>
                  ) : filteredTeachers.map((t: any) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                        selectedTeacher?.id === t.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedTeacher(t)}
                    >
                      <span className="font-medium">{t.first_name} {t.last_name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{t.phone_number}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedTeacher && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 text-sm">{selectedTeacher.first_name} {selectedTeacher.last_name}</p>
                      <p className="text-xs text-green-600">{selectedTeacher.phone_number}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-300">Tanlandi</Badge>
                </div>
              )}
            </div>
          )}

          {/* ───────── GURUH TANLASH (MULTI) ───────── */}
          {recipientType === 'group_students' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Guruhlarni tanlang</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{allGroups.length} ta guruh</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2" onClick={loadGroups} disabled={groupsLoading}>
                    <RefreshCw className={`h-3 w-3 ${groupsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              {selectedGroupIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedGroupIds.map(gid => {
                    const g = allGroups.find(x => x.id === gid);
                    return (
                      <Badge key={gid} variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 px-2 py-1">
                        {g?.name || gid}
                        <button onClick={() => toggleGroup(gid)} className="text-green-400 hover:text-red-500 ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 text-xs text-gray-500 mb-1">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs"
                  onClick={() => setSelectedGroupIds(allGroups.map(g => g.id))}>
                  Hammasini tanlash
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs"
                  onClick={() => setSelectedGroupIds([])}>
                  Bekor qilish
                </Button>
              </div>

              {groupsLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Yuklanmoqda...
                </div>
              ) : (
                <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                  {allGroups.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">Guruhlar mavjud emas</div>
                  ) : allGroups.map(g => (
                    <button
                      key={g.id}
                      type="button"
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                        selectedGroupIds.includes(g.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleGroup(g.id)}
                    >
                      {selectedGroupIds.includes(g.id)
                        ? <CheckSquare className="h-4 w-4 text-blue-600 shrink-0" />
                        : <Square className="h-4 w-4 text-gray-300 shrink-0" />
                      }
                      <span className="font-medium text-gray-900">{g.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ───────── SHABLON TANLASH ───────── */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Shablon tanlash</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {templates.map(t => (
                <Button
                  key={t.id}
                  variant={selectedTemplate === t.id ? 'default' : 'outline'}
                  size="sm"
                  className={`justify-start h-auto py-2.5 ${selectedTemplate === t.id ? 'bg-blue-600' : ''}`}
                  onClick={() => { setSelectedTemplate(t.id); setCustomMessage(''); }}
                >
                  {t.id === 'login_credentials' ? <Key className="h-4 w-4 mr-1.5 shrink-0" /> : <MessageSquare className="h-4 w-4 mr-1.5 shrink-0" />}
                  <span className="text-xs truncate">{t.title}</span>
                </Button>
              ))}
              <Button
                variant={selectedTemplate === '' ? 'default' : 'outline'}
                size="sm"
                className={selectedTemplate === '' ? 'bg-blue-600' : ''}
                onClick={() => { setSelectedTemplate(''); setCustomMessage(''); }}
              >
                <MessageSquare className="h-4 w-4 mr-1.5 shrink-0" />
                Maxsus xabar
              </Button>
            </div>
          </div>

          {/* ───────── MAXSUS XABAR ───────── */}
          {!selectedTemplate && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Xabar matni</Label>
              <Textarea
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="SMS matnini kiriting..."
                rows={3}
              />
            </div>
          )}

          {/* ───────── SMS KO'RINISHI ───────── */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="flex items-center gap-2 font-medium text-gray-700">
                <Eye className="h-4 w-4" /> SMS ko'rinishi
              </span>
              <Badge variant="outline" className="text-xs bg-white">
                {previewMessage.length}/160 belgi
              </Badge>
            </button>
            {showPreview && (
              <div className="p-4 space-y-3">
                {currentTemplate && recipientType === 'single_student' && selectedStudent ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{previewMessage}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {currentTemplate.variables.map(v => {
                        const val = (() => {
                          if (!selectedStudent) return '';
                          switch (v) {
                            case 'ism': return selectedStudent.first_name;
                            case 'familiya': return selectedStudent.last_name;
                            case 'markaz': return centerName;
                            case 'login': return selectedStudent.phone_number;
                            case 'password': return '********';
                            case 'oy': return debtData?.oy || <span className="text-amber-500">yuklanmoqda...</span>;
                            case 'summa': return debtData?.summa ? `${debtData.summa} so'm` : <span className="text-amber-500">yuklanmoqda...</span>;
                            default: return '';
                          }
                        })();
                        return (
                          <div key={v} className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded-lg">
                            <Badge variant="outline" className="bg-white font-mono text-xs px-1 py-0">{'{'}{v}{'}'}</Badge>
                            <span className="text-gray-500">→</span>
                            <span className="text-green-700 font-medium">{val || <span className="text-gray-300">bo'sh</span>}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 whitespace-pre-wrap">
                      {selectedTemplate === '' ? customMessage || 'Xabar matnini kiriting...' : previewMessage}
                    </p>
                    {selectedTemplate && (recipientType === 'selected_students' || recipientType === 'all_students') && !selectedStudent && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Namuna student ma'lumotlari bilan ko'rsatilgan
                      </p>
                    )}
                  </div>
                )}
                {currentTemplate && currentTemplate.variables.length > 0 && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> O'zgaruvchilar: {currentTemplate.variables.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ───────── JO'NATISH ───────── */}
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={!canSend || sending}
            className="w-full h-12 text-base font-semibold"
          >
            {sending ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Send className="h-5 w-5 mr-2" />}
            {sending ? 'Yuborilmoqda...' : sendButtonText}
          </Button>

          {/* ───────── NATIJA ───────── */}
          {result && (
            <div className={`flex items-center gap-3 p-4 rounded-xl ${result.failed > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              {result.failed > 0 ? <XCircle className="h-5 w-5 text-red-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
              <span className="text-sm font-medium">{result.success} ta muvaffaqiyatli, {result.failed} ta xato</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ───────── TASDIQLASH ───────── */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> SMS yuborilsinmi?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <span>
                  {recipientType === 'single_student' && selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name} (${selectedStudent.phone_number})` :
                   recipientType === 'single_teacher' && selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name} (${selectedTeacher.phone_number})` :
                   recipientType === 'selected_students' ? `${selectedStudents.length} ta student` :
                   recipientType === 'group_students' ? `${selectedGroupIds.length} ta guruh` :
                   'Barcha'} ga SMS yuboriladi.
                </span>
                {recipientCount > 1 && (
                  <span className="block text-xs text-gray-400">Jami: {recipientCount} ta qabul qiluvchi</span>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Bekor qilish</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Ha, yuborish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
