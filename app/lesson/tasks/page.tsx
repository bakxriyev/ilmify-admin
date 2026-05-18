'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { debounce } from 'lodash';
import { tasksApi, Task } from '../../../api/tasksApi';

// Icons
import {
  Search,
  Filter,
  X,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  FileText,
  Image,
  Headphones,
  Video,
  Hash,
  File,
  Download,
  Upload,
  Loader2,
  Music,
  Camera,
  Film,
  HelpCircle,
  CheckSquare,
  Type,
  AlignLeft,
  ListChecks,
  PenTool,
  Layers,
  Clock,
  Star,
  Award,
  BarChart,
  FolderOpen,
  Copy,
  AlertTriangle,
  Paperclip,
  SortAsc,
  SortDesc,
  ExternalLink,
} from 'lucide-react';

interface FilterParams {
  search?: string;
  exercise_id?: number | string;
  type?: string;
  has_media?: 'photo' | 'audio' | 'video' | 'all' | 'none';
  sort_by: string;
  sort_order: 'ASC' | 'DESC';
  page: number;
  limit: number;
}

export default function TasksPage() {
  const router = useRouter();

  // States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Filters
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    limit: 10,
    sort_by: 'ordinary_number',
    sort_order: 'ASC',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [exerciseIdFilter, setExerciseIdFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [mediaFilter, setMediaFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    exercise_id: '',
    title: '',
    description: '',
    question_text: '',
    correct_answer: '',
    writing_q: '',
    ordinary_number: 1,
    extra_data: '',
    photo: null as File | null,
    audio: null as File | null,
    video: null as File | null,
    media: null as File | null,
  });
  const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string }>({});
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRefs = {
    photo: useRef<HTMLInputElement>(null),
    audio: useRef<HTMLInputElement>(null),
    video: useRef<HTMLInputElement>(null),
    media: useRef<HTMLInputElement>(null),
  };

  // Task types
  const taskTypes = tasksApi.getTaskTypes();
  const taskFilters = tasksApi.getTaskFilters();

  // ---------- Debounced search ----------
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setFilters((prev) => ({ ...prev, search: value || undefined, page: 1 }));
    }, 500),
    []
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // ---------- Fetch tasks ----------
  const fetchTasks = async () => {
    try {
      setTableLoading(true);
      setError(null);

      const params: any = {
        page: filters.page,
        limit: filters.limit,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      };
      
      if (filters.search) params.search = filters.search;
      if (filters.exercise_id) params.exercise_id = filters.exercise_id;

      const response = await tasksApi.getAllTasks(params.exercise_id, params);
      setTasks(response.data);
      setTotalTasks(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || 'Tasklarni yuklashda xatolik');
      console.error(err);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  // Auth check & initial load
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        const admin = localStorage.getItem('admin');
        if (!token || !admin) {
          router.push('/login');
          return;
        }
      }
      await fetchTasks();
    };
    checkAuth();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('access_token')) {
      fetchTasks();
    }
  }, [filters.page, filters.limit, filters.sort_by, filters.sort_order, filters.search, filters.exercise_id]);

  // ---------- File handlers ----------
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'photo' | 'audio' | 'video' | 'media'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(prev => ({ ...prev, [field]: 0 }));
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev[field] >= 100) {
          clearInterval(interval);
          return prev;
        }
        return { ...prev, [field]: (prev[field] || 0) + 10 };
      });
    }, 100);

    setFormData((prev) => ({ ...prev, [field]: file }));

    if (field === 'photo' || field === 'video') {
      const url = URL.createObjectURL(file);
      setPreviewUrls((prev) => ({ ...prev, [field]: url }));
    } else if (field === 'audio') {
      const url = URL.createObjectURL(file);
      setPreviewUrls((prev) => ({ ...prev, [field]: url }));
    }
  };

  const clearFile = (field: 'photo' | 'audio' | 'video' | 'media') => {
    setFormData((prev) => ({ ...prev, [field]: null }));
    setUploadProgress(prev => ({ ...prev, [field]: 0 }));
    if (previewUrls[field]) {
      URL.revokeObjectURL(previewUrls[field]);
      setPreviewUrls((prev) => ({ ...prev, [field]: '' }));
    }
    if (fileInputRefs[field].current) {
      fileInputRefs[field].current.value = '';
    }
  };

  // ---------- Create ----------
  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.exercise_id) {
        setError('Exercise ID kiritilishi shart');
        return;
      }

      const payload: any = {
        exercise_id: parseInt(formData.exercise_id),
        ordinary_number: formData.ordinary_number || 1,
      };

      if (formData.title?.trim()) payload.title = formData.title.trim();
      if (formData.description?.trim()) payload.description = formData.description.trim();
      if (formData.question_text?.trim()) payload.question_text = formData.question_text.trim();
      if (formData.correct_answer?.trim()) payload.correct_answer = formData.correct_answer.trim();
      if (formData.writing_q?.trim()) payload.writing_q = formData.writing_q.trim();
      if (formData.extra_data?.trim()) payload.extra_data = formData.extra_data.trim();

      if (formData.photo) payload.photo = formData.photo;
      if (formData.audio) payload.audio = formData.audio;
      if (formData.video) payload.video = formData.video;
      if (formData.media) payload.media = formData.media;

      const newTask = await tasksApi.createTask(payload);

      setTasks((prev) => [newTask, ...prev]);
      setTotalTasks((prev) => prev + 1);
      setShowCreateModal(false);
      resetForm();
      setSuccess('Task muvaffaqiyatli qo\'shildi!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Task qo\'shishda xatolik');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Update ----------
  const handleUpdate = async () => {
    if (!selectedTask) return;

    try {
      setLoading(true);
      setError(null);

      const payload: any = {};

      if (formData.exercise_id && parseInt(formData.exercise_id) !== selectedTask.exercise_id) {
        payload.exercise_id = parseInt(formData.exercise_id);
      }
      if (formData.title !== selectedTask.title) payload.title = formData.title || '';
      if (formData.description !== selectedTask.description) payload.description = formData.description || '';
      if (formData.question_text !== selectedTask.question_text) payload.question_text = formData.question_text || '';
      if (formData.correct_answer !== selectedTask.correct_answer) payload.correct_answer = formData.correct_answer || '';
      if (formData.writing_q !== selectedTask.writing_q) payload.writing_q = formData.writing_q || '';
      if (formData.ordinary_number !== selectedTask.ordinary_number) payload.ordinary_number = formData.ordinary_number;
      if (formData.extra_data !== selectedTask.extra_data) payload.extra_data = formData.extra_data || '';

      if (formData.photo) payload.photo = formData.photo;
      if (formData.audio) payload.audio = formData.audio;
      if (formData.video) payload.video = formData.video;
      if (formData.media) payload.media = formData.media;

      if (Object.keys(payload).length === 0) {
        setShowEditModal(false);
        resetForm();
        return;
      }

      const updatedTask = await tasksApi.updateTask(selectedTask.id, payload);

      setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? updatedTask : t)));
      setShowEditModal(false);
      resetForm();
      setSuccess('Task muvaffaqiyatli yangilandi!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Task yangilashda xatolik');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Delete ----------
  const handleDelete = async () => {
    if (!selectedTask) return;

    try {
      setLoading(true);
      setError(null);

      await tasksApi.deleteTask(selectedTask.id);

      setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
      setTotalTasks((prev) => prev - 1);
      setShowDeleteModal(false);
      setSelectedTask(null);
      setSuccess('Task muvaffaqiyatli o\'chirildi!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Task o\'chirishda xatolik');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Duplicate task ----------
  const handleDuplicate = async (task: Task, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setLoading(true);
      setError(null);

      const payload: any = {
        exercise_id: task.exercise_id,
        title: task.title ? `${task.title} (Nusxa)` : '',
        description: task.description || '',
        question_text: task.question_text || '',
        correct_answer: task.correct_answer || '',
        writing_q: task.writing_q || '',
        ordinary_number: task.ordinary_number + 1,
        extra_data: task.extra_data || '',
      };

      const newTask = await tasksApi.createTask(payload);
      setTasks((prev) => [newTask, ...prev]);
      setTotalTasks((prev) => prev + 1);
      setSuccess('Task muvaffaqiyatli nusxalandi!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Task nusxalashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Helpers ----------
  const resetForm = () => {
    setFormData({
      exercise_id: '',
      title: '',
      description: '',
      question_text: '',
      correct_answer: '',
      writing_q: '',
      ordinary_number: 1,
      extra_data: '',
      photo: null,
      audio: null,
      video: null,
      media: null,
    });
    setPreviewUrls({});
    setUploadProgress({});
    Object.values(fileInputRefs).forEach((ref) => {
      if (ref.current) ref.current.value = '';
    });
    setSelectedTask(null);
  };

  const openEditModal = (task: Task, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedTask(task);
    setFormData({
      exercise_id: task.exercise_id?.toString() || '',
      title: task.title || '',
      description: task.description || '',
      question_text: task.question_text || '',
      correct_answer: task.correct_answer || '',
      writing_q: task.writing_q || '',
      ordinary_number: task.ordinary_number,
      extra_data: task.extra_data || '',
      photo: null,
      audio: null,
      video: null,
      media: null,
    });
    setPreviewUrls({});
    setShowEditModal(true);
  };

  const openDeleteModal = (task: Task, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedTask(task);
    setShowDeleteModal(true);
  };

  // Pagination
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLimitChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: sortBy,
      sort_order: prev.sort_by === sortBy && prev.sort_order === 'ASC' ? 'DESC' : 'ASC',
      page: 1,
    }));
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setExerciseIdFilter('');
    setTypeFilter('all');
    setMediaFilter('all');
    setFilters({
      page: 1,
      limit: 10,
      sort_by: 'ordinary_number',
      sort_order: 'ASC',
    });
  };

  const applyFilters = () => {
    setFilters((prev) => ({
      ...prev,
      exercise_id: exerciseIdFilter ? parseInt(exerciseIdFilter) : undefined,
      page: 1,
    }));
    setShowFiltersModal(false);
  };

  const getMediaUrl = (path: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${path}`;
  };

  const getTaskTypeBadge = (task: Task) => {
    if (task.question_text) {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-0">
          <HelpCircle className="h-3 w-3 mr-1" />
          Savol
        </Badge>
      );
    }
    if (task.writing_q) {
      return (
        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-0">
          <PenTool className="h-3 w-3 mr-1" />
          Yozma
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-0">
        <FileText className="h-3 w-3 mr-1" />
        Task
      </Badge>
    );
  };

  // Loading state
  if (loading && tasks.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            </div>
            <p className="text-gray-600 font-medium">Tasklar yuklanmoqda...</p>
            <p className="text-gray-400 text-sm mt-1">Iltimos, kuting</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-blue-100">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Tasklar
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <span>Jami: {totalTasks} ta task</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span>Sahifa {filters.page} / {totalPages}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFiltersModal(true)}
              className="border-blue-200 hover:bg-blue-50 text-blue-700"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-200"
              onClick={() => setShowCreateModal(true)}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Task Qo'shish
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <Alert className="bg-green-50 border-green-200 animate-slideDown">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="animate-slideDown">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Qidirish (sarlavha, savol, tavsif)..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-200"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filters.limit.toString()} onValueChange={(value) => handleLimitChange(parseInt(value))}>
                <SelectTrigger className="w-32 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 ta</SelectItem>
                  <SelectItem value="10">10 ta</SelectItem>
                  <SelectItem value="20">20 ta</SelectItem>
                  <SelectItem value="50">50 ta</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={fetchTasks}
                disabled={tableLoading}
                className="border-gray-200 hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 ${tableLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(filters.exercise_id || filters.search) && (
          <div className="flex flex-wrap items-center gap-2 bg-blue-50/50 p-3 rounded-xl">
            <span className="text-sm text-gray-600">Faol filterlar:</span>
            {filters.exercise_id && (
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer" onClick={() => {
                setExerciseIdFilter('');
                setFilters(prev => ({ ...prev, exercise_id: undefined, page: 1 }));
              }}>
                Exercise ID: {filters.exercise_id}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            {filters.search && (
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer" onClick={() => {
                setSearchTerm('');
                setFilters(prev => ({ ...prev, search: undefined, page: 1 }));
              }}>
                Qidiruv: {filters.search}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-blue-600 hover:text-blue-800">
              <X className="h-3 w-3 mr-1" />
              Barchasini tozalash
            </Button>
          </div>
        )}

        {/* Tasks Table Card */}
        <Card className="border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Tasklar ro'yxati</CardTitle>
                <CardDescription>Barcha tasklar va ular haqida ma'lumot</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={filters.sort_by} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-40 border-gray-200">
                    <SelectValue placeholder="Saralash" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordinary_number">Tartib raqami</SelectItem>
                    <SelectItem value="title">Sarlavha</SelectItem>
                    <SelectItem value="exercise_id">Exercise ID</SelectItem>
                    <SelectItem value="created_at">Yaratilgan vaqt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">#</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">
                      <Button variant="ghost" size="sm" onClick={() => handleSortChange('title')} className="hover:bg-blue-100">
                        Task
                        {filters.sort_by === 'title' && (
                          filters.sort_order === 'ASC' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
                        )}
                      </Button>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">
                      <Button variant="ghost" size="sm" onClick={() => handleSortChange('exercise_id')} className="hover:bg-blue-100">
                        Exercise
                        {filters.sort_by === 'exercise_id' && (
                          filters.sort_order === 'ASC' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
                        )}
                      </Button>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">
                      <Button variant="ghost" size="sm" onClick={() => handleSortChange('ordinary_number')} className="hover:bg-blue-100">
                        Tartib
                        {filters.sort_by === 'ordinary_number' && (
                          filters.sort_order === 'ASC' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
                        )}
                      </Button>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Savol</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Media</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {tableLoading ? (
                    Array.from({ length: filters.limit }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-4 px-6"><Skeleton className="h-4 w-8" /></td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24 mt-1" /></div>
                          </div>
                        </td>
                        <td className="py-4 px-6"><Skeleton className="h-6 w-16" /></td>
                        <td className="py-4 px-6"><Skeleton className="h-6 w-12" /></td>
                        <td className="py-4 px-6"><Skeleton className="h-6 w-48" /></td>
                        <td className="py-4 px-6"><Skeleton className="h-6 w-20" /></td>
                        <td className="py-4 px-6"><div className="flex justify-end gap-1"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></td>
                      </tr>
                    ))
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <div className="p-4 bg-gray-100 rounded-full mb-4">
                            <FolderOpen className="h-12 w-12 text-gray-400" />
                          </div>
                          <p className="text-gray-600 text-lg mb-2">Tasklar topilmadi</p>
                          <p className="text-gray-400 mb-4">Yangi task qo'shish yoki filterlarni tozalang</p>
                          <Button variant="outline" onClick={clearAllFilters} className="border-gray-300">
                            <X className="h-4 w-4 mr-2" />
                            Filterlarni tozalash
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task, index) => (
                      <tr 
                        key={task.id} 
                        className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 group cursor-pointer"
                        onClick={() => router.push(`/lesson/tasks/${task.id}`)}
                      >
                        <td className="py-4 px-6 text-gray-600 font-medium">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-xs font-semibold text-gray-700 group-hover:bg-blue-200 transition-colors">
                            {(filters.page - 1) * filters.limit + index + 1}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors block">
                                {task.title || `Task #${task.id}`}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  ID: {task.id}
                                </span>
                                {getTaskTypeBadge(task)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge className="bg-blue-100 text-blue-800 border-0">
                            <Layers className="h-3 w-3 mr-1" />
                            {task.exercise_id}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200">
                            <Hash className="h-3 w-3 mr-1" />
                            {task.ordinary_number}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {task.question_text || task.writing_q || '—'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1">
                            {task.photo && (
                              <div className="relative group/media" onClick={(e) => e.stopPropagation()}>
                                <Image className="h-4 w-4 text-blue-500 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover/media:block z-50">
                                  <img src={getMediaUrl(task.photo)} alt="Preview" className="w-32 h-32 object-cover rounded-lg shadow-lg border-2 border-white" />
                                </div>
                              </div>
                            )}
                            {task.audio && (
                              <div className="relative group/media" onClick={(e) => e.stopPropagation()}>
                                <Headphones className="h-4 w-4 text-green-500 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover/media:block z-50 w-48">
                                  <audio controls src={getMediaUrl(task.audio)} className="w-full" />
                                </div>
                              </div>
                            )}
                            {task.video && (
                              <div className="relative group/media" onClick={(e) => e.stopPropagation()}>
                                <Video className="h-4 w-4 text-purple-500 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover/media:block z-50">
                                  <video src={getMediaUrl(task.video)} controls className="w-48 h-32 object-cover rounded-lg shadow-lg" />
                                </div>
                              </div>
                            )}
                            {task.media && (
                              <div className="relative group/media" onClick={(e) => e.stopPropagation()}>
                                <File className="h-4 w-4 text-gray-500 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover/media:block z-50">
                                  <div className="bg-white p-2 rounded-lg shadow-lg border">
                                    <a href={getMediaUrl(task.media)} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline flex items-center">
                                      <Download className="h-3 w-3 mr-1" />
                                      Yuklab olish
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}
                            {!task.photo && !task.audio && !task.video && !task.media && (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Link href={`/lesson/tasks/${task.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-100 text-gray-600 hover:text-blue-600"
                                title="Ko'rish"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => openEditModal(task, e)}
                              className="h-8 w-8 p-0 hover:bg-green-100 text-gray-600 hover:text-green-600"
                              title="Tahrirlash"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDuplicate(task, e)}
                              className="h-8 w-8 p-0 hover:bg-purple-100 text-gray-600 hover:text-purple-600"
                              title="Nusxalash"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => openDeleteModal(task, e)}
                              className="h-8 w-8 p-0 hover:bg-red-100 text-gray-600 hover:text-red-600"
                              title="O'chirish"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {tasks.length > 0 && totalPages > 1 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200 bg-gray-50/50">
                <div className="text-sm text-gray-600">
                  {((filters.page - 1) * filters.limit) + 1} - {Math.min(filters.page * filters.limit, totalTasks)} / {totalTasks} ta task
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className="border-gray-300 hover:bg-gray-100"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Oldingi
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (filters.page <= 3) {
                        pageNum = i + 1;
                      } else if (filters.page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = filters.page - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={filters.page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`h-8 w-8 p-0 ${
                            filters.page === pageNum
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-100'
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
                    className="border-gray-300 hover:bg-gray-100"
                  >
                    Keyingi
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Jami tasklar</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Media bilan</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tasks.filter(t => t.photo || t.audio || t.video || t.media).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Image className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Exercise lar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(tasks.map(t => t.exercise_id)).size}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Layers className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Savollar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tasks.filter(t => t.question_text || t.writing_q).length}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <HelpCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters Modal */}
      <Dialog open={showFiltersModal} onOpenChange={setShowFiltersModal}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Filterlar
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Tasklarni filterlash uchun parametrlarni tanlang
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filter_exercise" className="text-gray-700">Exercise ID</Label>
              <Input
                id="filter_exercise"
                type="number"
                placeholder="Exercise ID raqami"
                value={exerciseIdFilter}
                onChange={(e) => setExerciseIdFilter(e.target.value)}
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filter_type" className="text-gray-700">Task turi</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Barcha turlar" />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filter_media" className="text-gray-700">Media</Label>
              <Select value={mediaFilter} onValueChange={setMediaFilter}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Barchasi" />
                </SelectTrigger>
                <SelectContent>
                  {taskFilters.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFiltersModal(false)}>
              Bekor qilish
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={applyFilters}>
              Qo'llash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Yangi Task Qo'shish
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Task ma'lumotlarini kiriting
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Asosiy</TabsTrigger>
              <TabsTrigger value="content">Kontent</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create_exercise_id" className="text-gray-700">
                    Exercise ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="create_exercise_id"
                    type="number"
                    value={formData.exercise_id}
                    onChange={(e) => setFormData({ ...formData, exercise_id: e.target.value })}
                    placeholder="Exercise ID"
                    disabled={loading}
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create_ordinary_number" className="text-gray-700">Tartib raqami</Label>
                  <Input
                    id="create_ordinary_number"
                    type="number"
                    value={formData.ordinary_number}
                    onChange={(e) => setFormData({ ...formData, ordinary_number: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                    disabled={loading}
                    min="1"
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create_title" className="text-gray-700">Sarlavha</Label>
                <Input
                  id="create_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Task sarlavhasi"
                  disabled={loading}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create_description" className="text-gray-700">Tavsif</Label>
                <textarea
                  id="create_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task haqida qisqacha tavsif"
                  disabled={loading}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create_question_text" className="text-gray-700">Savol matni</Label>
                <textarea
                  id="create_question_text"
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  placeholder="Savolni kiriting"
                  disabled={loading}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create_writing_q" className="text-gray-700">Yozma savol</Label>
                <textarea
                  id="create_writing_q"
                  value={formData.writing_q}
                  onChange={(e) => setFormData({ ...formData, writing_q: e.target.value })}
                  placeholder="Yozma savol (agar mavjud bo'lsa)"
                  disabled={loading}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create_correct_answer" className="text-gray-700">To'g'ri javob</Label>
                <Input
                  id="create_correct_answer"
                  value={formData.correct_answer}
                  onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                  placeholder="To'g'ri javob"
                  disabled={loading}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create_extra_data" className="text-gray-700">Qo'shimcha ma'lumot (JSON)</Label>
                <textarea
                  id="create_extra_data"
                  value={formData.extra_data}
                  onChange={(e) => setFormData({ ...formData, extra_data: e.target.value })}
                  placeholder='{"key": "value"}'
                  disabled={loading}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 py-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 flex items-center gap-2">
                      <Camera className="h-4 w-4 text-blue-500" />
                      Rasm
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.photo.current?.click()}
                        className="w-full border-gray-300 hover:bg-blue-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Rasm yuklash
                      </Button>
                      {formData.photo && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearFile('photo')}
                          className="h-8 w-8 p-0 hover:bg-red-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRefs.photo}
                      onChange={(e) => handleFileChange(e, 'photo')}
                      accept="image/*"
                      className="hidden"
                    />
                    {previewUrls.photo && (
                      <div className="mt-2">
                        <img src={previewUrls.photo} alt="Preview" className="w-full h-32 object-cover rounded-lg border" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 flex items-center gap-2">
                      <Music className="h-4 w-4 text-green-500" />
                      Audio
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.audio.current?.click()}
                        className="w-full border-gray-300 hover:bg-green-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Audio yuklash
                      </Button>
                      {formData.audio && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearFile('audio')}
                          className="h-8 w-8 p-0 hover:bg-red-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRefs.audio}
                      onChange={(e) => handleFileChange(e, 'audio')}
                      accept="audio/*"
                      className="hidden"
                    />
                    {previewUrls.audio && (
                      <div className="mt-2">
                        <audio controls src={previewUrls.audio} className="w-full" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 flex items-center gap-2">
                      <Film className="h-4 w-4 text-purple-500" />
                      Video
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.video.current?.click()}
                        className="w-full border-gray-300 hover:bg-purple-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Video yuklash
                      </Button>
                      {formData.video && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearFile('video')}
                          className="h-8 w-8 p-0 hover:bg-red-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRefs.video}
                      onChange={(e) => handleFileChange(e, 'video')}
                      accept="video/*"
                      className="hidden"
                    />
                    {previewUrls.video && (
                      <div className="mt-2">
                        <video controls src={previewUrls.video} className="w-full h-32 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 flex items-center gap-2">
                      <File className="h-4 w-4 text-gray-500" />
                      Media
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.media.current?.click()}
                        className="w-full border-gray-300 hover:bg-gray-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Fayl yuklash
                      </Button>
                      {formData.media && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearFile('media')}
                          className="h-8 w-8 p-0 hover:bg-red-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRefs.media}
                      onChange={(e) => handleFileChange(e, 'media')}
                      accept="*/*"
                      className="hidden"
                    />
                    {formData.media && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg border">
                        <span className="text-sm text-gray-600">{formData.media.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={loading}>
              Bekor qilish
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600" onClick={handleCreate} disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Qo'shilmoqda...</> : 'Qo\'shish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Edit className="h-5 w-5 text-green-600" />
              Taskni Tahrirlash
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedTask?.title || `Task #${selectedTask?.id}`} ma'lumotlarini yangilang
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Asosiy</TabsTrigger>
              <TabsTrigger value="content">Kontent</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_exercise_id" className="text-gray-700">Exercise ID</Label>
                  <Input
                    id="edit_exercise_id"
                    type="number"
                    value={formData.exercise_id}
                    onChange={(e) => setFormData({ ...formData, exercise_id: e.target.value })}
                    disabled={loading}
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_ordinary_number" className="text-gray-700">Tartib raqami</Label>
                  <Input
                    id="edit_ordinary_number"
                    type="number"
                    value={formData.ordinary_number}
                    onChange={(e) => setFormData({ ...formData, ordinary_number: parseInt(e.target.value) || 1 })}
                    disabled={loading}
                    min="1"
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_title" className="text-gray-700">Sarlavha</Label>
                <Input
                  id="edit_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={loading}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_description" className="text-gray-700">Tavsif</Label>
                <textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_question_text" className="text-gray-700">Savol matni</Label>
                <textarea
                  id="edit_question_text"
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  disabled={loading}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_writing_q" className="text-gray-700">Yozma savol</Label>
                <textarea
                  id="edit_writing_q"
                  value={formData.writing_q}
                  onChange={(e) => setFormData({ ...formData, writing_q: e.target.value })}
                  disabled={loading}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_correct_answer" className="text-gray-700">To'g'ri javob</Label>
                <Input
                  id="edit_correct_answer"
                  value={formData.correct_answer}
                  onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                  disabled={loading}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_extra_data" className="text-gray-700">Qo'shimcha ma'lumot</Label>
                <textarea
                  id="edit_extra_data"
                  value={formData.extra_data}
                  onChange={(e) => setFormData({ ...formData, extra_data: e.target.value })}
                  placeholder='{"key": "value"}'
                  disabled={loading}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 py-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 flex items-center gap-2">
                      <Camera className="h-4 w-4 text-blue-500" />
                      Rasm
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.photo.current?.click()}
                        className="w-full border-gray-300 hover:bg-blue-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Yangi rasm
                      </Button>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRefs.photo}
                      onChange={(e) => handleFileChange(e, 'photo')}
                      accept="image/*"
                      className="hidden"
                    />
                    {selectedTask?.photo && !previewUrls.photo && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Joriy rasm:</p>
                        <img src={getMediaUrl(selectedTask.photo)} alt="Current" className="w-full h-32 object-cover rounded-lg border" />
                      </div>
                    )}
                    {previewUrls.photo && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Yangi rasm:</p>
                        <img src={previewUrls.photo} alt="Preview" className="w-full h-32 object-cover rounded-lg border" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 flex items-center gap-2">
                      <Music className="h-4 w-4 text-green-500" />
                      Audio
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.audio.current?.click()}
                        className="w-full border-gray-300 hover:bg-green-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Yangi audio
                      </Button>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRefs.audio}
                      onChange={(e) => handleFileChange(e, 'audio')}
                      accept="audio/*"
                      className="hidden"
                    />
                    {selectedTask?.audio && !previewUrls.audio && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Joriy audio:</p>
                        <audio controls src={getMediaUrl(selectedTask.audio)} className="w-full" />
                      </div>
                    )}
                    {previewUrls.audio && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Yangi audio:</p>
                        <audio controls src={previewUrls.audio} className="w-full" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 flex items-center gap-2">
                      <Film className="h-4 w-4 text-purple-500" />
                      Video
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.video.current?.click()}
                        className="w-full border-gray-300 hover:bg-purple-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Yangi video
                      </Button>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRefs.video}
                      onChange={(e) => handleFileChange(e, 'video')}
                      accept="video/*"
                      className="hidden"
                    />
                    {selectedTask?.video && !previewUrls.video && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Joriy video:</p>
                        <video controls src={getMediaUrl(selectedTask.video)} className="w-full h-32 object-cover rounded-lg" />
                      </div>
                    )}
                    {previewUrls.video && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Yangi video:</p>
                        <video controls src={previewUrls.video} className="w-full h-32 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 flex items-center gap-2">
                      <File className="h-4 w-4 text-gray-500" />
                      Media
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.media.current?.click()}
                        className="w-full border-gray-300 hover:bg-gray-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Yangi fayl
                      </Button>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRefs.media}
                      onChange={(e) => handleFileChange(e, 'media')}
                      accept="*/*"
                      className="hidden"
                    />
                    {selectedTask?.media && !formData.media && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Joriy fayl:</p>
                        <a href={getMediaUrl(selectedTask.media)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Yuklab olish
                        </a>
                      </div>
                    )}
                    {formData.media && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Yangi fayl:</p>
                        <div className="p-2 bg-gray-50 rounded-lg border">
                          {formData.media.name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={loading}>
              Bekor qilish
            </Button>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600" onClick={handleUpdate} disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Yangilanmoqda...</> : 'Yangilash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Taskni O'chirish
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              <span className="text-red-600 font-semibold block mb-2">Bu amalni bekor qilib bo'lmaydi!</span>
              Rostdan ham <strong className="text-gray-900">
                {selectedTask?.title || `Task #${selectedTask?.id}`}
              </strong> ni o'chirmoqchimisiz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={loading}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />O'chirilmoqda...</> : 'O\'chirish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}