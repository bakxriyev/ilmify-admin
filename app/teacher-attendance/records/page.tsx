'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Layout from '@/components/Layout';
import {
  Loader2, Filter, X, Calendar, MapPin, Clock, Camera, XCircle,
  ChevronRight, CheckCircle2, UserCheck, Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@/components/ui/command';
import { teacherAttendanceApi, type TeacherAttendanceRecord } from '@/api/teacherAttendanceApi';
import { teachersApi, type Teacher } from '@/api/teachersApi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';

const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
const weekDays = ['Ya', 'Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha'];
const weekDaysFull = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

function formatShortDate(d: Date) {
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function formatTime(d: string | null) {
  if (!d) return '—';
  try { return format(new Date(d), 'HH:mm'); } catch { return '—'; }
}

function formatDateFull(d: string) {
  try {
    const dt = new Date(d);
    return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
  } catch { return d; }
}

function getSelfieUrl(selfie: string | null) {
  if (!selfie) return null;
  if (selfie.startsWith('http')) return selfie;
  return `${API_BASE}/uploads/teacher-attendance/${selfie}`;
}

interface TeacherInfo {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  photo: string | null;
}

export default function AttendanceRecordsPage() {
  const [allRecords, setAllRecords] = useState<TeacherAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      return format(d, 'yyyy-MM-dd');
    })(),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    teacher_id: undefined as number | undefined,
  });
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherInfo | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selfieModal, setSelfieModal] = useState<string | null>(null);
  const [allTeachers, setAllTeachers] = useState<TeacherInfo[]>([]);
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const [teacherPopoverOpen, setTeacherPopoverOpen] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');

  const teachers = useMemo(() => {
    if (allTeachers.length > 0) return allTeachers;
    const seen = new Set<number>();
    const result: TeacherInfo[] = [];
    allRecords.forEach(r => {
      const tid = Number(r.teacher_id);
      if (!seen.has(tid)) {
        seen.add(tid);
        if (r.teacher) {
          result.push(r.teacher);
        } else {
          result.push({
            id: tid,
            first_name: `O'qituvchi #${tid}`,
            last_name: '',
            phone_number: '',
            photo: null,
          });
        }
      }
    });
    return result;
  }, [allTeachers, allRecords]);

  const dateColumns = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(filters.start_date + 'T00:00:00');
    const end = new Date(filters.end_date + 'T00:00:00');
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [filters.start_date, filters.end_date]);

  const teacherDateMap = useMemo(() => {
    const map = new Map<number, Map<string, TeacherAttendanceRecord>>();
    allRecords.forEach(r => {
      const tid = Number(r.teacher_id);
      if (!map.has(tid)) map.set(tid, new Map());
      map.get(tid)!.set(r.date, r);
    });
    return map;
  }, [allRecords]);

  const filteredTeachers = useMemo(() => {
    if (!filters.teacher_id) return teachers;
    return teachers.filter(t => t.id === filters.teacher_id);
  }, [teachers, filters.teacher_id]);

  const sortedTeachers = useMemo(() => {
    return [...filteredTeachers].sort((a, b) =>
      `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
    );
  }, [filteredTeachers]);

  const fetchTeachers = useCallback(async () => {
    try {
      const result = await teachersApi.getAll({ limit: 1000 });
      const mapped: TeacherInfo[] = result.data.map(t => ({
        id: Number(t.id),
        first_name: t.first_name,
        last_name: t.last_name,
        phone_number: t.phone_number,
        photo: t.photo,
      }));
      setAllTeachers(mapped);
    } catch { }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const result = await teacherAttendanceApi.getAllRecords({
        limit: 1000,
        start_date: filters.start_date,
        end_date: filters.end_date,
        teacher_id: filters.teacher_id,
      });
      const normalized = (result.data || []).map((r: any) => ({
        ...r,
        id: Number(r.id),
        teacher_id: Number(r.teacher_id),
        location_id: Number(r.location_id),
        center_id: Number(r.center_id),
        distance: Number(r.distance),
      }));
      setAllRecords(normalized);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik');
    } finally {
      setLoading(false);
    }
  }, [filters.start_date, filters.end_date, filters.teacher_id]);

  useEffect(() => { fetchTeachers(); fetchRecords(); }, [fetchTeachers, fetchRecords]);

  const openTeacherSheet = (teacher: TeacherInfo) => {
    setSelectedTeacher(teacher);
    setSheetOpen(true);
  };

  const teacherRecords = useMemo(() => {
    if (!selectedTeacher) return [];
    const dateMap = teacherDateMap.get(selectedTeacher.id);
    if (!dateMap) return [];
    return dateColumns
      .map(d => {
        const dateStr = format(d, 'yyyy-MM-dd');
        return { date: d, record: dateMap.get(dateStr) || null };
      })
      .filter(x => x.record);
  }, [selectedTeacher, teacherDateMap, dateColumns]);

  const selectedTeacherInfo = selectedTeacher
    ? teachers.find(t => t.id === selectedTeacher.id)
    : null;

  return (
    <Layout>
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">O'qituvchi Davomat Yozuvlari</h1>
            <p className="text-xs md:text-sm text-gray-500">
              {allRecords.length} ta yozuv
            </p>
          </div>
        </div>

        <Card className="mb-4">
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-full md:w-64">
                <label className="text-xs text-gray-500 mb-1 block">O'qituvchi</label>
                <Popover open={teacherPopoverOpen} onOpenChange={setTeacherPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={teacherPopoverOpen}
                      className="w-full justify-between text-sm h-9"
                    >
                      {filters.teacher_id
                        ? (() => {
                            const t = teachers.find(t => t.id === filters.teacher_id);
                            return t ? `${t.first_name} ${t.last_name}` : 'Tanlangan';
                          })()
                        : "Barcha o'qituvchilar"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0 bg-white" align="start">
                    <Command>
                      <CommandInput
                        placeholder="O'qituvchi qidirish..."
                        value={teacherSearch}
                        onValueChange={setTeacherSearch}
                      />
                      <CommandList>
                        <CommandEmpty>O'qituvchi topilmadi</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              setFilters(prev => ({ ...prev, teacher_id: undefined }));
                              setTeacherPopoverOpen(false);
                            }}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Barcha o'qituvchilar
                          </CommandItem>
                          {teachers.map(t => (
                            <CommandItem
                              key={t.id}
                              value={`${t.first_name} ${t.last_name} ${t.phone_number}`}
                              onSelect={() => {
                                setFilters(prev => ({ ...prev, teacher_id: t.id }));
                                setTeacherPopoverOpen(false);
                              }}
                            >
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                                  {t.first_name[0]}{t.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm truncate">{t.first_name} {t.last_name}</p>
                                <p className="text-[10px] text-gray-400">{t.phone_number}</p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Boshlanish</label>
                <Input
                  type="date"
                  value={filters.start_date}
                  onChange={e => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                  className="h-9 text-sm w-36"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tugash</label>
                <Input
                  type="date"
                  value={filters.end_date}
                  onChange={e => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                  className="h-9 text-sm w-36"
                />
              </div>

              <Button size="sm" onClick={fetchRecords} className="h-9">
                <Filter className="h-4 w-4 mr-1" /> Filtrlash
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - 29);
                  setFilters({
                    start_date: format(start, 'yyyy-MM-dd'),
                    end_date: format(end, 'yyyy-MM-dd'),
                    teacher_id: undefined,
                  });
                }}
                className="h-9"
              >
                <X className="h-4 w-4 mr-1" /> Tozalash
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : sortedTeachers.length === 0 ? (
              <div className="text-center py-20 text-gray-500">Hech qanday davomat yozuvi topilmadi</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="sticky left-0 bg-gray-50 z-10 p-2 text-[11px] font-semibold text-gray-500 text-center border-r border-gray-200 w-8">
                        #
                      </th>
                      <th className="sticky left-8 bg-gray-50 z-10 p-2 text-[11px] font-semibold text-gray-500 text-left border-r border-gray-200 min-w-[160px]">
                        O'qituvchi
                      </th>
                      {dateColumns.map(d => {
                        const isToday = format(d, 'yyyy-MM-dd') === todayStr;
                        return (
                          <th
                            key={format(d, 'yyyy-MM-dd')}
                            className={`p-1.5 text-[11px] font-semibold text-center border-r border-gray-200 min-w-[60px] ${
                              isToday ? 'text-blue-600 bg-blue-50/60' : d.getDay() === 0 ? 'text-red-600 bg-red-50/50' : 'text-gray-500'
                            }`}
                          >
                            <div>{formatShortDate(d)}</div>
                            <div className="text-[9px] font-normal">{weekDays[d.getDay()]}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTeachers.map((teacher, idx) => {
                      const dateMap = teacherDateMap.get(teacher.id) || new Map();
                      return (
                        <tr
                          key={teacher.id}
                          className="border-b border-gray-100 hover:bg-blue-50/60 cursor-pointer transition-colors"
                          onClick={() => openTeacherSheet(teacher)}
                        >
                          <td className="sticky left-0 bg-white z-10 p-2 text-[11px] text-gray-400 text-center border-r border-gray-100">
                            {idx + 1}
                          </td>
                          <td className="sticky left-8 bg-white z-10 p-2 border-r border-gray-100">
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[9px] bg-blue-100 text-blue-700 font-medium">
                                  {teacher.first_name[0]}{teacher.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-medium text-gray-800 truncate leading-tight">
                                  {teacher.first_name} {teacher.last_name}
                                </p>
                                <p className="text-[9px] text-gray-400">{teacher.phone_number}</p>
                              </div>
                              <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />
                            </div>
                          </td>
                          {dateColumns.map(d => {
                            const dateStr = format(d, 'yyyy-MM-dd');
                            const record = dateMap.get(dateStr);
                            const isSunday = d.getDay() === 0;
                            const isToday = dateStr === todayStr;
                            let bgClass = '';
                            if (record) {
                              bgClass = record.check_out ? 'bg-green-50/40' : 'bg-yellow-50/40';
                            } else if (isToday) {
                              bgClass = 'bg-blue-50/40';
                            } else if (isSunday) {
                              bgClass = 'bg-red-50/40';
                            }
                            return (
                              <td
                                key={dateStr}
                                className={`p-1 text-center border-r border-gray-100 align-middle ${bgClass}`}
                              >
                                {record ? (
                                  <div className="text-[10px] leading-tight space-y-0.5">
                                    <div className="font-semibold text-green-700">
                                      {formatTime(record.check_in)}
                                    </div>
                                    <div className={`font-semibold ${record.check_out ? 'text-red-600' : 'text-yellow-600'}`}>
                                      {record.check_out ? formatTime(record.check_out) : '—'}
                                    </div>
                                    <div className="text-[8px] text-gray-400">{record.distance}m</div>
                                  </div>
                                ) : (
                                  <span className={`select-none ${isSunday ? 'text-red-200' : isToday ? 'text-blue-300' : 'text-gray-200'}`}>—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0 bg-white">
          <SheetHeader className="p-4 md:p-5 border-b shrink-0">
            {selectedTeacherInfo && (
              <div className="flex items-center gap-3 pr-8">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                    {selectedTeacherInfo.first_name[0]}{selectedTeacherInfo.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <SheetTitle className="text-base">
                    {selectedTeacherInfo.first_name} {selectedTeacherInfo.last_name}
                  </SheetTitle>
                  <p className="text-sm text-gray-500">{selectedTeacherInfo.phone_number}</p>
                </div>
              </div>
            )}
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-73px)]">
            <div className="p-4 md:p-5 space-y-3">
              {teacherRecords.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">
                  Bu o'qituvchi uchun yozuvlar topilmadi
                </p>
              ) : (
                teacherRecords.map(({ date, record }) => (
                  <div key={format(date, 'yyyy-MM-dd')} className="border rounded-lg p-3 hover:shadow-sm transition-shadow bg-white">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-sm font-semibold text-gray-800">
                          {formatShortDate(date)}
                        </span>
                        <span className="text-[10px] text-gray-400 hidden sm:inline">
                          {weekDaysFull[date.getDay()]}
                        </span>
                      </div>
                      <Badge
                        variant={record!.status === 'checked_in' ? 'default' : 'secondary'}
                        className={`text-[10px] h-5 ${
                          record!.status === 'checked_in'
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                            : 'bg-green-100 text-green-800 hover:bg-green-100'
                        }`}
                      >
                        {record!.status === 'checked_in' ? 'Kirgan' : 'Chiqgan'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        <span className="text-gray-500 text-xs">Kirish:</span>
                        <span className="font-semibold text-gray-800">{formatTime(record!.check_in)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-red-600 shrink-0" />
                        <span className="text-gray-500 text-xs">Chiqish:</span>
                        <span className="font-semibold text-gray-800">
                          {record!.check_out ? formatTime(record!.check_out) : '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="text-gray-500 text-xs">Masofa:</span>
                        <span className="font-medium text-gray-700">{record!.distance}m</span>
                      </div>
                      {record!.selfie && (
                        <div className="flex items-center gap-1.5">
                          <Camera className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <button
                            onClick={() => setSelfieModal(getSelfieUrl(record!.selfie))}
                            className="group relative"
                          >
                            <img
                              src={getSelfieUrl(record!.selfie) || ''}
                              alt="Selfie"
                              className="w-9 h-9 object-cover rounded-lg border group-hover:ring-2 group-hover:ring-blue-400 transition-all"
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {selfieModal && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelfieModal(null)}
        >
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelfieModal(null)}
              className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-100 z-10"
            >
              <XCircle className="h-5 w-5 text-gray-700" />
            </button>
            <img src={selfieModal} alt="Selfie" className="w-full h-auto rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </Layout>
  );
}
