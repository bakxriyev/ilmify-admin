'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import {
  Heart, Plus, Search, RefreshCw, ChevronLeft, ChevronRight,
  Eye, Edit, Trash2, MoreVertical, X, AlertCircle, CheckCircle,
  Phone, Mail, Calendar, Building, Loader2, Filter, Power,
  Users, UserPlus, Download, Grid, List, Star, TrendingUp, Activity,
  Award, Clock, MapPin, Globe, BookOpen, MessageSquare, Bell,
  Settings, BarChart3, PieChart, Zap, Shield, Target,
  ChevronDown, ChevronUp, Link2, Unlink, UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { debounce } from 'lodash';
import { parentsApi, type Parent, type ParentStudent } from '../../api/parentsApi';
import { studentsApi, type Student } from '../../api/studentApi';
import toast from 'react-hot-toast';

export default function ParentsPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [parents, setParents] = useState<Parent[]>([]);
  const [filteredParents, setFilteredParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Add parent modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
  });
  const [addError, setAddError] = useState<string | null>(null);

  // Children stats
  const [childrenData, setChildrenData] = useState<Record<string, ParentStudent[]>>({});
  const [totalLinkedStudents, setTotalLinkedStudents] = useState(0);

  // View children modal
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [showChildrenModal, setShowChildrenModal] = useState(false);
  const [parentChildren, setParentChildren] = useState<ParentStudent[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);

  // Link student modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);

  // Unlink confirm
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [unlinkData, setUnlinkData] = useState<{ parentId: number; studentId: number; studentName: string } | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // Search
  useEffect(() => {
    const handler = setTimeout(() => {
      const term = searchTerm.toLowerCase();
      if (!term) {
        setFilteredParents(parents);
        return;
      }
      setFilteredParents(
        parents.filter(
          (p) =>
            p.first_name.toLowerCase().includes(term) ||
            p.last_name.toLowerCase().includes(term) ||
            p.phone_number.includes(term)
        )
      );
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, parents]);

  const fetchParents = useCallback(async () => {
    try {
      setTableLoading(true);
      const data = await parentsApi.getAll();
      setParents(data);
      setFilteredParents(data);

      // Fetch children for all parents
      let linkedCount = 0;
      const childrenMap: Record<string, ParentStudent[]> = {};
      for (const parent of data) {
        try {
          const children = await parentsApi.getChildren(Number(parent.id));
          childrenMap[parent.id] = children;
          linkedCount += children.length;
        } catch {
          childrenMap[parent.id] = [];
        }
      }
      setChildrenData(childrenMap);
      setTotalLinkedStudents(linkedCount);
    } catch (err: any) {
      toast.error(err.message || 'Parentlarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  const getChildrenCount = (parentId: string): number => {
    return childrenData[parentId]?.length || 0;
  };

  // Add parent
  const handleAddParent = async () => {
    try {
      setIsAdding(true);
      setAddError(null);

      if (!addForm.first_name.trim()) throw new Error('Ism kiritilishi shart');
      if (!addForm.last_name.trim()) throw new Error('Familiya kiritilishi shart');
      if (!addForm.phone_number.trim()) throw new Error('Telefon raqam kiritilishi shart');
      if (!addForm.password || addForm.password.length < 6) throw new Error('Parol kamida 6 belgidan iborat boʻlishi kerak');

      await parentsApi.create(addForm);
      toast.success('Parent muvaffaqiyatli qoʻshildi');
      setShowAddModal(false);
      setAddForm({ first_name: '', last_name: '', phone_number: '', password: '' });
      fetchParents();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Parent qoʻshishda xatolik';
      setAddError(msg);
    } finally {
      setIsAdding(false);
    }
  };

  // View children
  const handleViewChildren = async (parent: Parent) => {
    setSelectedParent(parent);
    setShowChildrenModal(true);
    setLoadingChildren(true);
    try {
      const children = await parentsApi.getChildren(Number(parent.id));
      setParentChildren(children);
    } catch (err: any) {
      toast.error(err.message || 'Bolalarni yuklashda xatolik');
      setParentChildren([]);
    } finally {
      setLoadingChildren(false);
    }
  };

  // Link student
  const handleOpenLinkModal = async (parent: Parent) => {
    setSelectedParent(parent);
    setShowLinkModal(true);
    setSelectedStudentId('');
    try {
      const response = await studentsApi.getNoGroup({ limit: 50 });
      setAvailableStudents(response.data || []);
    } catch {
      try {
        const response = await studentsApi.getAll({ limit: 50 });
        const existingIds = childrenData[parent.id]?.map((c) => Number(c.student_id)) || [];
        setAvailableStudents((response.data || []).filter((s) => !existingIds.includes(Number(s.id))));
      } catch {
        setAvailableStudents([]);
      }
    }
  };

  const handleLinkStudent = async () => {
    if (!selectedParent || !selectedStudentId) return;
    try {
      setIsLinking(true);
      await parentsApi.linkStudent(Number(selectedParent.id), Number(selectedStudentId));
      toast.success('Student muvaffaqiyatli bogʻlandi');
      setShowLinkModal(false);
      setSelectedStudentId('');
      fetchParents();
    } catch (err: any) {
      toast.error(err.message || 'Bogʻlashda xatolik');
    } finally {
      setIsLinking(false);
    }
  };

  // Unlink student
  const handleOpenUnlinkModal = (parentId: number, studentId: number, studentName: string) => {
    setUnlinkData({ parentId, studentId, studentName });
    setShowUnlinkModal(true);
  };

  const handleUnlinkStudent = async () => {
    if (!unlinkData) return;
    try {
      setIsUnlinking(true);
      await parentsApi.unlinkStudent(unlinkData.parentId, unlinkData.studentId);
      toast.success('Student bogʻlanishi uzildi');
      setShowUnlinkModal(false);
      setUnlinkData(null);
      fetchParents();
      // Refresh children modal if open
      if (selectedParent) {
        const children = await parentsApi.getChildren(Number(selectedParent.id));
        setParentChildren(children);
      }
    } catch (err: any) {
      toast.error(err.message || 'Uzishda xatolik');
    } finally {
      setIsUnlinking(false);
    }
  };

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('998')) {
      return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    }
    return phone;
  };

  const getInitials = (first: string, last: string) => {
    return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="w-full h-full p-4 md:p-6 lg:p-8">
          <div className="space-y-4 w-full">
            {/* Simple Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-600" />
                  Ota-onalar
                  <Badge className="bg-pink-100 text-pink-700 text-xs ml-1">{parents.length} ta</Badge>
                </h1>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchParents} className="text-xs">
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Yangilash
                </Button>
                <Button size="sm" onClick={() => setShowAddModal(true)} className="text-xs bg-pink-600 hover:bg-pink-700 text-white">
                  <UserPlus className="h-3.5 w-3.5 mr-1" /> Yangi Parent
                </Button>
              </div>
            </div>

            {/* Compact Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-pink-50 rounded-lg p-3 flex items-center gap-2">
                <div className="p-1.5 bg-pink-100 rounded"><Heart className="h-4 w-4 text-pink-600" /></div>
                <div><p className="text-xs text-gray-500">Jami</p><p className="text-sm font-bold text-gray-900">{parents.length}</p></div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded"><Link2 className="h-4 w-4 text-green-600" /></div>
                <div><p className="text-xs text-gray-500">Bog'langan</p><p className="text-sm font-bold text-gray-900">{totalLinkedStudents}</p></div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded"><Users className="h-4 w-4 text-blue-600" /></div>
                <div><p className="text-xs text-gray-500">O'rt. bog'lanish</p><p className="text-sm font-bold text-gray-900">{parents.length > 0 ? (totalLinkedStudents / parents.length).toFixed(1) : '0'}</p></div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded"><UserCircle className="h-4 w-4 text-purple-600" /></div>
                <div><p className="text-xs text-gray-500">Bog'lanmagan</p><p className="text-sm font-bold text-gray-900">{parents.filter((p) => getChildrenCount(p.id) === 0).length}</p></div>
              </div>
            </div>

            {/* Parents Table Card */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-600" />
                    <CardTitle className="text-sm font-medium text-gray-700">Ota-onalar</CardTitle>
                    <CardDescription className="text-sm text-gray-500 ml-2">
                      {filteredParents.length} / {parents.length} ta
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        ref={searchInputRef}
                        placeholder="Ism, familiya yoki telefon..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9 w-64 border-gray-300 dark:border-gray-700 focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-800 dark:text-white transition-all duration-300"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchParents}
                      disabled={tableLoading}
                      className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all duration-300 hover:scale-105"
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${tableLoading ? 'animate-spin' : ''}`} />
                      Yangilash
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                {tableLoading ? (
                  <div className="flex flex-col items-center justify-center py-24">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-pink-200 border-t-pink-600 animate-spin"></div>
                      <div className="absolute inset-4 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full animate-pulse"></div>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Parentlar yuklanmoqda...</p>
                  </div>
                ) : filteredParents.length === 0 ? (
                  <div className="text-center py-24 px-4">
                    <div className="inline-block p-6 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-full mb-6">
                      <Heart className="h-16 w-16 text-pink-600 dark:text-pink-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Parentlar topilmadi</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
                      {searchTerm ? `"${searchTerm}" bo'yicha hech narsa topilmadi` : 'Yangi parent qoʻshish bilan boshlang'}
                    </p>
                    <div className="flex gap-4 justify-center">
                      {searchTerm && (
                        <Button
                          onClick={() => setSearchTerm('')}
                          variant="outline"
                          className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                        >
                          Qidiruvni tozalash
                        </Button>
                      )}
                      <Button
                        onClick={() => setShowAddModal(true)}
                        className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white transition-all duration-300 hover:scale-105"
                      >
                        <UserPlus className="h-5 w-5 mr-2" />
                        Yangi Parent
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                        <TableRow>
                          <TableHead className="w-16 text-gray-700 dark:text-gray-300">#</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Parent</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Telefon</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Bolalar soni</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Qoʻshilgan sana</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300 text-right">Amallar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredParents.map((parent, index) => (
                          <TableRow
                            key={parent.id}
                            className="hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 dark:hover:from-pink-900/20 dark:hover:to-rose-900/20 transition-all duration-300 cursor-pointer group"
                            onClick={() => handleViewChildren(parent)}
                          >
                            <TableCell className="font-medium text-gray-800 dark:text-gray-200">
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <Avatar className="h-12 w-12 border-2 border-pink-200 dark:border-pink-800">
                                    <AvatarImage src={parent.photo ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/parents/${parent.photo}` : ''} />
                                    <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-600 text-white">
                                      {getInitials(parent.first_name, parent.last_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    {parent.first_name} {parent.last_name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                    <span className="flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                                      ID: {parent.id}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Phone className="h-3 w-3 text-pink-500" />
                                <span>{formatPhone(parent.phone_number)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-gradient-to-r from-pink-500 to-rose-600 text-white border-0 px-3 py-1">
                                <Users className="h-3 w-3 mr-1" />
                                {getChildrenCount(parent.id)} ta
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(parent.created_at).toLocaleDateString('uz-UZ')}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewChildren(parent)}
                                  className="h-9 w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-300 hover:scale-110 rounded-lg"
                                  title="Bolalarni ko'rish"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenLinkModal(parent)}
                                  className="h-9 w-9 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all duration-300 hover:scale-110 rounded-lg"
                                  title="Student bog'lash"
                                >
                                  <Link2 className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-110 rounded-lg"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl rounded-lg min-w-[160px]"
                                  >
                                    <DropdownMenuItem
                                      onClick={() => handleViewChildren(parent)}
                                      className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-300"
                                    >
                                      <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                      Bolalarni koʻrish
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleOpenLinkModal(parent)}
                                      className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-300"
                                    >
                                      <Link2 className="h-4 w-4 mr-2 text-emerald-600" />
                                      Student bogʻlash
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Parent Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="bg-white dark:bg-gray-900 max-w-md rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-600 to-rose-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="h-6 w-6" />
                  Yangi Parent Qoʻshish
                </DialogTitle>
                <DialogDescription className="text-white/90 text-lg">
                  Parent maʼlumotlarini toʻldiring
                </DialogDescription>
              </DialogHeader>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddParent();
              }}
              className="p-6 space-y-4"
            >
              {addError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{addError}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="add_first_name" className="text-gray-700 dark:text-gray-300 font-medium">
                  Ism <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add_first_name"
                  value={addForm.first_name}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Ism"
                  className="border-gray-300 dark:border-gray-700 focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_last_name" className="text-gray-700 dark:text-gray-300 font-medium">
                  Familiya <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add_last_name"
                  value={addForm.last_name}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Familiya"
                  className="border-gray-300 dark:border-gray-700 focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_phone" className="text-gray-700 dark:text-gray-300 font-medium">
                  Telefon raqam <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add_phone"
                  value={addForm.phone_number}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="+998901234567"
                  className="border-gray-300 dark:border-gray-700 focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_password" className="text-gray-700 dark:text-gray-300 font-medium">
                  Parol <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add_password"
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Kamida 6 belgi"
                  className="border-gray-300 dark:border-gray-700 focus:border-pink-500 focus:ring-pink-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <DialogFooter className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError(null);
                    setAddForm({ first_name: '', last_name: '', phone_number: '', password: '' });
                  }}
                  className="flex-1 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                >
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white transition-all duration-300"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Qoʻshilmoqda...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Qoʻshish
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Children Modal */}
        <Dialog open={showChildrenModal} onOpenChange={setShowChildrenModal}>
          <DialogContent className="sm:max-w-[700px] max-h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-600 to-rose-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  {selectedParent?.first_name} {selectedParent?.last_name} ning bolalari
                </DialogTitle>
                <DialogDescription className="text-white/90 text-lg">
                  {parentChildren.length} ta student bogʻlangan
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {loadingChildren ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
                </div>
              ) : parentChildren.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-block p-4 bg-pink-50 dark:bg-pink-900/30 rounded-full mb-4">
                    <Unlink className="h-10 w-10 text-pink-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">Hali student bogʻlanmagan</p>
                  <Button
                    onClick={() => {
                      setShowChildrenModal(false);
                      if (selectedParent) handleOpenLinkModal(selectedParent);
                    }}
                    className="mt-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Student bogʻlash
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {parentChildren.map((pc) => (
                    <div
                      key={pc.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-pink-200 dark:border-pink-800">
                          <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-600 text-white text-sm">
                            {pc.student ? getInitials(pc.student.first_name, pc.student.last_name) : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {pc.student ? `${pc.student.first_name} ${pc.student.last_name}` : `Student #${pc.student_id}`}
                          </p>
                          {pc.student && (
                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {formatPhone(pc.student.phone_number)}
                              </span>
                              {pc.student.age && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {pc.student.age} yosh
                                </span>
                              )}
                              {pc.student.group && (
                                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 px-2 py-0.5 text-xs">
                                  <Building className="h-3 w-3 mr-1" />
                                  {pc.student.group.name}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleOpenUnlinkModal(
                            Number(pc.parent_id),
                            Number(pc.student_id),
                            pc.student ? `${pc.student.first_name} ${pc.student.last_name}` : `Student #${pc.student_id}`
                          )
                        }
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-300 opacity-0 group-hover:opacity-100"
                        title="Bogʻlashni uzish"
                      >
                        <Unlink className="h-4 w-4 mr-1" />
                        Uzish
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter className="p-6 border-t border-gray-200 dark:border-gray-800">
              <div className="flex gap-3 w-full">
                {!loadingChildren && parentChildren.length > 0 && selectedParent && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowChildrenModal(false);
                      handleOpenLinkModal(selectedParent);
                    }}
                    className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Student bogʻlash
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowChildrenModal(false)}
                  className="ml-auto border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                >
                  Yopish
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Link Student Modal */}
        <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
          <DialogContent className="bg-white dark:bg-gray-900 max-w-md rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Link2 className="h-6 w-6" />
                  Student bogʻlash
                </DialogTitle>
                <DialogDescription className="text-white/90 text-lg">
                  {selectedParent?.first_name} {selectedParent?.last_name} ga student bogʻlash
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-4">
              {availableStudents.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 dark:text-gray-400">Bogʻlash uchun studentlar mavjud emas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300 font-medium">Studentni tanlang</Label>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {availableStudents.map((student) => (
                      <div
                        key={student.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                          selectedStudentId === student.id
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-600'
                            : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                        onClick={() => setSelectedStudentId(student.id)}
                      >
                        <Avatar className="h-10 w-10 border-2 border-gray-200 dark:border-gray-700">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm">
                            {getInitials(student.first_name, student.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {formatPhone(student.phone_number)}
                            {student.group && (
                              <>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <Building className="h-3 w-3" />
                                {student.group.name}
                              </>
                            )}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedStudentId === student.id
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {selectedStudentId === student.id && (
                            <CheckCircle className="h-3.5 w-3.5 text-white" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <DialogFooter className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLinkModal(false);
                    setSelectedStudentId('');
                  }}
                  className="flex-1 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                >
                  Bekor qilish
                </Button>
                <Button
                  onClick={handleLinkStudent}
                  disabled={isLinking || !selectedStudentId}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition-all duration-300"
                >
                  {isLinking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Bogʻlanmoqda...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4 mr-2" />
                      Bogʻlash
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Unlink Confirm Modal */}
        <Dialog open={showUnlinkModal} onOpenChange={setShowUnlinkModal}>
          <DialogContent className="bg-white dark:bg-gray-900 max-w-md rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Unlink className="h-6 w-6" />
                  Bogʻlashni Uzish
                </DialogTitle>
                <DialogDescription className="text-white/90 text-lg">
                  Student bilan bogʻlanish uziladi
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-gray-700 dark:text-gray-300 text-lg">
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {unlinkData?.studentName}
                    </span>{' '}
                    ni uzishni tasdiqlaysizmi?
                  </p>
                </div>
              </div>
              <DialogFooter className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUnlinkModal(false);
                    setUnlinkData(null);
                  }}
                  className="flex-1 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                >
                  Bekor qilish
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleUnlinkStudent}
                  disabled={isUnlinking}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white transition-all duration-300"
                >
                  {isUnlinking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uzilmoqda...
                    </>
                  ) : (
                    <>
                      <Unlink className="h-4 w-4 mr-2" />
                      Uzish
                    </>
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
