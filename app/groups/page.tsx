'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import {
  Search, Plus, Edit, Trash2, Users, User, Calendar, Clock, BookOpen,
  Filter, ChevronLeft, ChevronRight, Eye, RefreshCw, X, AlertCircle,
  MoreVertical, GraduationCap, Hash, CalendarDays, Clock3, XCircle,
  UserCheck, BookMarked, Layers, DoorOpen, Loader2, Check, ChevronsUpDown,
  School, MapPin, Phone, Mail, Shield, ChevronDown, ChevronUp,
  List, LayoutGrid,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { groupsApi, type Group, type GetAllGroupsParams } from '@/api/groupsApi';
import { teachersApi, type Teacher } from '@/api/teachersApi';
import toast from 'react-hot-toast';

const PARITY_OPTIONS = [
  { value: 'all', label: 'Barchasi' },
  { value: 'odd', label: 'Toq' },
  { value: 'even', label: 'Juft' },
  { value: 'everyday', label: 'Har kuni' },
];

const DAY_OPTIONS = [
  { value: 'all', label: 'Barcha kunlar' },
  { value: '1', label: 'Dushanba' },
  { value: '2', label: 'Seshanba' },
  { value: '3', label: 'Chorshanba' },
  { value: '4', label: 'Payshanba' },
  { value: '5', label: 'Juma' },
  { value: '6', label: 'Shanba' },
  { value: '0', label: 'Yakshanba' },
];

const TIME_SLOTS = [
  { value: 'all', label: 'Barcha vaqtlar' },
  { value: '06:00-09:00', label: '06:00 - 09:00' },
  { value: '09:00-12:00', label: '09:00 - 12:00' },
  { value: '12:00-15:00', label: '12:00 - 15:00' },
  { value: '15:00-18:00', label: '15:00 - 18:00' },
  { value: '18:00-21:00', label: '18:00 - 21:00' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

const getInitials = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

const getDayName = (dayNum: number) => {
  const names = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
  return names[dayNum] || '';
};

const getParityBadge = (parity: string) => {
  if (parity === 'odd') return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] px-2 py-0.5">Toq</Badge>;
  if (parity === 'even') return <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-[11px] px-2 py-0.5">Juft</Badge>;
  if (parity === 'everyday') return <Badge className="bg-green-50 text-green-700 border-green-200 text-[11px] px-2 py-0.5">Har kuni</Badge>;
  return null;
};

const formatPhone = (phone?: string) => {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '').replace(/(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, '+$1 $2 $3 $4 $5');
};

export default function GroupsListPage() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(true);

  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [pSearch, setPSearch] = useState('');
  const [pTeacherId, setPTeacherId] = useState<string>('');
  const [pParity, setPParity] = useState('all');
  const [pDay, setPDay] = useState('all');
  const [pTime, setPTime] = useState('all');

  const [aSearch, setASearch] = useState('');
  const [aTeacherId, setATeacherId] = useState<string>('');
  const [aParity, setAParity] = useState('all');
  const [aDay, setADay] = useState('all');
  const [aTime, setATime] = useState('all');

  const applyFilters = () => {
    setASearch(pSearch);
    setATeacherId(pTeacherId);
    setAParity(pParity);
    setADay(pDay);
    setATime(pTime);
    setPage(1);
  };

  const clearFilters = () => {
    setPSearch('');
    setPTeacherId('');
    setPParity('all');
    setPDay('all');
    setPTime('all');
    setASearch('');
    setATeacherId('');
    setAParity('all');
    setADay('all');
    setATime('all');
    setPage(1);
  };

  const hasActiveFilters = !!(aSearch || aTeacherId || aDay !== 'all' || aParity !== 'all' || aTime !== 'all');
  const hasPendingChanges = !!(pSearch !== aSearch || pTeacherId !== aTeacherId || pParity !== aParity || pDay !== aDay || pTime !== aTime);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setTeachersLoading(true);
        const res = await teachersApi.getAll({ limit: 1000 });
        setTeachers(res.data || []);
      } catch {
      } finally {
        setTeachersLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  useEffect(() => {
    const params: GetAllGroupsParams = {
      page,
      limit,
      include: 'mainTeacher,supportTeacher,lessons,room',
    };
    if (aSearch) params.name = aSearch;
    if (aTeacherId) params.teacher_id = aTeacherId;
    if (aParity && aParity !== 'all') params.parity = aParity;
    if (aDay && aDay !== 'all') {
      const dayNum = parseInt(aDay);
      if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) params.day = String(dayNum);
    }
    if (aTime && aTime !== 'all') {
      const [from, to] = aTime.split('-');
      if (from) params.start_time_from = from;
      if (to) params.start_time_to = to;
    }

    let cancelled = false;
    const doFetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await groupsApi.getAll(params);
        if (!cancelled) {
          setGroups(response.data);
          setTotal(response.pagination.total);
          setTotalPages(response.pagination.totalPages);
          setPage(response.pagination.page);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Guruhlarni yuklashda xatolik');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    doFetch();
    return () => { cancelled = true; };
  }, [page, limit, aSearch, aTeacherId, aParity, aDay, aTime, refreshKey]);

  const handleDelete = async () => {
    if (!groupToDelete) return;
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await groupsApi.delete(groupToDelete.id);
      toast.success('Guruh o\'chirildi');
      setRefreshKey(k => k + 1);
      setShowDeleteModal(false);
      setGroupToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Guruhni o\'chirishda xatolik');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getLessonDay = (lesson: any) => {
    if (!lesson?.date) return -1;
    return new Date(lesson.date).getDay();
  };

  const getLessonDayName = (lesson: any) => {
    const day = getLessonDay(lesson);
    return day >= 0 ? getDayName(day) : '';
  };

  const getLessonTimes = (group: Group) => {
    if (!group.lessons || group.lessons.length === 0) return null;
    const first = group.lessons[0];
    return first.start_time?.slice(0, 5) || first.time || '';
  };

  const studentCount = groups.reduce((s, g) => s + (g.student_count || 0), 0);
  const trialCount = groups.reduce((s, g) => s + (g.trial_count || 0), 0);
  const roomCount = groups.filter(g => g.room).length;

  const renderStats = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-blue-50/80 rounded-xl p-3 flex items-center gap-3 border border-blue-100/50">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
          <School className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[11px] text-blue-600/70 font-medium">Jami guruhlar</p>
          <p className="text-lg font-bold text-gray-900 leading-tight">{total}</p>
        </div>
      </div>
      <div className="bg-emerald-50/80 rounded-xl p-3 flex items-center gap-3 border border-emerald-100/50">
        <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-sm">
          <Users className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[11px] text-emerald-600/70 font-medium">Studentlar</p>
          <p className="text-lg font-bold text-gray-900 leading-tight">{studentCount}</p>
        </div>
      </div>
      <div className="bg-amber-50/80 rounded-xl p-3 flex items-center gap-3 border border-amber-100/50">
        <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-sm">
          <UserCheck className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[11px] text-amber-600/70 font-medium">O'qituvchilar</p>
          <p className="text-lg font-bold text-gray-900 leading-tight">{teachers.length}</p>
        </div>
      </div>
      <div className="bg-purple-50/80 rounded-xl p-3 flex items-center gap-3 border border-purple-100/50">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm">
          <DoorOpen className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[11px] text-purple-600/70 font-medium">Xonali guruhlar</p>
          <p className="text-lg font-bold text-gray-900 leading-tight">{roomCount}</p>
        </div>
      </div>
    </div>
  );

  const renderLoading = () => (
    <Layout>
      <div className="w-full min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full h-full p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                <div className="absolute inset-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full animate-pulse" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Guruhlar yuklanmoqda...</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );

  if (loading && groups.length === 0) return renderLoading();

  return (
    <Layout>
      <div className="w-full min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full h-full p-4 md:p-6 lg:p-8 space-y-5">

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-200/50">
                <School className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold text-gray-900">Guruhlar boshqaruvi</h1>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[11px] font-semibold px-2.5 py-0.5">
                    {total} ta
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {teachers.length} ta o'qituvchi &middot; {studentCount} ta student
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Button variant="outline" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}
                className="border-gray-300 hover:bg-gray-100 h-9 text-sm shadow-sm">
                <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                Yangilash
              </Button>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-200/50 h-9 text-sm">
                <Link href="/groups/new">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Guruh yaratish
                </Link>
              </Button>
            </div>
          </div>

          {/* STATS */}
          {renderStats()}

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 rounded-xl">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* TEACHERS ROW */}
          <Card className="border border-gray-200/80 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-sm">
                    <UserCheck className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm">O'qituvchilar</h3>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-medium px-2 py-0">
                    {teachers.length} ta
                  </Badge>
                </div>
                {pTeacherId && (
                  <Button variant="ghost" size="sm" onClick={() => setPTeacherId('')}
                    className="h-7 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2">
                    <X className="h-3 w-3 mr-1" />
                    Bekor qilish
                  </Button>
                )}
              </div>
              {teachersLoading ? (
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-9 w-28 rounded-full bg-gray-200" />)}
                </div>
              ) : teachers.length === 0 ? (
                <p className="text-sm text-gray-400">O'qituvchilar mavjud emas</p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {teachers.map(t => {
                    const isActive = pTeacherId === t.id;
                    const groupCount = (t.mainGroups?.length || 0) + (t.supportGroups?.length || 0);
                    return (
                      <button
                        key={t.id}
                        onClick={() => setPTeacherId(prev => prev === t.id ? '' : t.id)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all duration-200 text-sm whitespace-nowrap',
                          isActive
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-200 scale-[1.02]'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-sm'
                        )}
                      >
                        <Avatar className="h-6 w-6 border-2 border-white shadow-sm flex-shrink-0">
                          <AvatarImage src={t.photo || ''} />
                          <AvatarFallback className={cn(
                            'text-[9px] font-bold',
                            isActive ? 'bg-emerald-200 text-emerald-800' : 'bg-blue-100 text-blue-700'
                          )}>
                            {getInitials(t.first_name, t.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{t.first_name} {t.last_name}</span>
                        {groupCount > 0 && (
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                            isActive ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-100 text-gray-500'
                          )}>
                            {groupCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* FILTERS */}
          <Card className="border border-gray-200/80 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="pb-2 pt-3.5 px-4 cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                    <Filter className="h-3.5 w-3.5 text-white" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-gray-800">Filtrlash</CardTitle>
                  {hasActiveFilters && (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-medium px-2 py-0">
                      {[aSearch, aTeacherId].filter(Boolean).length +
                       (aParity !== 'all' ? 1 : 0) + (aDay !== 'all' ? 1 : 0) + (aTime !== 'all' ? 1 : 0)} ta faol
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600">
                  {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {showFilters && (
              <CardContent className="p-4 pt-2">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
                  <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Guruh nomi..."
                      className="pl-9 border-gray-300 h-9 text-sm focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      value={pSearch}
                      onChange={e => setPSearch(e.target.value)}
                    />
                  </div>

                  <Select value={pParity} onValueChange={setPParity}>
                    <SelectTrigger className="w-[130px] h-9 text-sm border-gray-300 rounded-lg">
                      <SelectValue placeholder="Juftlik" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARITY_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={pDay} onValueChange={setPDay}>
                    <SelectTrigger className="w-[150px] h-9 text-sm border-gray-300 rounded-lg">
                      <SelectValue placeholder="Kun" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={pTime} onValueChange={setPTime}>
                    <SelectTrigger className="w-[160px] h-9 text-sm border-gray-300 rounded-lg">
                      <SelectValue placeholder="Vaqt" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Button onClick={applyFilters}
                      disabled={!hasPendingChanges && !hasActiveFilters}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-9 text-sm shadow-md shadow-blue-200/40">
                      <Check className="h-4 w-4 mr-1.5" />
                      Qo'llash
                    </Button>
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearFilters}
                        className="border-gray-300 text-gray-600 hover:text-red-600 hover:border-red-300 h-9 text-sm">
                        <X className="h-4 w-4 mr-1.5" />
                        Tozalash
                      </Button>
                    )}
                    <Select value={String(limit)} onValueChange={v => { setLimit(Number(v)); setPage(1); }}>
                      <SelectTrigger className="w-[80px] h-9 text-sm border-gray-300 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZE_OPTIONS.map(n => (
                          <SelectItem key={n} value={String(n)}>{n} ta</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Active filter badges */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    <Filter className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-gray-500 font-medium mr-1">Faol filtrlar:</span>
                    {aSearch && (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-medium px-2 py-0.5">
                        Qidiruv: {aSearch}
                      </Badge>
                    )}
                    {aTeacherId && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-medium px-2 py-0.5">
                        {teachers.find(t => t.id === aTeacherId)?.first_name} {teachers.find(t => t.id === aTeacherId)?.last_name}
                      </Badge>
                    )}
                    {aParity !== 'all' && (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-medium px-2 py-0.5">
                        {PARITY_OPTIONS.find(o => o.value === aParity)?.label}
                      </Badge>
                    )}
                    {aDay !== 'all' && (
                      <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-medium px-2 py-0.5">
                        {DAY_OPTIONS.find(o => o.value === aDay)?.label}
                      </Badge>
                    )}
                    {aTime !== 'all' && (
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-medium px-2 py-0.5">
                        {TIME_SLOTS.find(o => o.value === aTime)?.label}
                      </Badge>
                    )}
                  </div>
                )}

                {hasPendingChanges && !hasActiveFilters && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 bg-amber-50/50 px-3 py-1.5 rounded-lg">
                    <AlertCircle className="h-3 w-3" />
                    Filtrlarni qo'llash uchun "Qo'llash" tugmasini bosing
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* TABLE */}
          <Card className="border border-gray-200/80 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="pb-0 pt-4 px-5 border-b border-gray-100/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                    <Layers className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-gray-800">Guruhlar ro'yxati</CardTitle>
                    <CardDescription className="text-xs text-gray-500">
                      {total > 0
                        ? `${groups.length} ta ko'rsatilmoqda (jami ${total}) — Sahifa ${page}/${totalPages}`
                        : 'Guruhlar topilmadi'}
                    </CardDescription>
                  </div>
                </div>
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Yuklanmoqda...
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading && groups.length > 0 && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              )}
              {groups.length === 0 ? (
                <div className="text-center py-20 px-5">
                  <div className="inline-block p-5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-5">
                    <School className="h-12 w-12 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Guruhlar topilmadi</h3>
                  <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                    {hasActiveFilters
                      ? 'Filtr shartlariga mos guruhlar mavjud emas. Filtrlarni o\'zgartirib ko\'ring.'
                      : 'Hali hech qanday guruh yaratilmagan. Birinchi guruhingizni yaratishdan boshlang.'}
                  </p>
                  <div className="flex gap-3 justify-center">
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearFilters}
                        className="border-gray-300 text-gray-600 h-9 text-sm">
                        <X className="h-4 w-4 mr-2" /> Filtrlarni tozalash
                      </Button>
                    )}
                    {!hasActiveFilters && (
                      <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md h-9 text-sm">
                        <Link href="/groups/new">
                          <Plus className="h-4 w-4 mr-2" /> Guruh yaratish
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block relative">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/80 border-b border-gray-200">
                          <TableHead className="w-12 text-center text-gray-500 font-semibold text-[11px] uppercase tracking-wider">#</TableHead>
                          <TableHead className="text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Guruh</TableHead>
                          <TableHead className="text-gray-500 font-semibold text-[11px] uppercase tracking-wider">O'qituvchi</TableHead>
                          <TableHead className="text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Dars vaqti</TableHead>
                          <TableHead className="text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Xona</TableHead>
                          <TableHead className="text-center text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Studentlar</TableHead>
                          <TableHead className="text-center text-gray-500 font-semibold text-[11px] uppercase tracking-wider w-20">Amallar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groups.map((group, index) => {
                          const parity = group.lessons?.[0]?.parity || '';
                          const lessonDay = group.lessons?.[0] ? getLessonDayName(group.lessons[0]) : '';
                          const lessonTime = getLessonTimes(group);
                          return (
                            <TableRow key={group.id}
                              className="hover:bg-gradient-to-r hover:from-blue-50/60 hover:to-indigo-50/40 cursor-pointer border-b border-gray-100 transition-all duration-200 group"
                              onClick={() => router.push(`/groups/${group.id}`)}>
                              <TableCell className="text-center text-gray-400 text-xs font-mono">
                                {(page - 1) * limit + index + 1}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100/50 group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-200">
                                    <School className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-blue-700 transition-colors duration-200">
                                      {group.name}
                                    </div>
                                    {group.level && (
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-medium px-1.5 py-0">
                                          {group.level.name}
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {group.mainTeacher ? (
                                  <div className="flex items-center gap-2.5">
                                    <Avatar className="h-8 w-8 border-2 border-gray-100 shadow-sm flex-shrink-0">
                                      <AvatarImage src={group.mainTeacher.photo || ''} />
                                      <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                        {getInitials(group.mainTeacher.first_name, group.mainTeacher.last_name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <div className="text-sm font-medium text-gray-900 leading-tight truncate max-w-[160px]">
                                        {group.mainTeacher.first_name} {group.mainTeacher.last_name}
                                      </div>
                                      <div className="text-[10px] text-gray-400 truncate max-w-[160px] leading-tight">
                                        {formatPhone(group.mainTeacher.phone_number) || group.mainTeacher.gmail || ''}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1 min-w-[100px]">
                                  {lessonDay && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-700">
                                      <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                      <span className="font-medium">{lessonDay}</span>
                                    </div>
                                  )}
                                  {lessonTime && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                      <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                      <span>{lessonTime}</span>
                                    </div>
                                  )}
                                  {parity && <div>{getParityBadge(parity)}</div>}
                                  {!lessonDay && !lessonTime && (
                                    <span className="text-gray-400 text-xs italic">Dars yo'q</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {group.room ? (
                                  <div>
                                    <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] font-medium px-2 py-0.5 mb-1">
                                      <DoorOpen className="h-3 w-3 mr-1" />
                                      {group.room.name}
                                    </Badge>
                                    <div className="text-[10px] text-gray-500 leading-tight">
                                      <span>Sig'imi: <strong className="text-gray-700">{group.room.capacity}</strong></span>
                                      {group.room.available_seats !== undefined && (
                                        <span className="ml-1">
                                          &middot; Bo'sh: <strong className={group.room.available_seats > 0 ? 'text-emerald-600' : 'text-red-500'}>{group.room.available_seats}</strong>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50/80 border border-gray-100">
                                  <Users className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="font-bold text-gray-900 text-sm">{group.student_count || 0}</span>
                                </div>
                                {(group.trial_count || 0) > 0 && (
                                  <div className="text-[10px] text-amber-600 font-medium mt-0.5">+{group.trial_count} proba</div>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center gap-0.5" onClick={e => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm" asChild
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                    title="Batafsil">
                                    <Link href={`/groups/${group.id}`}><Eye className="h-4 w-4" /></Link>
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm"
                                        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-white border-gray-200 shadow-xl rounded-xl min-w-[150px] p-1.5">
                                      <DropdownMenuItem asChild className="text-gray-700 text-sm rounded-lg hover:bg-blue-50 cursor-pointer">
                                        <Link href={`/groups/${group.id}`}>
                                          <Eye className="h-4 w-4 mr-2 text-blue-500" /> Batafsil
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem asChild className="text-gray-700 text-sm rounded-lg hover:bg-emerald-50 cursor-pointer">
                                        <Link href={`/groups/${group.id}/edit`}>
                                          <Edit className="h-4 w-4 mr-2 text-emerald-500" /> Tahrirlash
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="my-1" />
                                      <DropdownMenuItem onClick={() => {
                                        setGroupToDelete(group);
                                        setShowDeleteModal(true);
                                        setDeleteError(null);
                                      }} className="text-red-600 text-sm rounded-lg hover:bg-red-50 cursor-pointer">
                                        <Trash2 className="h-4 w-4 mr-2" /> O'chirish
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-2.5 p-3">
                    {groups.map(group => {
                      const parity = group.lessons?.[0]?.parity || '';
                      const lessonDay = group.lessons?.[0] ? getLessonDayName(group.lessons[0]) : '';
                      const lessonTime = getLessonTimes(group);
                      return (
                        <div key={group.id}
                          className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-200 hover:scale-[1.01] active:scale-[0.99]"
                          onClick={() => router.push(`/groups/${group.id}`)}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100/50">
                                <School className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate max-w-[180px]">{group.name}</h3>
                                {group.level && (
                                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-medium px-1.5 py-0 mt-0.5">
                                    {group.level.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                <Link href={`/groups/${group.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white border-gray-200 shadow-xl rounded-xl min-w-[140px] p-1.5">
                                  <DropdownMenuItem asChild className="text-gray-700 text-xs rounded-lg hover:bg-blue-50 cursor-pointer">
                                    <Link href={`/groups/${group.id}/edit`}><Edit className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Tahrirlash</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="my-1" />
                                  <DropdownMenuItem onClick={() => {
                                    setGroupToDelete(group);
                                    setShowDeleteModal(true);
                                    setDeleteError(null);
                                  }} className="text-red-600 text-xs rounded-lg hover:bg-red-50 cursor-pointer">
                                    <Trash2 className="h-3.5 w-3.5 mr-2" /> O'chirish
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                            <span className="text-gray-500">O'qituvchi:</span>
                            <span className="text-gray-900 text-right truncate font-medium">
                              {group.mainTeacher ? `${group.mainTeacher.first_name} ${group.mainTeacher.last_name}` : '-'}
                            </span>
                            {lessonDay && (
                              <>
                                <span className="text-gray-500">Dars:</span>
                                <span className="text-gray-900 text-right flex items-center justify-end gap-1">
                                  <Calendar className="h-3 w-3 text-gray-400" />
                                  {lessonDay} {lessonTime}
                                </span>
                              </>
                            )}
                            <span className="text-gray-500">Studentlar:</span>
                            <span className="text-gray-900 text-right font-bold">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-md">
                                <Users className="h-3 w-3 text-gray-400" />
                                {group.student_count || 0}
                              </span>
                            </span>
                            {group.room && (
                              <>
                                <span className="text-gray-500">Xona:</span>
                                <span className="text-right">
                                  <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-medium px-1.5 py-0">
                                    <DoorOpen className="h-3 w-3 mr-0.5" />
                                    {group.room.name}
                                  </Badge>
                                  <div className="text-[9px] text-gray-400 mt-0.5">
                                    {group.room.capacity} o'rin &middot; {group.room.available_seats !== undefined ? (
                                      <span className={group.room.available_seats > 0 ? 'text-emerald-600' : 'text-red-500'}>{group.room.available_seats} bo'sh</span>
                                    ) : ''}
                                  </div>
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                            {parity && getParityBadge(parity)}
                            {(group.trial_count || 0) > 0 && (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-medium px-1.5 py-0">
                                +{group.trial_count} proba
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* PAGINATION */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
                      <div className="text-sm text-gray-500 bg-white/80 border border-gray-100 px-3.5 py-1.5 rounded-lg shadow-sm">
                        Sahifa <strong className="text-gray-700">{page}</strong> / {totalPages}
                        <span className="mx-1.5 text-gray-300">&middot;</span>
                        jami <strong className="text-gray-700">{total}</strong> ta guruh
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="border-gray-300 hover:bg-gray-100 h-9 text-sm transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100">
                          <ChevronLeft className="h-4 w-4 mr-1" /> Oldingi
                        </Button>
                        <div className="flex items-center gap-1">
                          {(() => {
                            const pages: number[] = [];
                            const tp = totalPages;
                            const cp = page;
                            if (tp <= 7) {
                              for (let i = 1; i <= tp; i++) pages.push(i);
                            } else {
                              pages.push(1);
                              if (cp > 3) pages.push(-1);
                              for (let i = Math.max(2, cp - 1); i <= Math.min(tp - 1, cp + 1); i++) pages.push(i);
                              if (cp < tp - 2) pages.push(-1);
                              pages.push(tp);
                            }
                            return pages.map((p, i) =>
                              p === -1 ? (
                                <span key={`dot-${i}`} className="px-1 text-gray-400 text-sm select-none">...</span>
                              ) : (
                                <Button key={p}
                                  variant={page === p ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setPage(p)}
                                  className={cn(
                                    'h-9 w-9 p-0 text-xs font-semibold transition-all duration-200 hover:scale-105',
                                    page === p
                                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200/50 hover:from-blue-700 hover:to-indigo-700'
                                      : 'border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400'
                                  )}>
                                  {p}
                                </Button>
                              )
                            );
                          })()}
                        </div>
                        <Button variant="outline" size="sm"
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="border-gray-300 hover:bg-gray-100 h-9 text-sm transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100">
                          Keyingi <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-white max-w-md rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> Guruhni o'chirish
              </DialogTitle>
              <DialogDescription className="text-white/80 text-sm mt-1">
                Bu amalni ortga qaytarib bo'lmaydi
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-2.5 bg-red-100 rounded-full flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  <span className="font-bold text-red-600">{groupToDelete?.name}</span> guruhini o'chirishga ishonchingiz komilmi?
                </p>
                <p className="text-gray-500 text-xs mt-1">Bu guruhdagi barcha ma'lumotlar o'chiriladi</p>
              </div>
            </div>
            {deleteError && (
              <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 text-sm">{deleteError}</AlertDescription>
              </Alert>
            )}
            <DialogFooter className="flex gap-3 sm:gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="flex-1 border-gray-300 hover:bg-gray-100 h-10 text-sm rounded-xl">
                Bekor qilish
              </Button>
              <Button variant="destructive" onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white h-10 text-sm rounded-xl shadow-md shadow-red-200/50">
                {deleteLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    O'chirilmoqda...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" /> Guruhni o'chirish
                  </span>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}
