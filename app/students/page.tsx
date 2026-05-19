'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import {
  Users, Plus, Search, RefreshCw, ChevronLeft, ChevronRight,
  Eye, Edit, Trash2, MoreVertical, Upload, X, AlertCircle, CheckCircle,
  Phone, Mail, Calendar, Building, Loader2, Filter, Power,
  UserPlus, Download, Grid, List, Star, TrendingUp, Activity,
  Award, Clock, MapPin, Globe, BookOpen, MessageSquare, Bell,
  Settings, BarChart3, PieChart, Zap, Heart, Shield, Target,
  ChevronDown, ChevronUp, Maximize2, Minimize2, KeyRound
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
import * as XLSX from 'xlsx';
import { studentsApi, type Student, type GetAllStudentsParams } from '../../api/studentApi';
import toast from 'react-hot-toast';

interface FilterParams {
  page: number;
  limit: number;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  group_id?: number | 'notnull' | 0;
  min_age?: number;
  max_age?: number;
}

export default function StudentsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // States
  const [students, setStudents] = useState<Student[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withGroup: 0,
    withoutGroup: 0,
    averageAge: 0,
  });

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Activate modal
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [studentToActivate, setStudentToActivate] = useState<Student | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  // Bulk import
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState<Array<{
    first_name: string;
    last_name: string;
    age: number;
    email: string;
    phone_number: string;
    password: string;
  }>>([]);
  const [isBulkCreating, setIsBulkCreating] = useState(false);

  // Filters
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    limit: 10,
    sort_by: 'id',
    sort_order: 'desc',
  });
  const [ageFilter, setAgeFilter] = useState<{ min?: number; max?: number }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(true);

  // Debounced search - MUHIM: searchTerm o'zgarishini kuzatadi
  useEffect(() => {
    const handler = setTimeout(() => {
      console.log('Searching for:', searchTerm); // Debug uchun
      
      setFilters(prev => ({
        ...prev,
        page: 1,
        first_name: searchTerm || undefined,
        last_name: searchTerm || undefined,
        email: searchTerm || undefined,
        phone_number: searchTerm || undefined,
      }));
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Fetch students - MUHIM: filters o'zgarganda ishlaydi
  const fetchStudents = useCallback(async () => {
    try {
      setTableLoading(true);
      console.log('Fetching with filters:', filters); // Debug uchun

      const params: GetAllStudentsParams = {
        page: filters.page,
        limit: filters.limit,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      };

      // Search params
      if (filters.first_name) params.first_name = filters.first_name;
      if (filters.last_name) params.last_name = filters.last_name;
      if (filters.email) params.email = filters.email;
      if (filters.phone_number) params.phone_number = filters.phone_number;

      // Age filter
      if (ageFilter.min) params.min_age = ageFilter.min;
      if (ageFilter.max) params.max_age = ageFilter.max;

      // Group filter
      if (activeTab === 'without-group') {
        params.group_id = 0;
      } else if (activeTab === 'with-group') {
        params.group_id = 'notnull';
      }

      const response = await studentsApi.getAll(params);
      console.log('Response:', response); // Debug uchun
      
      setStudents(response.data ?? []);
      setTotalStudents(response.pagination?.total ?? 0);
      setTotalPages(response.pagination?.total_pages ?? 1);
      
      // Calculate stats
      const activeCount = response.data?.filter((s: Student) => s.isActive).length || 0;
      const withGroupCount = response.data?.filter((s: Student) => s.group).length || 0;
      const avgAge = response.data?.reduce((acc: number, s: Student) => acc + (s.age || 0), 0) / (response.data?.length || 1);
      
      setStats({
        total: response.pagination?.total || 0,
        active: activeCount,
        inactive: (response.data?.length || 0) - activeCount,
        withGroup: withGroupCount,
        withoutGroup: (response.data?.length || 0) - withGroupCount,
        averageAge: Math.round(avgAge) || 0,
      });
    } catch (err: any) {
      console.error('Fetch error:', err);
      toast.error(err.message || 'Studentlarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [filters, ageFilter, activeTab]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Delete
  const handleDelete = async () => {
    if (!studentToDelete) return;
    try {
      setIsDeleting(true);
      await studentsApi.delete(studentToDelete.id);
      toast.success(`Student ${studentToDelete.first_name} ${studentToDelete.last_name} o'chirildi`);
      fetchStudents();
      setShowDeleteModal(false);
      setStudentToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Oʻchirishda xatolik');
    } finally {
      setIsDeleting(false);
    }
  };

  // Activate
  const handleActivate = async () => {
    if (!studentToActivate) return;
    try {
      setIsActivating(true);
      await studentsApi.update(studentToActivate.id, { isActive: true });
      toast.success(`${studentToActivate.first_name} ${studentToActivate.last_name} faollashtirildi`);
      fetchStudents();
      setShowActivateModal(false);
      setStudentToActivate(null);
    } catch (err: any) {
      toast.error(err.message || 'Faollashtirishda xatolik');
    } finally {
      setIsActivating(false);
    }
  };

  // Bulk import handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const formattedData = jsonData
          .map((row: any) => ({
            first_name: row.first_name || row.firstName || row['First Name'] || '',
            last_name: row.last_name || row.lastName || row['Last Name'] || '',
            age: parseInt(row.age) || parseInt(row.Age) || 0,
            email: row.email || row.Email || '',
            phone_number: row.phone_number || row.phone || row.Phone || '',
            password: row.password || '123456',
          }))
          .filter((row) => row.first_name && row.last_name && row.phone_number);

        setBulkData(formattedData);
        setShowBulkModal(true);
      } catch (err) {
        toast.error('Excel faylni oʻqishda xatolik');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkCreate = async () => {
    if (bulkData.length === 0) return;
    try {
      setIsBulkCreating(true);
      const response = await studentsApi.bulkCreate({ students: bulkData });
      setShowBulkModal(false);
      setBulkData([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchStudents();
      toast.success(`${response.created} ta student qoʻshildi, ${response.errors.length} ta xatolik.`);
    } catch (err: any) {
      toast.error(err.message || 'Import qilishda xatolik');
    } finally {
      setIsBulkCreating(false);
    }
  };

  // Pagination
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: sortBy,
      sort_order: prev.sort_by === sortBy && prev.sort_order === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const applyAgeFilter = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const clearAgeFilter = () => {
    setAgeFilter({});
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setAgeFilter({});
    setActiveTab('all');
    setFilters({
      page: 1,
      limit: 10,
      sort_by: 'id',
      sort_order: 'desc',
    });
    // Search inputni ham tozalash
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  };

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('998')) {
      return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    }
    return phone;
  };

  // Row click handler
  const handleRowClick = (studentId: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[role="menuitem"]') || target.closest('.dropdown-trigger')) {
      return;
    }
    router.push(`/students/${studentId}`);
  };

  if (loading && students.length === 0) {
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
                  <Users className="h-5 w-5 text-blue-600" />
                  Studentlar
                  <Badge className="bg-blue-100 text-blue-700 text-xs ml-1">{stats.total} ta</Badge>
                </h1>
              </div>
              <div className="flex gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls" className="hidden" />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs">
                  <Upload className="h-3.5 w-3.5 mr-1" /> Excel Import
                </Button>
                <Button size="sm" onClick={() => router.push('/students/new')} className="text-xs">
                  <UserPlus className="h-3.5 w-3.5 mr-1" /> Yangi Student
                </Button>
              </div>
            </div>

            {/* Compact Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded"><Activity className="h-4 w-4 text-green-600" /></div>
                <div><p className="text-xs text-gray-500">Faol</p><p className="text-sm font-bold text-gray-900">{stats.active}</p></div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 flex items-center gap-2">
                <div className="p-1.5 bg-red-100 rounded"><Power className="h-4 w-4 text-red-600" /></div>
                <div><p className="text-xs text-gray-500">Nofaol</p><p className="text-sm font-bold text-gray-900">{stats.inactive}</p></div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded"><Building className="h-4 w-4 text-blue-600" /></div>
                <div><p className="text-xs text-gray-500">Guruhda</p><p className="text-sm font-bold text-gray-900">{stats.withGroup}</p></div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded"><Calendar className="h-4 w-4 text-purple-600" /></div>
                <div><p className="text-xs text-gray-500">O'rt. yosh</p><p className="text-sm font-bold text-gray-900">{stats.averageAge}</p></div>
              </div>
            </div>

            {/* Filters Section */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm font-medium text-gray-700">Filterlar</CardTitle>
                    <CardDescription className="text-gray-500">
                      Studentlarni ism, familiya, email yoki telefon boʻyicha qidirish
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showFilters ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Tozalash
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {showFilters && (
                <CardContent className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                  <div className="space-y-4">
                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="bg-gray-100 dark:bg-gray-800 p-1">
                        <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 transition-all duration-300">
                          Hammasi
                        </TabsTrigger>
                        <TabsTrigger value="with-group" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 transition-all duration-300">
                          Guruhda
                        </TabsTrigger>
                        <TabsTrigger value="without-group" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 transition-all duration-300">
                          Guruhsiz
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Search - MUHIM: ref va value to'g'ri bog'langan */}
                      <div className="col-span-2">
                        <Label htmlFor="search" className="text-gray-700 dark:text-gray-300">Qidirish</Label>
                        <div className="relative mt-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="search"
                            ref={searchInputRef}
                            placeholder="Ism, familiya, email yoki telefon..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all duration-300 w-full"
                          />
                        </div>
                      </div>

                      {/* Age filter */}
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Yosh oraligʻi</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={ageFilter.min || ''}
                            onChange={(e) =>
                              setAgeFilter((prev) => ({
                                ...prev,
                                min: e.target.value ? parseInt(e.target.value) : undefined,
                              }))
                            }
                            className="w-20 border-gray-300 dark:border-gray-700 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all duration-300"
                            min="1"
                            max="100"
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={ageFilter.max || ''}
                            onChange={(e) =>
                              setAgeFilter((prev) => ({
                                ...prev,
                                max: e.target.value ? parseInt(e.target.value) : undefined,
                              }))
                            }
                            className="w-20 border-gray-300 dark:border-gray-700 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all duration-300"
                            min="1"
                            max="100"
                          />
                          <Button 
                            size="sm" 
                            onClick={applyAgeFilter} 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white transition-all duration-300 hover:scale-105"
                          >
                            <Filter className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={clearAgeFilter} 
                            className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all duration-300 hover:scale-105"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Items per page */}
                      <div>
                        <Label htmlFor="limit" className="text-gray-700 dark:text-gray-300">Sahifada</Label>
                        <Select
                          value={filters.limit.toString()}
                          onValueChange={(value) => handleLimitChange(parseInt(value))}
                        >
                          <SelectTrigger className="mt-1 border-gray-300 dark:border-gray-700 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all duration-300 w-full">
                            <SelectValue placeholder="Saralash" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Students Table Card */}
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl overflow-hidden w-full">
              <CardHeader className="pb-3 border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-800 dark:text-white">
                        Studentlar roʻyxati
                      </CardTitle>
                      <CardDescription className="text-gray-500 dark:text-gray-400">
                        {students.length} / {totalStudents} ta student koʻrsatilmoqda (Sahifa {filters.page} / {totalPages})
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* View mode toggle */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={`h-8 w-8 p-0 transition-all duration-300 ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={`h-8 w-8 p-0 transition-all duration-300 ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchStudents}
                      disabled={tableLoading}
                      className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all duration-300 hover:scale-105"
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${tableLoading ? 'animate-spin' : ''}`} />
                      Yangilash
                    </Button>
                    
                    <Select value={filters.sort_by} onValueChange={handleSortChange}>
                      <SelectTrigger className="w-40 border-gray-300 dark:border-gray-700 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all duration-300">
                        <SelectValue placeholder="Saralash" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
                        <SelectItem value="id">Yangi (ID)</SelectItem>
                        <SelectItem value="first_name">Ism</SelectItem>
                        <SelectItem value="last_name">Familiya</SelectItem>
                        <SelectItem value="age">Yosh</SelectItem>
                        <SelectItem value="group_id">Guruh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                {tableLoading ? (
                  <div className="flex flex-col items-center justify-center py-24">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                      <div className="absolute inset-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Studentlar yuklanmoqda...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-24 px-4">
                    <div className="inline-block p-6 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full mb-6">
                      <Users className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Studentlar topilmadi</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
                      {searchTerm ? `"${searchTerm}" bo'yicha hech narsa topilmadi` : 'Yangi student qoʻshish bilan boshlang'}
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={clearAllFilters}
                        variant="outline"
                        className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                      >
                        Filterlarni tozalash
                      </Button>
                      <Button
                        onClick={() => router.push('/students/new')}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 hover:scale-105"
                      >
                        <UserPlus className="h-5 w-5 mr-2" />
                        Yangi Student
                      </Button>
                    </div>
                  </div>
                ) : viewMode === 'list' ? (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden xl:block overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                          <TableRow>
                            <TableHead className="w-16 text-gray-700 dark:text-gray-300">#</TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300">Student</TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300">Aloqa</TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300">Parol</TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300">Yosh</TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300">Guruh</TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300">Holat</TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300 text-right">Amallar</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student, index) => (
                            <TableRow
                              key={student.id}
                              className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300 cursor-pointer group"
                              onClick={(e) => handleRowClick(student.id, e)}
                            >
                              <TableCell className="font-medium text-gray-800 dark:text-gray-200">
                                {(filters.page - 1) * filters.limit + index + 1}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-4">
                                  <div className="relative">
                                    <Avatar className="h-12 w-12 border-2 border-blue-200 dark:border-blue-800">
                                      <AvatarImage src={student.photo ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/students/${student.photo}` : ''} />
                                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                        {student.first_name[0]}{student.last_name[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${student.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                      {student.first_name} {student.last_name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                      <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                        ID: {student.id}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Phone className="h-3 w-3 text-blue-500" />
                                    <span>{formatPhone(student.phone_number)}</span>
                                  </div>
                                  {student.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                      <Mail className="h-3 w-3 text-purple-500" />
                                      <span className="truncate max-w-[200px]">{student.email}</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <KeyRound className="h-3 w-3 text-amber-500" />
                                  <span className="font-mono text-xs">{student.password || '-'}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-3 py-1">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {student.age} yosh
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {student.group ? (
                                    <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 px-3 py-1">
                                      <Building className="h-3 w-3 mr-1" />
                                      {student.group.name}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                                      Guruhsiz
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    student.isActive
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-3 py-1'
                                      : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 px-3 py-1'
                                  }
                                >
                                  {student.isActive ? 'Faol' : 'Nofaol'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-2">
                                  {!student.isActive && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setStudentToActivate(student);
                                        setShowActivateModal(true);
                                      }}
                                      className="h-9 w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-300 hover:scale-110 rounded-lg"
                                      title="Faollashtirish"
                                    >
                                      <Power className="h-4 w-4" />
                                    </Button>
                                  )}
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
                                        onClick={() => router.push(`/students/${student.id}`)}
                                        className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-300"
                                      >
                                        <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                        Koʻrish
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => router.push(`/students/${student.id}/edit`)}
                                        className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-300"
                                      >
                                        <Edit className="h-4 w-4 mr-2 text-emerald-600" />
                                        Tahrirlash
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setStudentToDelete(student);
                                          setShowDeleteModal(true);
                                        }}
                                        className="cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-300"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Oʻchirish
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

                    {/* Mobile Cards */}
                    <div className="xl:hidden space-y-4 p-4">
                      {students.map((student) => (
                        <div
                          key={student.id}
                          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-blue-300 dark:hover:border-blue-700 group"
                          onClick={(e) => handleRowClick(student.id, e)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar className="h-14 w-14 border-2 border-blue-200 dark:border-blue-800">
                                  <AvatarImage src={student.photo ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/students/${student.photo}` : ''} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg">
                                    {student.first_name[0]}{student.last_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${student.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                  {student.first_name} {student.last_name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                  <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                    ID: {student.id}
                                  </span>
                                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {student.age} yosh
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                  <DropdownMenuItem onClick={() => router.push(`/students/${student.id}`)}>
                                    <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                    Koʻrish
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => router.push(`/students/${student.id}/edit`)}>
                                    <Edit className="h-4 w-4 mr-2 text-emerald-600" />
                                    Tahrirlash
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setStudentToDelete(student);
                                      setShowDeleteModal(true);
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Oʻchirish
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                              <Phone className="h-4 w-4 text-blue-500" />
                              <span className="text-gray-700 dark:text-gray-300">{formatPhone(student.phone_number)}</span>
                            </div>
                            
                            {student.email && (
                              <div className="flex items-center gap-3 text-sm">
                                <Mail className="h-4 w-4 text-purple-500" />
                                <span className="text-gray-700 dark:text-gray-300 truncate">{student.email}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-3 text-sm">
                              <KeyRound className="h-4 w-4 text-amber-500" />
                              <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">{student.password || '-'}</span>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                              <div className="flex items-center gap-2">
                                {student.group ? (
                                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 px-3 py-1">
                                    <Building className="h-3 w-3 mr-1" />
                                    {student.group.name}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-gray-300 dark:border-gray-700">
                                    Guruhsiz
                                  </Badge>
                                )}
                                
                                <Badge
                                  className={
                                    student.isActive
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-3 py-1'
                                      : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 px-3 py-1'
                                  }
                                >
                                  {student.isActive ? 'Faol' : 'Nofaol'}
                                </Badge>
                              </div>
                              
                              {!student.isActive && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStudentToActivate(student);
                                    setShowActivateModal(true);
                                  }}
                                  className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 h-auto transition-all duration-300 hover:scale-105"
                                >
                                  <Power className="h-3 w-3 mr-1" />
                                  Faollashtirish
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 px-6 border-t border-gray-200 dark:border-gray-800">
                        <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-lg">
                          Sahifa {filters.page} / {totalPages} • Jami {totalStudents} ta student
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(filters.page - 1)}
                            disabled={filters.page === 1}
                            className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all duration-300 hover:scale-105"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Oldingi
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) pageNum = i + 1;
                              else if (filters.page <= 3) pageNum = i + 1;
                              else if (filters.page >= totalPages - 2)
                                pageNum = totalPages - 4 + i;
                              else pageNum = filters.page - 2 + i;
                              return (
                                <Button
                                  key={pageNum}
                                  variant={filters.page === pageNum ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`h-9 w-9 p-0 transition-all duration-300 hover:scale-105 ${
                                    filters.page === pageNum
                                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                                      : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                  }`}
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(filters.page + 1)}
                            disabled={filters.page === totalPages}
                            className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all duration-300 hover:scale-105"
                          >
                            Keyingi
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Grid View
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-300 dark:hover:border-blue-700 group"
                        onClick={(e) => handleRowClick(student.id, e)}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="relative mb-4">
                            <Avatar className="h-24 w-24 border-4 border-blue-200 dark:border-blue-800 group-hover:border-blue-400 transition-all duration-300">
                              <AvatarImage src={student.photo ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/students/${student.photo}` : ''} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl">
                                {student.first_name[0]}{student.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 ${student.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          </div>
                          
                          <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-1">
                            {student.first_name} {student.last_name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            ID: {student.id} • {student.age} yosh
                          </p>
                          
                          <div className="w-full space-y-2 mb-4">
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="h-4 w-4 text-blue-500" />
                              <span>{formatPhone(student.phone_number)}</span>
                            </div>
                            {student.email && (
                              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Mail className="h-4 w-4 text-purple-500" />
                                <span className="truncate max-w-[200px]">{student.email}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <KeyRound className="h-4 w-4 text-amber-500" />
                              <span className="font-mono text-xs">{student.password || '-'}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-4">
                            {student.group ? (
                              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 px-3 py-1">
                                <Building className="h-3 w-3 mr-1" />
                                {student.group.name}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-gray-300 dark:border-gray-700">
                                Guruhsiz
                              </Badge>
                            )}
                            
                            <Badge
                              className={
                                student.isActive
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-3 py-1'
                                  : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 px-3 py-1'
                              }
                            >
                              {student.isActive ? 'Faol' : 'Nofaol'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                            {!student.isActive && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setStudentToActivate(student);
                                  setShowActivateModal(true);
                                }}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white transition-all duration-300 hover:scale-105"
                              >
                                <Power className="h-4 w-4 mr-1" />
                                Faollashtirish
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/students/${student.id}`)}
                              className="flex-1 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ko'rish
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="px-2 border-gray-300 dark:border-gray-700">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/students/${student.id}/edit`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Tahrirlash
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setStudentToDelete(student);
                                    setShowDeleteModal(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Oʻchirish
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="bg-white dark:bg-gray-900 max-w-md rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Trash2 className="h-6 w-6" />
                  Studentni Oʻchirish
                </DialogTitle>
                <DialogDescription className="text-white/90 text-lg">
                  Bu amalni ortga qaytarib bo'lmaydi
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
                      {studentToDelete?.first_name} {studentToDelete?.last_name}
                    </span>{' '}
                    ni oʻchirishni tasdiqlaysizmi?
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    ID: {studentToDelete?.id} • {studentToDelete?.age} yosh
                  </p>
                </div>
              </div>
              <DialogFooter className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteModal(false)} 
                  className="flex-1 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                >
                  Bekor qilish
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white transition-all duration-300"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Oʻchirilmoqda...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Oʻchirish
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Activate Confirmation Modal */}
        <Dialog open={showActivateModal} onOpenChange={setShowActivateModal}>
          <DialogContent className="bg-white dark:bg-gray-900 max-w-md rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Power className="h-6 w-6" />
                  Studentni Faollashtirish
                </DialogTitle>
                <DialogDescription className="text-white/90 text-lg">
                  Student tizimga qayta kirishi mumkin bo'ladi
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-gray-700 dark:text-gray-300 text-lg">
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {studentToActivate?.first_name} {studentToActivate?.last_name}
                    </span>{' '}
                    ni faollashtirishni tasdiqlaysizmi?
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    ID: {studentToActivate?.id} • {studentToActivate?.age} yosh
                  </p>
                </div>
              </div>
              <DialogFooter className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowActivateModal(false)} 
                  className="flex-1 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                >
                  Bekor qilish
                </Button>
                <Button
                  onClick={handleActivate}
                  disabled={isActivating}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all duration-300"
                >
                  {isActivating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Faollashtirilmoqda...
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-2" />
                      Faollashtirish
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Import Modal */}
        <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
          <DialogContent className="sm:max-w-[900px] max-h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Upload className="h-6 w-6" />
                  Excel dan Import
                </DialogTitle>
                <DialogDescription className="text-white/90 text-lg">
                  {bulkData.length} ta student topildi. Import qilishdan oldin tekshirib oling.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 overflow-x-auto">
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">#</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Ism</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Familiya</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Yosh</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Telefon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkData.slice(0, 8).map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300">
                        <td className="py-2 px-4 text-gray-800 dark:text-gray-200">{index + 1}</td>
                        <td className="py-2 px-4 text-gray-800 dark:text-gray-200">{item.first_name}</td>
                        <td className="py-2 px-4 text-gray-800 dark:text-gray-200">{item.last_name}</td>
                        <td className="py-2 px-4 text-gray-800 dark:text-gray-200">{item.age}</td>
                        <td className="py-2 px-4 text-gray-800 dark:text-gray-200">{item.email}</td>
                        <td className="py-2 px-4 text-gray-800 dark:text-gray-200">{item.phone_number}</td>
                      </tr>
                    ))}
                    {bulkData.length > 8 && (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-gray-500 dark:text-gray-400">
                          va yana {bulkData.length - 8} ta ...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <DialogFooter className="p-6 border-t border-gray-200 dark:border-gray-800">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkData([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={isBulkCreating}
                className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
              >
                Bekor qilish
              </Button>
              <Button
                onClick={handleBulkCreate}
                disabled={isBulkCreating || bulkData.length === 0}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white transition-all duration-300"
              >
                {isBulkCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Import qilinmoqda...
                  </>
                ) : (
                  `${bulkData.length} ta Studentni Import Qilish`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}