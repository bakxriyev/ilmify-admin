'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import {
  Search, Users, Calendar, Loader2,
  ChevronLeft, ChevronRight, RefreshCw, CheckCircle,
  Phone, GraduationCap, School, BarChart3,
  DoorOpen, ChevronDown, Wallet, X, AlertTriangle, Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { groupsApi, type Group } from '@/api/groupsApi';
import { groupStudentsApi, type GroupStudent } from '@/api/groupStudentApi';
import { attendanceApi, type MonthlyStats, type AttendanceCell } from '@/api/attendanceApi';
import { paymentsApi } from '@/api/paymentsApi';
import toast from 'react-hot-toast';

const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

const getInitials = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

export default function AttendancePage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupStudents, setGroupStudents] = useState<GroupStudent[]>([]);
  const [mobileGroupOpen, setMobileGroupOpen] = useState(false);

  const now = new Date();
  const [gridYear, setGridYear] = useState(now.getFullYear());
  const [gridMonth, setGridMonth] = useState(now.getMonth());
  const [gridLessons, setGridLessons] = useState<Array<{ id: number; date: string; start_time: string; end_time?: string }>>([]);
  const [gridAttendance, setGridAttendance] = useState<Record<number, Record<number, AttendanceCell>>>({});
  const [studentJoinDates, setStudentJoinDates] = useState<Record<number, string>>({});
  const [gridLoading, setGridLoading] = useState(false);
  const [activeCell, setActiveCell] = useState<{ lessonId: number; studentId: number } | null>(null);
  const [cellReason, setCellReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const todayStr = new Date().toISOString().split('T')[0];

  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Payment overview for selected group
  const [paymentOverview, setPaymentOverview] = useState<Record<number, { debt: number; status: string }>>({});

  // Student modal state
  const [modalStudent, setModalStudent] = useState<GroupStudent | null>(null);
  const [studentDebtData, setStudentDebtData] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Today's attendance status per group
  const [groupTodayStatus, setGroupTodayStatus] = useState<Record<string, 'marked' | 'partial' | 'unmarked' | 'no_lessons'>>({});
  const [todayStatusLoading, setTodayStatusLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (!activeCell) return;
    const handler = (e: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
        setActiveCell(null);
        setShowReasonInput(false);
        setCellReason('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeCell]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupStudents();
      fetchMonthlyGrid();
    }
  }, [selectedGroup, gridYear, gridMonth]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGroups(groups);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredGroups(groups.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.mainTeacher?.first_name?.toLowerCase().includes(q) ||
        g.mainTeacher?.last_name?.toLowerCase().includes(q)
      ));
    }
  }, [searchQuery, groups]);

  // Fetch payment overview when group/month changes
  useEffect(() => {
    if (selectedGroup) {
      fetchPaymentOverview();
    }
  }, [selectedGroup, gridYear, gridMonth]);

  const fetchTodayStatus = async (groupsList: Group[]) => {
    try {
      setTodayStatusLoading(true);
      const statusMap: Record<string, 'marked' | 'partial' | 'unmarked' | 'no_lessons'> = {};
      const todayStr = new Date().toISOString().split('T')[0];

      // Find groups that have lessons today
      const groupsWithLessonsToday = groupsList.filter(g => {
        if (!g.lessons?.length) return false;
        return g.lessons.some((l: any) => {
          const lessonDate = typeof l.date === 'string' ? l.date.split('T')[0] : '';
          return lessonDate === todayStr;
        });
      });

      if (groupsWithLessonsToday.length === 0) {
        groupsList.forEach(g => { statusMap[String(g.id)] = 'no_lessons'; });
        setGroupTodayStatus(statusMap);
        return;
      }

      // Mark groups without lessons today
      groupsList.forEach(g => {
        if (!groupsWithLessonsToday.find(x => x.id === g.id)) {
          statusMap[String(g.id)] = 'no_lessons';
        }
      });

      // Batch check attendance for groups with lessons today (10 at a time)
      const batchSize = 10;
      for (let i = 0; i < groupsWithLessonsToday.length; i += batchSize) {
        const batch = groupsWithLessonsToday.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(g => attendanceApi.getGroupAttendance(Number(g.id), todayStr))
        );
        results.forEach((r, idx) => {
          const g = batch[idx];
          if (r.status === 'fulfilled' && Array.isArray(r.value)) {
            const records = r.value as any[];
            const totalStudents = g.student_count || 0;
            if (records.length === 0) {
              statusMap[String(g.id)] = 'unmarked';
            } else if (totalStudents > 0 && records.length < totalStudents) {
              statusMap[String(g.id)] = 'partial';
            } else {
              statusMap[String(g.id)] = 'marked';
            }
          } else {
            statusMap[String(g.id)] = 'unmarked';
          }
        });
      }
      setGroupTodayStatus(statusMap);
    } catch {
      setGroupTodayStatus({});
    } finally {
      setTodayStatusLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      setGroupsLoading(true);
      const res = await groupsApi.getAll({ page: 1, limit: 100, include: 'mainTeacher,supportTeacher,lessons,room' });
      const list = res.data || [];
      setGroups(list);
      setFilteredGroups(list);
      // Fetch today's attendance status for all groups
      fetchTodayStatus(list);
    } catch {
      setGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  const fetchGroupStudents = async () => {
    if (!selectedGroup) return;
    try {
      const relations = await groupStudentsApi.getStudentsByGroup(Number(selectedGroup.id));
      setGroupStudents(relations);
    } catch {
      setGroupStudents([]);
    }
  };

  const fetchPaymentOverview = async () => {
    if (!selectedGroup) return;
    try {
      const data = await paymentsApi.findByGroup(Number(selectedGroup.id), gridMonth + 1, gridYear);
      const map: Record<number, { debt: number; status: string }> = {};
      data.forEach((item: any) => {
        map[item.student.id] = { debt: item.debt || 0, status: item.status };
      });
      setPaymentOverview(map);
    } catch {
      setPaymentOverview({});
    }
  };

  const fetchMonthlyGrid = async () => {
    if (!selectedGroup) return;
    try {
      setGridLoading(true);
      const data = await attendanceApi.getMonthlyGrid(Number(selectedGroup.id), gridYear, gridMonth + 1);
      setGridLessons(data.lessons);
      setGridAttendance(data.attendance);
      setStudentJoinDates(data.student_join_dates || {});
      fetchStats();
    } catch {
      setGridLessons([]);
      setGridAttendance({});
      setStudentJoinDates({});
    } finally {
      setGridLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!selectedGroup) return;
    try {
      setStatsLoading(true);
      const stats = await attendanceApi.getStats(Number(selectedGroup.id), gridYear, gridMonth + 1);
      setMonthlyStats(stats);
    } catch {
      setMonthlyStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const markGridAttendance = async (lessonId: number, studentId: number, isPresent: boolean, reason?: string) => {
    setActiveCell(null);
    setShowReasonInput(false);
    setCellReason('');
    if (!selectedGroup) return;
    try {
      await attendanceApi.markLesson({
        lesson_id: lessonId,
        attendance: [{ student_id: studentId, is_present: isPresent, reason }],
      });
      setGridAttendance(prev => {
        const next = { ...prev };
        if (!next[lessonId]) next[lessonId] = {};
        next[lessonId] = { ...next[lessonId], [studentId]: { is_present: isPresent, reason: reason || undefined } };
        return next;
      });
      toast.success(isPresent ? 'Davomat belgilandi' : "Kelmagan deb belgilandi");
      if (reason) toast.success(`Sabab: ${reason}`);
      fetchStats();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Xatolik yuz berdi';
      toast.error(msg);
    }
  };

  const openStudentModal = async (relation: GroupStudent) => {
    setModalStudent(relation);
    setStudentDebtData(null);
    setModalLoading(true);
    try {
      const data = await paymentsApi.getStudentDebts(relation.student!.id);
      setStudentDebtData(data);
    } catch {
      setStudentDebtData(null);
    } finally {
      setModalLoading(false);
    }
  };

  const activeRelations = groupStudents.filter(r => !r.left_date && r.student);

  // Calculate 3+ consecutive absences per student
  const studentConsecutiveAbsences = useMemo(() => {
    const result: Record<number, number> = {};
    if (gridLessons.length === 0) return result;

    const sortedLessons = [...gridLessons].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    activeRelations.forEach(relation => {
      const sid = relation.student!.id;
      let maxStreak = 0;
      let currentStreak = 0;

      sortedLessons.forEach(lesson => {
        const lessonDateStr = lesson.date.split('T')[0];
        if (lessonDateStr > todayStr) return; // skip future lessons

        const joinDate = studentJoinDates[sid];
        if (joinDate && lessonDateStr < joinDate) {
          currentStreak = 0;
          return;
        }

        const att = gridAttendance[lesson.id]?.[sid];
        const isAbsent = att?.is_present === false;

        if (isAbsent) {
          currentStreak++;
          if (currentStreak > maxStreak) maxStreak = currentStreak;
        } else {
          currentStreak = 0;
        }
      });

      if (maxStreak >= 3) result[sid] = maxStreak;
    });

    return result;
  }, [gridLessons, gridAttendance, studentJoinDates, groupStudents]);

  const getParentPhone = (student: any): string => {
    const link = student?.parent_links?.[0]?.parent;
    return link?.phone_number || student?.phone_number || '-';
  };

  const getTeacherName = (group: Group) => {
    if (group.mainTeacher) {
      return `${group.mainTeacher.first_name} ${group.mainTeacher.last_name}`;
    }
    return group.teacher_id ? `ID: ${group.teacher_id}` : '-';
  };

  const formatSum = (n: number) => Math.floor(n).toLocaleString();

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 rounded-2xl p-4 md:p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 md:gap-3">
                <CheckCircle className="h-5 w-5 md:h-7 md:w-7" />
                Davomat
              </h1>
              <p className="text-emerald-100 text-xs md:text-sm mt-1">
                Guruhlarda davomatni kuzatish va boshqarish
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={fetchGroups}
                className="bg-white/20 text-white hover:bg-white/30 border border-white/20 h-8 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Yangilash
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Mobile group selector button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileGroupOpen(!mobileGroupOpen)}
              className="w-full flex items-center justify-between bg-white rounded-xl shadow-lg px-4 py-3 border border-gray-100"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-sm text-gray-800">
                  {selectedGroup ? selectedGroup.name : 'Guruh tanlang'}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${mobileGroupOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileGroupOpen && (
              <Card className="border-0 rounded-xl shadow-lg bg-white overflow-hidden mt-2">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" /> Guruhlar
                    </h3>
                    <Badge className="bg-white/20 text-white border-none text-xs">
                      {filteredGroups.length}
                    </Badge>
                  </div>
                  <div className="mt-2 relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-200" />
                    <Input
                      placeholder="Guruh qidirish..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-xs bg-white/15 border-white/20 text-white placeholder:text-emerald-200 rounded-lg"
                    />
                  </div>
                </div>
                <div className="max-h-[50vh] overflow-y-auto">
                  {groupsLoading ? (
                    <div className="p-4 space-y-2">
                      {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                    </div>
                  ) : filteredGroups.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <School className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      Guruh topilmadi
                    </div>
                  ) : (
                    filteredGroups.map(group => {
                      const isSelected = selectedGroup?.id === group.id;
                      return (
                        <button
                          key={group.id}
                          onClick={() => {
                            setSelectedGroup(group);
                            setGridYear(now.getFullYear());
                            setGridMonth(now.getMonth());
                            setMobileGroupOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-all hover:bg-emerald-50 ${
                            isSelected ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-medium text-sm truncate ${isSelected ? 'text-emerald-800' : 'text-gray-800'}`}>
                              {group.name}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {groupTodayStatus[String(group.id)] === 'marked' && (
                                <span className="text-[7px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">Bugun davomat qilingan</span>
                              )}
                              {groupTodayStatus[String(group.id)] === 'partial' && (
                                <span className="text-[7px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">Qisman</span>
                              )}
                              {groupTodayStatus[String(group.id)] === 'unmarked' && (
                                <span className="text-[7px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">Davomat qilinmagan</span>
                              )}
                              <Badge className={`text-[10px] px-1.5 py-0 h-4 ${
                                isSelected
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {group.student_count || 0}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <GraduationCap className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500 truncate">{getTeacherName(group)}</span>
                          </div>
                          {group.room && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <DoorOpen className="h-2.5 w-2.5 text-gray-400" />
                              <span className="text-[10px] text-gray-400">{group.room.name}</span>
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Desktop left panel */}
          <div className="hidden lg:block lg:col-span-3">
            <Card className="border-0 rounded-xl shadow-lg bg-white overflow-hidden lg:sticky lg:top-24">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" /> Guruhlar
                  </h3>
                  <Badge className="bg-white/20 text-white border-none text-xs">
                    {filteredGroups.length}
                  </Badge>
                </div>
                <div className="mt-2 relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-200" />
                  <Input
                    placeholder="Guruh qidirish..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs bg-white/15 border-white/20 text-white placeholder:text-emerald-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                {groupsLoading ? (
                  <div className="p-4 space-y-2">
                    {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <School className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    Guruh topilmadi
                  </div>
                ) : (
                  filteredGroups.map(group => {
                    const isSelected = selectedGroup?.id === group.id;
                    return (
                      <button
                        key={group.id}
                        onClick={() => {
                          setSelectedGroup(group);
                          setGridYear(now.getFullYear());
                          setGridMonth(now.getMonth());
                        }}
                        className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-all hover:bg-emerald-50 ${
                          isSelected ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-medium text-sm truncate ${isSelected ? 'text-emerald-800' : 'text-gray-800'}`}>
                            {group.name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {groupTodayStatus[String(group.id)] === 'marked' && (
                              <span className="text-[7px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">Bugun davomat qilingan</span>
                            )}
                            {groupTodayStatus[String(group.id)] === 'partial' && (
                              <span className="text-[7px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">Qisman</span>
                            )}
                            {groupTodayStatus[String(group.id)] === 'unmarked' && (
                              <span className="text-[7px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">Davomat qilinmagan</span>
                            )}
                            <Badge className={`text-[10px] px-1.5 py-0 h-4 ${
                              isSelected
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {group.student_count || 0}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <GraduationCap className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500 truncate">{getTeacherName(group)}</span>
                        </div>
                        {group.room && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <DoorOpen className="h-2.5 w-2.5 text-gray-400" />
                            <span className="text-[10px] text-gray-400">{group.room.name}</span>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-9 space-y-4 md:space-y-6">
            {!selectedGroup ? (
              <div className="flex flex-col items-center justify-center py-16 md:py-20 bg-white rounded-xl shadow-lg">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-4 md:mb-6">
                  <CheckCircle className="h-8 w-8 md:h-12 md:w-12 text-emerald-400" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">Guruhni tanlang</h3>
                <p className="text-gray-500 text-sm">Chapdagi ro'yxatdan guruh tanlang</p>
              </div>
            ) : (
              <>
                <Card className="border-0 rounded-xl shadow-lg bg-white overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 md:px-6 py-3 md:py-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                          <School className="h-4 w-4 md:h-5 md:w-5" /> {selectedGroup.name}
                        </h3>
                        <div className="flex items-center gap-3 md:gap-4 mt-1 text-emerald-100 text-[10px] md:text-xs">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-2.5 w-2.5 md:h-3 md:w-3" /> {getTeacherName(selectedGroup)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-2.5 w-2.5 md:h-3 md:w-3" /> {activeRelations.length} ta student
                          </span>
                          {selectedGroup.room && (
                            <span className="flex items-center gap-1">
                              <DoorOpen className="h-2.5 w-2.5 md:h-3 md:w-3" /> {selectedGroup.room.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 self-end sm:self-auto">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setGridYear(prev => gridMonth === 0 ? prev - 1 : prev);
                          setGridMonth(prev => prev === 0 ? 11 : prev - 1);
                        }} className="text-white/80 hover:text-white hover:bg-white/10 h-7 md:h-8 px-1 md:px-2">
                          <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                        <span className="text-white font-medium text-xs md:text-sm min-w-[90px] md:min-w-[120px] text-center">
                          {monthNames[gridMonth]} {gridYear}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setGridYear(prev => gridMonth === 11 ? prev + 1 : prev);
                          setGridMonth(prev => prev === 11 ? 0 : prev + 1);
                        }} className="text-white/80 hover:text-white hover:bg-white/10 h-7 md:h-8 px-1 md:px-2">
                          <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                        <span className="w-px h-4 md:h-6 bg-white/30 mx-0.5 md:mx-1" />
                        <Button size="sm" onClick={() => {
                          const d = new Date();
                          setGridYear(d.getFullYear());
                          setGridMonth(d.getMonth());
                        }} className="bg-white text-emerald-700 hover:bg-emerald-50 text-[10px] md:text-xs h-7 md:h-8">
                          <RefreshCw className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" /> Bugun
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="border-0 rounded-xl shadow-lg bg-white overflow-hidden">
                  <CardContent className="p-0">
                    {activeRelations.length === 0 ? (
                      <div className="text-center py-10 text-gray-500">
                        <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        Bu guruhda studentlar mavjud emas
                      </div>
                    ) : gridLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                        <span className="ml-2 text-gray-500">Yuklanmoqda...</span>
                      </div>
                    ) : gridLessons.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="h-14 w-14 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">Bu oyda darslar mavjud emas</p>
                        <p className="text-sm text-gray-400 mt-1">Boshqa oyni tanlang yoki guruhga dars qo'shing</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto" ref={gridRef}>
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead className="text-gray-700 sticky left-0 bg-gray-50 z-10 min-w-[180px] md:min-w-[200px]">Student</TableHead>
                              {gridLessons.map(lesson => {
                                const d = new Date(lesson.date);
                                const dayNum = d.getDate();
                                const dayName = d.toLocaleDateString('uz-UZ', { weekday: 'short' });
                                const isToday = lesson.date.split('T')[0] === todayStr;
                                return (
                                  <TableHead key={lesson.id} className={`text-center text-[10px] md:text-xs p-1 min-w-[30px] md:min-w-[36px] ${isToday ? 'bg-emerald-100 text-emerald-800' : 'text-gray-600'}`}>
                                    <div>{dayNum}</div>
                                    <div className="text-[8px] md:text-[10px] font-normal">{dayName}</div>
                                  </TableHead>
                                );
                              })}
                              <TableHead className="text-center text-gray-600 min-w-[50px] md:min-w-[60px]">%</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeRelations.map(relation => {
                              const student = relation.student!;
                              const has3Absences = studentConsecutiveAbsences[student.id] !== undefined;
                              const payInfo = paymentOverview[student.id];
                              let presentCount = 0;
                              let totalCount = 0;

                              return (
                                <TableRow
                                  key={student.id}
                                  className={`border-b border-gray-100 transition-colors ${
                                    has3Absences
                                      ? 'bg-red-50 hover:bg-red-100'
                                      : 'hover:bg-gray-50'
                                  } cursor-pointer`}
                                  onClick={() => openStudentModal(relation)}
                                >
                                  <TableCell className="sticky left-0 bg-white z-10 font-medium text-gray-900 text-sm border-r border-gray-100"
                                    style={has3Absences ? { background: '#fef2f2' } : undefined}>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-7 w-7 md:h-8 md:w-8 border border-gray-200 shrink-0">
                                        <AvatarImage src={student.photo || ''} />
                                        <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[10px] md:text-xs">
                                          {getInitials(student.first_name, student.last_name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1 flex-wrap">
                                          <span className="font-medium text-gray-900 text-xs md:text-sm block truncate max-w-[100px] md:max-w-[130px]">
                                            {student.first_name} {student.last_name}
                                          </span>
                                          {has3Absences && (
                                            <span title={`${studentConsecutiveAbsences[student.id]} marta ketma-ket kelmagan`}>
                                              <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                                            </span>
                                          )}
                                        </div>
                                        {payInfo && payInfo.debt > 0 ? (
                                          <span className="text-[9px] md:text-[10px] text-red-600 font-medium flex items-center gap-0.5">
                                            <Wallet className="h-2.5 w-2.5" />
                                            Qarzdorlik: {formatSum(payInfo.debt)} so'm
                                          </span>
                                        ) : (
                                          <span className="text-[9px] md:text-[10px] text-green-600 font-medium">
                                            To'lov qilgan
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  {gridLessons.map(lesson => {
                                    const lessonDateStr = lesson.date.split('T')[0];
                                    const isFuture = lessonDateStr > todayStr;
                                    const joinDate = studentJoinDates[student.id];
                                    const beforeJoin = joinDate ? lessonDateStr < joinDate : false;
                                    const lessonAtt = gridAttendance[lesson.id];
                                    const cell = lessonAtt ? lessonAtt[student.id] : undefined;
                                    const isPresent = cell?.is_present === true;
                                    const isAbsent = cell?.is_present === false;
                                    const reasonText = cell?.reason;
                                    if (cell !== undefined) totalCount++;
                                    if (isPresent) presentCount++;
                                    const isActive = activeCell?.lessonId === lesson.id && activeCell?.studentId === student.id;
                                    const cellKey = `${lesson.id}-${student.id}`;
                                    return (
                                      <TableCell key={cellKey} className="text-center p-0.5 relative"
                                        onClick={e => e.stopPropagation()}>
                                        {beforeJoin ? (
                                          <span className="text-gray-200 text-xs mx-auto block w-7 h-7 md:w-8 md:h-8 flex items-center justify-center">—</span>
                                        ) : isActive ? (
                                          <div className="flex flex-col items-center gap-0.5">
                                            <div className="flex items-center gap-0.5">
                                              <button
                                                onClick={() => markGridAttendance(lesson.id, student.id, true)}
                                                className="w-6 h-6 md:w-7 md:h-7 rounded bg-green-500 text-white text-[10px] md:text-xs font-bold hover:bg-green-600 transition-colors"
                                                title="Bor"
                                              >B</button>
                                              <button
                                                onClick={() => { setShowReasonInput(true); }}
                                                className="w-6 h-6 md:w-7 md:h-7 rounded bg-red-500 text-white text-[10px] md:text-xs font-bold hover:bg-red-600 transition-colors"
                                                title="Yo'q"
                                              >Y</button>
                                            </div>
                                            {showReasonInput && (
                                              <div className="flex gap-0.5 mt-0.5">
                                                <input
                                                  type="text"
                                                  value={cellReason}
                                                  onChange={e => setCellReason(e.target.value)}
                                                  placeholder="Sabab..."
                                                  className="w-16 md:w-20 h-5 md:h-6 text-[9px] md:text-[10px] px-1 border border-gray-300 rounded"
                                                  autoFocus
                                                  onKeyDown={e => {
                                                    if (e.key === 'Enter') markGridAttendance(lesson.id, student.id, false, cellReason || undefined);
                                                    if (e.key === 'Escape') { setShowReasonInput(false); setCellReason(''); }
                                                  }}
                                                />
                                                <button
                                                  onClick={() => markGridAttendance(lesson.id, student.id, false, cellReason || undefined)}
                                                  className="h-5 md:h-6 px-1 text-[9px] md:text-[10px] bg-blue-500 text-white rounded hover:bg-blue-600"
                                                >OK</button>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              if (isFuture) return;
                                              setActiveCell({ lessonId: lesson.id, studentId: student.id });
                                              setShowReasonInput(false);
                                              setCellReason('');
                                            }}
                                            disabled={isFuture}
                                            title={reasonText ? `Sabab: ${reasonText}` : (isFuture ? 'Kun hali kelmagan' : '')}
                                            className={`w-7 h-7 md:w-8 md:h-8 rounded-md flex items-center justify-center transition-all text-[10px] md:text-sm mx-auto
                                              ${isFuture ? 'cursor-not-allowed opacity-30' : 'cursor-pointer hover:ring-2 hover:ring-emerald-400'}
                                              ${isPresent ? 'bg-green-100 text-green-700' : isAbsent ? 'bg-red-100 text-red-600' : isFuture ? 'bg-gray-50 text-gray-300' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                          >
                                            {isFuture ? '∼' : isPresent ? '✓' : isAbsent ? '✗' : '-'}
                                          </button>
                                        )}
                                      </TableCell>
                                    );
                                  })}
                                  <TableCell className="text-center">
                                    <span className={`text-xs md:text-sm font-semibold ${totalCount > 0 ? (presentCount / totalCount >= 0.7 ? 'text-green-600' : presentCount / totalCount >= 0.4 ? 'text-amber-600' : 'text-red-600') : 'text-gray-400'}`}>
                                      {totalCount > 0 ? `${Math.round(presentCount / totalCount * 100)}%` : '-'}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  <Card className="border-0 rounded-xl shadow-lg bg-white overflow-hidden lg:col-span-2">
                    <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-4 md:px-6 py-3 md:py-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 md:h-5 md:w-5" /> Oylik statistika
                        </h3>
                        <Button size="sm" onClick={fetchStats} className="bg-white text-violet-700 hover:bg-violet-50 text-xs h-7 md:h-8">
                          <RefreshCw className="h-3 w-3 mr-1" /> Yangilash
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4 md:p-6">
                      {statsLoading ? (
                        <div className="space-y-3">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ) : monthlyStats ? (
                        <div className="space-y-4 md:space-y-5">
                          <div className="text-center p-4 md:p-5 bg-violet-50 rounded-xl">
                            <p className="text-3xl md:text-4xl font-bold text-violet-700">{monthlyStats.presentPercent}%</p>
                            <p className="text-xs md:text-sm text-violet-600 font-medium mt-1">Davomat foizi</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2 md:gap-3">
                            <div className="p-3 md:p-4 bg-green-50 rounded-xl text-center">
                              <p className="text-xl md:text-2xl font-bold text-green-700">{monthlyStats.present}</p>
                              <p className="text-[10px] md:text-xs text-green-600 mt-0.5">Keldi</p>
                            </div>
                            <div className="p-3 md:p-4 bg-red-50 rounded-xl text-center">
                              <p className="text-xl md:text-2xl font-bold text-red-700">{monthlyStats.absent}</p>
                              <p className="text-[10px] md:text-xs text-red-600 mt-0.5">Kelmadi</p>
                            </div>
                            <div className="p-3 md:p-4 bg-gray-50 rounded-xl text-center">
                              <p className="text-xl md:text-2xl font-bold text-gray-900">{monthlyStats.lessons}</p>
                              <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">Darslar</p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 md:h-3 overflow-hidden">
                            <div
                              className="h-2 md:h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-red-500 via-amber-500 to-green-500"
                              style={{ width: `${Math.min(Number(monthlyStats.presentPercent), 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-sm">Statistika mavjud emas</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-0 rounded-xl shadow-lg bg-white overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-4 md:px-6 py-3 md:py-4">
                      <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                        <Users className="h-4 w-4 md:h-5 md:w-5" /> Ma'lumot
                      </h3>
                    </div>
                    <CardContent className="p-4 md:p-6 space-y-2 md:space-y-3">
                      <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs md:text-sm text-gray-600">Faol studentlar</span>
                        <span className="font-bold text-gray-900 text-sm md:text-base">{activeRelations.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs md:text-sm text-gray-600">Bu oydagi darslar</span>
                        <span className="font-bold text-gray-900 text-sm md:text-base">{gridLessons.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs md:text-sm text-gray-600">O'tgan darslar</span>
                        <span className="font-bold text-gray-900 text-sm md:text-base">{gridLessons.filter(l => l.date.split('T')[0] <= todayStr).length}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs md:text-sm text-gray-600">Kelgusi darslar</span>
                        <span className="font-bold text-gray-900 text-sm md:text-base">{gridLessons.filter(l => l.date.split('T')[0] > todayStr).length}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs md:text-sm text-gray-600">O'qituvchi</span>
                        <span className="font-bold text-gray-900 text-sm md:text-base truncate max-w-[100px] md:max-w-[130px]">{getTeacherName(selectedGroup)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      <Dialog open={!!modalStudent} onOpenChange={(open) => { if (!open) { setModalStudent(null); setStudentDebtData(null); } }}>
        <DialogContent className="bg-white max-w-lg max-h-[90vh] overflow-y-auto">
          {modalStudent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-emerald-200">
                    <AvatarImage src={modalStudent.student?.photo || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-sm">
                      {getInitials(modalStudent.student?.first_name || '', modalStudent.student?.last_name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <Link href={`/students/${modalStudent.student?.id}`} className="text-lg font-semibold text-emerald-700 hover:text-emerald-800 hover:underline truncate block">
                      {modalStudent.student?.first_name} {modalStudent.student?.last_name}
                    </Link>
                    <p className="text-xs text-gray-500 font-normal flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3 shrink-0" />
                      Shaxsiy: {modalStudent.student?.phone_number || '-'}
                    </p>
                    <p className="text-xs text-gray-500 font-normal flex items-center gap-1">
                      <Phone className="h-3 w-3 shrink-0" />
                      Ota-ona: {getParentPhone(modalStudent.student)}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              {modalLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  <span className="ml-2 text-gray-500">Yuklanmoqda...</span>
                </div>
              ) : studentDebtData ? (
                <div className="space-y-4">
                  {/* Payment Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <p className="text-xs text-red-600">Jami qarzdorlik</p>
                      <p className="text-xl font-bold text-red-700">{formatSum(studentDebtData.total_debt)} so'm</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="text-xs text-green-600">To'lagan summa</p>
                      <p className="text-xl font-bold text-green-700">{formatSum(studentDebtData.paid_total)} so'm</p>
                    </div>
                  </div>

                  {/* Attendance Stats for Current Month */}
                  {monthlyStats && (
                    <div className="bg-violet-50 p-3 rounded-lg border border-violet-200">
                      <p className="text-xs text-violet-600 font-medium mb-2">Bu oydagi davomat</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold text-green-700">{(() => {
                            const sid = modalStudent.student!.id;
                            let p = 0;
                            let t = 0;
                            gridLessons.forEach(lesson => {
                              const att = gridAttendance[lesson.id]?.[sid];
                              if (att !== undefined) {
                                t++;
                                if (att.is_present) p++;
                              }
                            });
                            return t > 0 ? `${Math.round(p/t*100)}%` : '-';
                          })()}</p>
                          <p className="text-[10px] text-gray-500">Kelgan</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-red-700">{(() => {
                            const sid = modalStudent.student!.id;
                            let a = 0;
                            gridLessons.forEach(lesson => {
                              const att = gridAttendance[lesson.id]?.[sid];
                              if (att?.is_present === false) a++;
                            });
                            return a;
                          })()}</p>
                          <p className="text-[10px] text-gray-500">Kelmagan</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-700">{(() => {
                            const sid = modalStudent.student!.id;
                            let t = 0;
                            gridLessons.forEach(lesson => {
                              const att = gridAttendance[lesson.id]?.[sid];
                              if (att !== undefined) t++;
                            });
                            return t;
                          })()}</p>
                          <p className="text-[10px] text-gray-500">Jami</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment History */}
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm mb-2">To'lov tarixi</h4>
                    <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                      {studentDebtData.debts && studentDebtData.debts.length > 0 ? (
                        studentDebtData.debts.map((debt: any, i: number) => (
                          <div key={i} className="p-3 flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{debt.month_name} {debt.year}</p>
                              <p className="text-xs text-gray-500">{debt.group_name}</p>
                            </div>
                            <span className="text-sm font-bold text-red-600">{formatSum(debt.amount)} so'm</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-400 text-sm">Qarzdorlik mavjud emas</div>
                      )}
                    </div>
                  </div>

                  {/* Paid History */}
                  {studentDebtData.paid_payments && studentDebtData.paid_payments.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm mb-2">To'langan oylar</h4>
                      <div className="max-h-36 overflow-y-auto border rounded-lg divide-y bg-green-50">
                        {studentDebtData.paid_payments.map((p: any) => (
                          <div key={p.id} className="p-3 flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.month_name} {p.year}</p>
                              <p className="text-xs text-gray-500">{p.group_name}</p>
                            </div>
                            <span className="text-sm font-bold text-green-600">{formatSum(p.amount)} so'm</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {studentConsecutiveAbsences[modalStudent.student!.id] && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-700">
                          {studentConsecutiveAbsences[modalStudent.student!.id]} marta ketma-ket kelmagan
                        </p>
                        <p className="text-xs text-red-500">Diqqat talab qiladi</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <X className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">Ma'lumot yuklanmadi</p>
                </div>
              )}

              <div className="flex justify-end mt-2">
                <Button variant="outline" onClick={() => { setModalStudent(null); setStudentDebtData(null); }}>
                  Yopish
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
