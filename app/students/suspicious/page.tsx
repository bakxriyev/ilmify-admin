'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import {
  Users, AlertTriangle, Search, RefreshCw, Loader2, Trash2,
  UserPlus, Eye, Phone, Mail, Building, AlertCircle, CheckCircle,
  XCircle, ChevronDown, ChevronRight, Merge, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { studentsApi, type Student } from '../../../api/studentApi';
import toast from 'react-hot-toast';

interface SuspiciousGroup {
  type: string;
  label: string;
  students: Student[];
}

export default function SuspiciousStudentsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<SuspiciousGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSuspicious, setTotalSuspicious] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeMain, setMergeMain] = useState<Student | null>(null);
  const [mergeSecondary, setMergeSecondary] = useState<Student | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const fetchSuspicious = useCallback(async () => {
    try {
      setLoading(true);
      const response = await studentsApi.getSuspicious();
      setGroups(response.groups || []);
      setTotalSuspicious(response.total_suspicious || 0);
    } catch (err: any) {
      toast.error('Shubhali studentlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuspicious();
  }, [fetchSuspicious]);

  const filteredGroups = groups.filter(g => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return g.label.toLowerCase().includes(search) ||
      g.students.some(s =>
        s.first_name.toLowerCase().includes(search) ||
        s.last_name.toLowerCase().includes(search) ||
        (s.phone_number || '').includes(search)
      );
  });

  const toggleGroup = (idx: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedGroups(newExpanded);
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    try {
      setIsDeleting(true);
      await studentsApi.delete(studentToDelete.id);
      toast.success(`${studentToDelete.first_name} ${studentToDelete.last_name} o'chirildi`);
      setShowDeleteModal(false);
      setStudentToDelete(null);
      fetchSuspicious();
    } catch (err: any) {
      toast.error(err.message || "O'chirishda xatolik");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMerge = async () => {
    if (!mergeMain || !mergeSecondary) return;
    try {
      setIsMerging(true);
      const res = await studentsApi.mergeStudents(
        Number(mergeMain.id),
        Number(mergeSecondary.id)
      );
      toast.success(res.message || 'Studentlar birlashtirildi');
      setShowMergeModal(false);
      setMergeMain(null);
      setMergeSecondary(null);
      fetchSuspicious();
    } catch (err: any) {
      toast.error(err.message || 'Birlashtirishda xatolik');
    } finally {
      setIsMerging(false);
    }
  };

  const formatPhone = (phone: string | null | undefined) => {
    if (!phone) return '—';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('998')) {
      return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    }
    return phone;
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'same_full_name':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Bir xil ism familiya</Badge>;
      case 'same_first_name':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Bir xil ism</Badge>;
      case 'same_last_name':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Bir xil familiya</Badge>;
      case 'similar_name':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">O'xshash ism</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{type}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="w-full min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="w-full h-full p-4 md:p-6 lg:p-8">
          <div className="space-y-4 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Shubhali Studentlar
                  {totalSuspicious > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 text-xs ml-1">
                      {totalSuspicious} ta
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Bir xil yoki o'xshash ma'lumotlarga ega studentlar
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchSuspicious} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Yangilash
                </Button>
                <Button size="sm" onClick={() => router.push('/students/new')}>
                  <UserPlus className="h-4 w-4 mr-1" /> Yangi Student
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-amber-50 rounded-lg p-3 flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded"><AlertTriangle className="h-4 w-4 text-amber-600" /></div>
                <div>
                  <p className="text-xs text-gray-500">Shubhali</p>
                  <p className="text-sm font-bold text-gray-900">{totalSuspicious}</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded"><Users className="h-4 w-4 text-blue-600" /></div>
                <div>
                  <p className="text-xs text-gray-500">Guruhlar</p>
                  <p className="text-sm font-bold text-gray-900">{groups.length}</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Ism, familiya yoki telefon bo'yicha qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
              </CardHeader>
            </Card>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-24">
                <div className="inline-block p-6 bg-green-100 rounded-full mb-6">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Shubhali studentlar topilmadi</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Qidiruv bo\'yicha hech narsa topilmadi' : 'Barcha student ma\'lumotlari bir-biridan farqli'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGroups.map((group, idx) => (
                  <Card key={idx} className="border border-gray-200 shadow-sm overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleGroup(idx)}
                    >
                      <div className="flex items-center gap-3">
                        {getTypeBadge(group.type)}
                        <span className="font-medium text-gray-800">{group.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {group.students.length} ta
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="p-1">
                        {expandedGroups.has(idx) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {expandedGroups.has(idx) && (
                      <div className="border-t border-gray-100 p-4">
                        <div className="space-y-3">
                          {group.students.map((student) => (
                            <div
                              key={student.id}
                              className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                            >
                              <Avatar className="h-10 w-10 border-2 border-gray-200">
                                <AvatarImage
                                  src={student.photo ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/students/${student.photo}` : ''}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm">
                                  {student.first_name?.[0]}{student.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">
                                    {student.first_name} {student.last_name}
                                  </span>
                                  <Badge className={`text-[10px] px-1.5 py-0 ${student.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {student.isActive ? 'Faol' : 'Nofaol'}
                                  </Badge>
                                  <span className="text-xs text-gray-400">ID: {student.id}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {formatPhone(student.phone_number)}
                                  </span>
                                  {student.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {student.email}
                                    </span>
                                  )}
                                  {student.group_students && student.group_students.filter((gs: any) => !gs.left_date).length > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Building className="h-3 w-3" />
                                      {student.group_students
                                        .filter((gs: any) => !gs.left_date)
                                        .map((gs: any) => gs.group?.name)
                                        .join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                  onClick={() => router.push(`/students/${student.id}`)}
                                  title="Ko'rish"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    setStudentToDelete(student);
                                    setShowDeleteModal(true);
                                  }}
                                  title="O'chirish"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-50"
                                  onClick={() => {
                                    if (!mergeMain) {
                                      setMergeMain(student);
                                    } else if (mergeMain.id !== student.id) {
                                      setMergeSecondary(student);
                                      setShowMergeModal(true);
                                    } else {
                                      toast.error('Bir xil studentni tanladingiz');
                                    }
                                  }}
                                  title={mergeMain ? 'Ikkinchi studentni tanlash' : 'Birlashtirish uchun tanlash'}
                                >
                                  <Shield className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {group.students.length >= 2 && (
                          <div className="mt-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-amber-700 border-amber-200 hover:bg-amber-50"
                              onClick={() => {
                                setMergeMain(group.students[0]);
                                setMergeSecondary(group.students[1]);
                                setShowMergeModal(true);
                              }}
                            >
                              <Merge className="h-4 w-4 mr-1" />
                              Guruhdagi birinchi ikkita studentni birlashtirish
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="bg-white dark:bg-gray-900 max-w-md rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Trash2 className="h-6 w-6" />
                  Studentni O'chirish
                </DialogTitle>
                <DialogDescription className="text-white/90">
                  Bu amalni ortga qaytarib bo'lmaydi
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <p className="text-gray-700 text-lg">
                    <span className="font-bold text-red-600">
                      {studentToDelete?.first_name} {studentToDelete?.last_name}
                    </span>{' '}
                    ni o'chirishni tasdiqlaysizmi?
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    ID: {studentToDelete?.id}
                  </p>
                </div>
              </div>
              <DialogFooter className="flex gap-3">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1">
                  Bekor qilish
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white"
                >
                  {isDeleting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />O'chirilmoqda...</>
                  ) : (
                    <><Trash2 className="h-4 w-4 mr-2" />O'chirish</>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Merge Modal */}
        <Dialog open={showMergeModal} onOpenChange={setShowMergeModal}>
          <DialogContent className="bg-white dark:bg-gray-900 max-w-lg rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Merge className="h-6 w-6" />
                  Studentlarni Birlashtirish
                </DialogTitle>
                <DialogDescription className="text-white/90">
                  Ikki studentni birlashtirish orqali bitta student qilish
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <AlertTriangle className="h-4 w-4 inline mr-1 text-amber-500" />
                Birlashtirilganda: davomatlar, guruhlar, to'lovlar, ota-ona ma'lumotlari, coinlar va boshqa barcha ma'lumotlar asosiy studentga o'tkaziladi.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border-2 border-blue-300 bg-blue-50">
                  <Badge className="bg-blue-600 text-white mb-2">Asosiy</Badge>
                  <p className="font-bold text-gray-900">{mergeMain?.first_name} {mergeMain?.last_name}</p>
                  <p className="text-sm text-gray-500">ID: {mergeMain?.id}</p>
                  <p className="text-sm text-gray-500">{mergeMain?.phone_number || 'Tel: yo\'q'}</p>
                </div>
                <div className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50">
                  <Badge className="bg-amber-600 text-white mb-2">Qo'shiladi</Badge>
                  <p className="font-bold text-gray-900">{mergeSecondary?.first_name} {mergeSecondary?.last_name}</p>
                  <p className="text-sm text-gray-500">ID: {mergeSecondary?.id}</p>
                  <p className="text-sm text-gray-500">{mergeSecondary?.phone_number || 'Tel: yo\'q'}</p>
                </div>
              </div>
              <DialogFooter className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => {
                  setShowMergeModal(false);
                  setMergeMain(null);
                  setMergeSecondary(null);
                }} className="flex-1">
                  Bekor qilish
                </Button>
                <Button
                  onClick={handleMerge}
                  disabled={isMerging}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                >
                  {isMerging ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Birlashtirilmoqda...</>
                  ) : (
                    <><Merge className="h-4 w-4 mr-2" />Birlashtirish</>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
