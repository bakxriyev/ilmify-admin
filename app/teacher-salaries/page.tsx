'use client';

import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { teacherCommissionsApi, type TeacherSalary, type TeacherCommission } from '@/api/teacherCommissionsApi';
import { teachersApi, type Teacher } from '@/api/teachersApi';
import { educationCentersApi } from '@/api/educationCentersApi';
import { Search, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, DollarSign, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

const formatSum = (n: number) => {
  if (!n) return '0';
  return Math.floor(n).toLocaleString();
};

export default function TeacherSalariesPage() {
  const [salaries, setSalaries] = useState<TeacherSalary[]>([]);
  const [commissions, setCommissions] = useState<TeacherCommission[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedTeacher, setExpandedTeacher] = useState<number | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const [salaryVisible, setSalaryVisible] = useState(true);
  const [salaryVisLoading, setSalaryVisLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [t, c, vis] = await Promise.all([
        teachersApi.getAll({ limit: 200 }),
        teacherCommissionsApi.getAll(),
        educationCentersApi.getSalaryVisibility().catch(() => ({ salary_visible: true })),
      ]);
      setTeachers(t.data || []);
      setCommissions(c);
      setSalaryVisible(vis.salary_visible);
    } catch {
      toast.error('Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSalaries = useCallback(async () => {
    try {
      setSalaryLoading(true);
      const data = await teacherCommissionsApi.getSalaries(month, year);
      setSalaries(data);
      setExpandedTeacher(null);
      setExpandedGroup(null);
    } catch {
      toast.error('Oyliklarni hisoblashda xatolik');
    } finally {
      setSalaryLoading(false);
    }
  }, [month, year]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadSalaries(); }, [loadSalaries]);

  const handleToggleSalaryVisibility = async (checked: boolean) => {
    try {
      setSalaryVisLoading(true);
      await educationCentersApi.updateSalaryVisibility(checked);
      setSalaryVisible(checked);
      toast.success(checked ? 'Oylik ko\'rindi' : 'Oylik yashirildi');
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setSalaryVisLoading(false);
    }
  };

  const handleSavePercentage = async (teacherId: number) => {
    const pct = parseFloat(editValue);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error('Foiz 0-100 oralig\'ida bo\'lishi kerak');
      return;
    }
    try {
      const existing = commissions.find(c => Number(c.teacher_id) === teacherId);
      if (existing) {
        await teacherCommissionsApi.update(existing.id, { percentage: pct });
      } else {
        await teacherCommissionsApi.create({ teacher_id: teacherId, percentage: pct });
      }
      toast.success('Foiz saqlandi');
      setEditingId(null);
      const c = await teacherCommissionsApi.getAll();
      setCommissions(c);
      loadSalaries();
    } catch {
      toast.error('Xatolik yuz berdi');
    }
  };

  const getCommission = (teacherId: number) => commissions.find(c => Number(c.teacher_id) === teacherId);
  const getSalary = (teacherId: number) => salaries.find(s => Number(s.teacher_id) === teacherId);

  const allTeacherRows = teachers.map(t => {
    const tid = Number(t.id);
    const comm = getCommission(tid);
    const salary = getSalary(tid);
    return { teacher: t, tid, commission: comm, salary };
  });

  const filteredRows = allTeacherRows.filter(({ teacher }) => {
    const name = `${teacher.first_name} ${teacher.last_name}`.toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || teacher.phone_number?.includes(q);
  });

  const totalSalary = salaries.reduce((sum, s) => sum + s.salary, 0);
  const totalPayments = salaries.reduce((sum, s) => sum + s.total_payments, 0);
  const totalExpected = salaries.reduce((sum, s) => sum + s.total_expected, 0);
  const totalAllStudents = salaries.reduce((sum, s) => sum + s.total_students, 0);
  const totalPaidStudents = salaries.reduce((sum, s) => sum + s.paid_students, 0);

  const navigateMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m);
    setYear(y);
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 w-full max-w-[1600px] mx-auto space-y-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-600" /> Ustoz oyliklari</h1>
            <p className="text-sm text-gray-500">Foiz asosida oylik hisoblash</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigateMonth(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-gray-800 min-w-[120px] text-center">
              {monthNames[month - 1]} {year}
            </span>
            <button onClick={() => navigateMonth(1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <EyeOff className="h-3.5 w-3.5" />
              <Switch
                checked={salaryVisible}
                onCheckedChange={handleToggleSalaryVisibility}
                disabled={salaryVisLoading}
                className="data-[state=checked]:bg-green-500"
              />
              <Eye className="h-3.5 w-3.5" />
            </div>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <Button variant="outline" size="sm" onClick={() => { loadData(); loadSalaries(); }}
              className="text-xs h-8 border-gray-300">
              {loading || salaryLoading ? '...' : 'Yangilash'}
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium">Kutilayotgan tushum</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{formatSum(totalExpected)} so'm</p>
            <p className="text-xs text-gray-400">{totalAllStudents} ta student</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium">Amaldagi tushum</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{formatSum(totalPayments)} so'm</p>
            <p className="text-xs text-gray-400">{totalPaidStudents} ta student to'lagan</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium">Farq</p>
            <p className={`text-lg font-bold mt-0.5 ${totalExpected > 0 ? (totalPayments >= totalExpected ? 'text-green-600' : 'text-red-500') : 'text-gray-900'}`}>
              {formatSum(totalExpected - totalPayments)} so'm
            </p>
            <p className="text-xs text-gray-400">
              {totalExpected > 0 ? `${Math.round(totalPayments / totalExpected * 100)}% yig'ilgan` : '-'}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium">Jami oylik</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{formatSum(totalSalary)} so'm</p>
            <p className="text-xs text-gray-400">{teachers.length} ta o'qituvchi</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="O'qituvchi ismi yoki telefon raqami..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 text-sm pl-9 border-gray-300"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Yuklanmoqda...</div>
          ) : filteredRows.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">O'qituvchilar topilmadi</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="w-8 py-3 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">O'qituvchi</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Studentlar</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Guruhlar</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kutilgan</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tushum</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Farq</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Foiz</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Oylik</th>
                    <th className="w-10 py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map(({ teacher, tid, commission, salary }, idx) => {
                    const isExpanded = expandedTeacher === tid;
                    const pct = commission?.percentage || 0;
                    const expected = salary?.total_expected || 0;
                    const paid = salary?.total_payments || 0;
                    const diff = expected - paid;

                    const toggleTeacher = () => {
                      setExpandedTeacher(isExpanded ? null : tid);
                      setExpandedGroup(null);
                    };

                    return (
                      <>
                        <tr key={tid} className="border-b border-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={toggleTeacher}>
                          <td className="py-3 px-2 text-center text-xs text-gray-400 font-mono">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                                {teacher.first_name[0]}{teacher.last_name[0]}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {teacher.first_name} {teacher.last_name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {teacher.phone_number}
                                  <span className="mx-1.5">·</span>
                                  {teacher.teacher_type === 'MAIN_TEACHER' ? 'Asosiy' : 'Yordamchi'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <p className="font-semibold text-gray-900">{salary?.total_students || 0}</p>
                            {salary && (
                              <p className="text-xs text-gray-400">{salary.paid_students}/{salary.total_students} to'lagan</p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-medium text-gray-900">
                            {salary?.total_groups || 0}
                          </td>
                          <td className="py-3 px-3 text-center font-medium text-gray-900">
                            {expected > 0 ? `${formatSum(expected)} so'm` : '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {paid > 0 ? (
                              <span className="font-medium text-green-700">{formatSum(paid)} so'm</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {expected > 0 ? (
                              <span className={`font-medium ${diff <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {diff <= 0 ? '+' : '-'}{formatSum(Math.abs(diff))}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                            {editingId === tid ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  className="w-16 h-7 text-xs text-center border border-gray-300 rounded px-1 outline-none focus:border-blue-400"
                                  onKeyDown={e => { if (e.key === 'Enter') handleSavePercentage(tid); }}
                                  autoFocus
                                />
                                <button onClick={(e) => { e.stopPropagation(); handleSavePercentage(tid); }}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                                  className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditValue(String(pct)); setEditingId(tid); }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                              >
                                <span className="font-semibold text-gray-900">{pct}%</span>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {salary ? (
                              <>
                                <p className="font-bold text-gray-900 text-sm">{formatSum(salary.salary)} so'm</p>
                                <p className="text-xs text-gray-400">{pct}% foiz</p>
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 mx-auto" /> : <ChevronDown className="w-4 h-4 text-gray-400 mx-auto" />}
                          </td>
                        </tr>
                        {isExpanded && salary && (
                          <tr key={`${tid}-detail`} className="bg-gray-50">
                            <td colSpan={10} className="px-4 py-4">
                              {salary.groups.length > 0 ? (
                                <div className="space-y-2">
                                  {salary.groups.map(g => {
                                    const groupKey = `${tid}-${g.group_id}`;
                                    const groupOpen = expandedGroup === groupKey;
                                    const pctPaid = g.total_students > 0 ? Math.round(g.paid_students / g.total_students * 100) : 0;
                                    return (
                                      <div key={g.group_id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                                        {/* Group header - clickable to toggle students */}
                                        <button
                                          onClick={() => setExpandedGroup(groupOpen ? null : groupKey)}
                                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                                        >
                                          <div className="flex items-center gap-3">
                                            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${groupOpen ? 'rotate-90' : ''}`} />
                                            <div>
                                              <span className="font-medium text-gray-900">{g.group_name}</span>
                                              <span className="text-xs text-gray-400 ml-2">
                                                {formatSum(g.monthly_price)} so'm/student
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-4 text-xs">
                                            <span className="text-gray-500">{g.total_students} student</span>
                                            <span className="text-gray-500">
                                              Kutilgan: <span className="font-medium text-gray-700">{formatSum(g.expected)} so'm</span>
                                            </span>
                                            <span className="text-gray-500">
                                              Tushum: <span className="font-medium text-green-700">{formatSum(g.total)} so'm</span>
                                            </span>
                                            <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                                              pctPaid >= 80 ? 'bg-green-100 text-green-700' :
                                              pctPaid >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                              'bg-red-100 text-red-700'
                                            }`}>
                                              {pctPaid}%
                                            </span>
                                          </div>
                                        </button>
                                        {/* Student list - expandable */}
                                        {groupOpen && g.students && g.students.length > 0 && (
                                          <div className="border-t border-gray-100">
                                            <table className="w-full text-xs">
                                              <thead>
                                                <tr className="bg-gray-50 border-b border-gray-100">
                                                  <th className="text-left py-2 px-4 font-semibold text-gray-500">#</th>
                                                  <th className="text-left py-2 px-3 font-semibold text-gray-500">Student</th>
                                                  <th className="text-left py-2 px-3 font-semibold text-gray-500">Telefon</th>
                                                  <th className="text-center py-2 px-3 font-semibold text-gray-500">Holat</th>
                                                  <th className="text-right py-2 px-4 font-semibold text-gray-500">To'lov</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {g.students.map((s, idx) => (
                                                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                                                    <td className="py-2 px-4 text-gray-400">{idx + 1}</td>
                                                    <td className="py-2 px-3 font-medium text-gray-800">
                                                      {s.first_name} {s.last_name}
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-600">{s.phone_number || '-'}</td>
                                                    <td className="py-2 px-3 text-center">
                                                      {s.paid ? (
                                                        <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                                                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                                          To'lagan
                                                        </span>
                                                      ) : (
                                                        <span className="inline-flex items-center gap-1 text-red-500 font-medium">
                                                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                                          To'lamagan
                                                        </span>
                                                      )}
                                                    </td>
                                                    <td className="py-2 px-4 text-right font-medium">
                                                      {s.paid ? (
                                                        <span className="text-green-700">{formatSum(g.expected / g.total_students)} so'm</span>
                                                      ) : (
                                                        <span className="text-gray-400">-</span>
                                                      )}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                        {groupOpen && (!g.students || g.students.length === 0) && (
                                          <div className="border-t border-gray-100 p-4 text-center text-xs text-gray-400">
                                            Bu guruhda studentlar yo'q
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-400 text-center py-3">
                                  {'Guruhlar bo\'yicha ma\'lumot yo\'q'}
                                </p>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
