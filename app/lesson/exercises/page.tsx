'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  exercisesApi,
  Exercise,
  ExerciseFilter,
  CreateExerciseRequest,
  UpdateExerciseRequest,
} from '@/api/exercisesApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Clock,
  Hash,
  Filter,
  X,
  FileText,
  Link2,
  Mic,
  Video,
  Image as ImageIcon,
} from 'lucide-react';
import Layout from '../../../components/Layout';

export default function ExercisesPage() {
  const router = useRouter();

  // -------------------- States --------------------
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [showFilters, setShowFilters] = useState(true);

  const [filters, setFilters] = useState<ExerciseFilter>({
    page: 1,
    limit: 10,
    search: '',
    type: undefined,
    unit_id: undefined,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Form
  const [formData, setFormData] = useState<CreateExerciseRequest>({
    unit_id: 1,
    name: '',
    description: '',
    number: 1,
    type: 'reading',
    qText: '',
    audio_url: '',
    video_url: '',
    image_url: '',
  });

  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const exerciseTypes = exercisesApi.getExerciseTypes();

  // -------------------- Effects --------------------
  useEffect(() => {
    setMounted(true);
    loadExercises();
    return () => setMounted(false);
  }, [filters.page, filters.limit, filters.type, filters.search, filters.unit_id]);

  // -------------------- API Calls --------------------
  const loadExercises = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const cleanFilters: ExerciseFilter = {
        page: filters.page,
        limit: filters.limit,
      };

      if (filters.search?.trim()) cleanFilters.search = filters.search.trim();
      if (filters.type && filters.type !== 'all') cleanFilters.type = filters.type;
      if (filters.unit_id) cleanFilters.unit_id = filters.unit_id;

      const response = await exercisesApi.getAllExercises(cleanFilters);
      setExercises(response.data);
      setPagination({
        total: response.pagination.total,
        page: response.pagination.page,
        limit: response.pagination.limit,
        totalPages: response.pagination.total_pages,
      });
    } catch (err: any) {
      console.error('Failed to load exercises:', err);
      setError(err.message || 'Failed to load exercises');
      // Mock data
      const mockExercises: Exercise[] = [
        {
          id: '1',
          unit_id: '1',
          name: 'Reading Exercise 1',
          description: 'Basic reading comprehension exercise',
          number: 1,
          type: 'reading',
          qText: 'Read the text and answer the questions',
          tasks_count: 7,
          results_count: 0,
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
        },
      ];
      setExercises(mockExercises);
      setPagination({
        total: mockExercises.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // -------------------- Helpers --------------------
  const getTypeInfo = (type: string) => {
    const typeInfo = exerciseTypes.find((t) => t.value === type);
    return {
      color: typeInfo?.color || 'gray',
      label: typeInfo?.label || type,
      icon: typeInfo?.icon || 'QuestionMarkCircleIcon',
    };
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100/80 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50',
      green:
        'bg-green-100/80 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800/50',
      yellow:
        'bg-yellow-100/80 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800/50',
      purple:
        'bg-purple-100/80 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50',
      red: 'bg-red-100/80 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/50',
      indigo:
        'bg-indigo-100/80 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50',
      gray: 'bg-gray-100/80 text-gray-700 border-gray-200 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-700/50',
    };
    return colorMap[color] || colorMap.gray;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  // -------------------- Filter Handlers --------------------
  const handleFilterChange = (key: keyof ExerciseFilter, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' && key !== 'limit' ? { page: 1 } : {}),
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      type: undefined,
      unit_id: undefined,
    });
  };

  // -------------------- CRUD Handlers --------------------
  const handleCreateExercise = async () => {
    try {
      setFormLoading(true);
      setFormError(null);

      if (!formData.name.trim()) {
        setFormError('Exercise name is required');
        return;
      }
      if (!formData.description.trim()) {
        setFormError('Description is required');
        return;
      }
      if (!formData.qText.trim()) {
        setFormError('Question text is required');
        return;
      }
      if (formData.unit_id <= 0) {
        setFormError('Unit ID must be greater than 0');
        return;
      }
      if (formData.number <= 0) {
        setFormError('Exercise number must be greater than 0');
        return;
      }

      await exercisesApi.createExercise(formData);

      setFormData({
        unit_id: 1,
        name: '',
        description: '',
        number: 1,
        type: 'reading',
        qText: '',
        audio_url: '',
        video_url: '',
        image_url: '',
      });
      setShowCreateModal(false);
      loadExercises();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create exercise');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditExercise = async () => {
    if (!editingExercise) return;

    try {
      setFormLoading(true);
      setFormError(null);

      if (!formData.name.trim()) {
        setFormError('Exercise name is required');
        return;
      }
      if (!formData.description.trim()) {
        setFormError('Description is required');
        return;
      }
      if (!formData.qText.trim()) {
        setFormError('Question text is required');
        return;
      }

      await exercisesApi.updateExercise(editingExercise.id, {
        unit_id: formData.unit_id,
        name: formData.name,
        description: formData.description,
        number: formData.number,
        type: formData.type,
        qText: formData.qText,
        audio_url: formData.audio_url,
        video_url: formData.video_url,
        image_url: formData.image_url,
      });

      setEditingExercise(null);
      setShowEditModal(false);
      loadExercises();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update exercise');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteExercise = async () => {
    if (!deletingExercise) return;

    try {
      setFormLoading(true);
      setFormError(null);

      await exercisesApi.deleteExercise(deletingExercise.id);

      setDeletingExercise(null);
      setShowDeleteModal(false);
      loadExercises();
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete exercise');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormData({
      unit_id: Number(exercise.unit_id),
      name: exercise.name,
      description: exercise.description,
      number: exercise.number,
      type: exercise.type,
      qText: exercise.qText,
      audio_url: exercise.audio_url || '',
      video_url: exercise.video_url || '',
      image_url: exercise.image_url || '',
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const openDeleteModal = (exercise: Exercise) => {
    setDeletingExercise(exercise);
    setFormError(null);
    setShowDeleteModal(true);
  };

  const openDetailsModal = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowDetailsModal(true);
  };

  // -------------------- Loading Skeleton --------------------
  if (loading && !mounted) {
    return (
      <Layout>
        <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 min-h-screen">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // -------------------- Render --------------------
  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen transition-colors duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-white/20 dark:border-gray-800/50 shadow-lg animate-in fade-in slide-in-from-top-1 duration-700">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Exercises Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create, edit, and manage exercises for your learning units
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Exercise
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Exercises', value: pagination.total, icon: BookOpen, color: 'blue' },
            { label: 'Active', value: exercises.length, icon: CheckCircle, color: 'green' },
            { label: 'Types', value: exerciseTypes.length, icon: Hash, color: 'purple' },
            { label: 'Last Updated', value: 'Today', icon: Clock, color: 'orange' },
          ].map((stat, idx) => (
            <Card
              key={idx}
              className="group border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {stat.label}
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-${stat.color}-100/80 dark:bg-${stat.color}-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <stat.icon
                      className={`w-5 h-5 md:w-6 md:h-6 text-${stat.color}-600 dark:text-${stat.color}-400`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Toggle */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 group"
          >
            <Filter className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>

        {/* Filters Card */}
        {showFilters && (
          <Card className="border-0 bg-gradient-to-br from-white to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 backdrop-blur-sm shadow-xl animate-in slide-in-from-top-3 fade-in duration-500">
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search exercises..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-9 bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </Label>
                  <Select
                    value={filters.type || 'all'}
                    onValueChange={(value) =>
                      handleFilterChange('type', value === 'all' ? undefined : value)
                    }
                  >
                    <SelectTrigger className="bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/30">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent className="animate-in fade-in zoom-in-95 duration-200">
                      <SelectItem value="all">All Types</SelectItem>
                      {exerciseTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-${type.color}-500`} />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Unit ID
                  </Label>
                  <Input
                    id="unit_id"
                    type="number"
                    min="1"
                    placeholder="Filter by Unit"
                    value={filters.unit_id || ''}
                    onChange={(e) =>
                      handleFilterChange(
                        'unit_id',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    className="bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/30 transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4 gap-2">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                >
                  <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                  Reset Filters
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowFilters(false)}
                  className="hover:bg-gray-200 dark:hover:bg-gray-800"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {error && (
          <Alert
            variant="destructive"
            className="animate-in slide-in-from-top-2 fade-in duration-300 border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-950/30 backdrop-blur-sm"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Exercises Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
              Exercises ({pagination.total})
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-3 py-1 rounded-full backdrop-blur-sm">
              Page {pagination.page} of {pagination.totalPages}
            </div>
          </div>

          {exercises.length === 0 && !loading ? (
            <Card className="border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-lg animate-in fade-in zoom-in-95 duration-500">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-4 animate-pulse">
                  <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Exercises Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {filters.search || filters.type || filters.unit_id
                    ? 'No exercises match your search criteria. Try adjusting your filters.'
                    : 'Get started by creating your first exercise for your learning units.'}
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Exercise
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exercises.map((exercise, idx) => {
                  const typeInfo = getTypeInfo(exercise.type);
                  return (
                    <Card
                      key={exercise.id}
                      className="group border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:bg-clip-text transition-all duration-300">
                              {exercise.name}
                            </CardTitle>
                            <CardDescription className="mt-1 flex items-center gap-2 text-xs md:text-sm">
                              <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                Unit {exercise.unit_id}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                #{exercise.number}
                              </span>
                              {exercise.tasks_count !== undefined && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                    {exercise.tasks_count} tasks
                                  </span>
                                </>
                              )}
                            </CardDescription>
                          </div>
                          <Badge
                            className={`${getColorClasses(
                              typeInfo.color
                            )} ml-2 flex-shrink-0 px-3 py-1 text-xs font-medium border shadow-sm group-hover:shadow-md transition-all`}
                          >
                            {typeInfo.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                          {exercise.description}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(exercise.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetailsModal(exercise)}
                            className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all hover:scale-110"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(exercise)}
                            className="border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all hover:scale-110"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDeleteModal(exercise)}
                            className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:scale-110"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center mt-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                  <Pagination>
                    <PaginationContent className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-lg p-1 shadow-lg">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                          className={
                            pagination.page === 1
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
                          }
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (pagination.totalPages > 5 && pagination.page > 3) {
                          pageNum = pagination.page - 2 + i;
                        }
                        if (pageNum > pagination.totalPages) return null;
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNum)}
                              isActive={pagination.page === pageNum}
                              className={`cursor-pointer transition-all ${
                                pagination.page === pageNum
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))
                          }
                          className={
                            pagination.page === pagination.totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>

        {/* ==================== BEAUTIFUL MODALS ==================== */}

        {/* ---------- 1. CREATE EXERCISE MODAL (Premium) ---------- */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-300">
            {/* Header with decorative gradient bar */}
            <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            
            <div className="p-6">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Create New Exercise
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400 text-base pt-2">
                  Fill in the details below to create a new exercise for your unit.
                </DialogDescription>
              </DialogHeader>

              {formError && (
                <Alert variant="destructive" className="mb-4 animate-in shake duration-300 border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-950/30 backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-5 py-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {/* Row 1: Unit ID & Exercise Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="unit_id" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Unit ID <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">#</span>
                      <Input
                        id="unit_id"
                        type="number"
                        min="1"
                        value={formData.unit_id}
                        onChange={(e) => setFormData({ ...formData, unit_id: parseInt(e.target.value) || 1 })}
                        required
                        className="pl-8 bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/30 rounded-xl transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Exercise Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">#</span>
                      <Input
                        id="number"
                        type="number"
                        min="1"
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 1 })}
                        required
                        className="pl-8 bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/30 rounded-xl transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Exercise Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Exercise Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Reading Comprehension Exercise 1"
                    required
                    className="bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/30 rounded-xl transition-all"
                  />
                </div>

                {/* Exercise Type */}
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Exercise Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/30 rounded-xl">
                      <SelectValue placeholder="Select exercise type" />
                    </SelectTrigger>
                    <SelectContent className="animate-in fade-in zoom-in-95 duration-200 rounded-xl">
                      {exerciseTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-${type.color}-500`} />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the exercise..."
                    rows={3}
                    required
                    className="bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/30 rounded-xl transition-all resize-none"
                  />
                </div>

                {/* Question Text */}
                <div className="space-y-2">
                  <Label htmlFor="qText" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Question Text <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="qText"
                    value={formData.qText}
                    onChange={(e) => setFormData({ ...formData, qText: e.target.value })}
                    placeholder="Enter the main question or instruction for students..."
                    rows={3}
                    required
                    className="bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/30 rounded-xl transition-all resize-none"
                  />
                </div>

                {/* Optional Media URLs */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Optional Media URLs
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="audio_url" className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Mic className="w-3.5 h-3.5" /> Audio URL
                      </Label>
                      <Input
                        id="audio_url"
                        value={formData.audio_url}
                        onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                        placeholder="https://example.com/audio.mp3"
                        className="bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/30 rounded-xl transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="video_url" className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" /> Video URL
                      </Label>
                      <Input
                        id="video_url"
                        value={formData.video_url}
                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                        placeholder="https://example.com/video.mp4"
                        className="bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/30 rounded-xl transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image_url" className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" /> Image URL
                    </Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/30 rounded-xl transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={formLoading}
                  className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-6 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateExercise}
                  disabled={formLoading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-xl rounded-xl px-6 transition-all"
                >
                  {formLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Exercise'
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* ---------- 2. EDIT EXERCISE MODAL (Premium) ---------- */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-300">
            <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
            
            <div className="p-6">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
                  <Edit className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  Edit Exercise
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400 text-base pt-2">
                  Update the exercise details below.
                </DialogDescription>
              </DialogHeader>

              {formError && (
                <Alert variant="destructive" className="mb-4 animate-in shake duration-300 border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-950/30 backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-5 py-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {/* Same fields as create modal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="edit_unit_id" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Unit ID <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">#</span>
                      <Input
                        id="edit_unit_id"
                        type="number"
                        min="1"
                        value={formData.unit_id}
                        onChange={(e) => setFormData({ ...formData, unit_id: parseInt(e.target.value) || 1 })}
                        required
                        className="pl-8 bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500/30 rounded-xl transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_number" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Exercise Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">#</span>
                      <Input
                        id="edit_number"
                        type="number"
                        min="1"
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 1 })}
                        required
                        className="pl-8 bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500/30 rounded-xl transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_name" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Exercise Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit_name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500/30 rounded-xl transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_type" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Exercise Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500/30 rounded-xl">
                      <SelectValue placeholder="Select exercise type" />
                    </SelectTrigger>
                    <SelectContent className="animate-in fade-in zoom-in-95 duration-200 rounded-xl">
                      {exerciseTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-${type.color}-500`} />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_description" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="edit_description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    required
                    className="bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500/30 rounded-xl transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_qText" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Question Text <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="edit_qText"
                    value={formData.qText}
                    onChange={(e) => setFormData({ ...formData, qText: e.target.value })}
                    rows={3}
                    required
                    className="bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500/30 rounded-xl transition-all resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Optional Media URLs
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_audio_url" className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Mic className="w-3.5 h-3.5" /> Audio URL
                      </Label>
                      <Input
                        id="edit_audio_url"
                        value={formData.audio_url}
                        onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                        placeholder="https://example.com/audio.mp3"
                        className="bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500/30 rounded-xl transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_video_url" className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" /> Video URL
                      </Label>
                      <Input
                        id="edit_video_url"
                        value={formData.video_url}
                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                        placeholder="https://example.com/video.mp4"
                        className="bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500/30 rounded-xl transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_image_url" className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" /> Image URL
                    </Label>
                    <Input
                      id="edit_image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500/30 rounded-xl transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={formLoading}
                  className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-6 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditExercise}
                  disabled={formLoading}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-md hover:shadow-xl rounded-xl px-6 transition-all"
                >
                  {formLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Exercise'
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* ---------- 3. DELETE CONFIRMATION MODAL (Premium) ---------- */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-300">
            <div className="h-2 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500" />
            
            <div className="p-6">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400 bg-clip-text text-transparent flex items-center gap-2">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                  Delete Exercise
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400 text-base pt-2">
                  Are you sure you want to delete this exercise? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>

              {deletingExercise && (
                <div className="my-4 p-5 bg-red-50/80 dark:bg-red-950/30 backdrop-blur-sm rounded-xl border border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{deletingExercise.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Unit {deletingExercise.unit_id} • Exercise #{deletingExercise.number}
                      </p>
                      <div className="mt-2">
                        <Badge className={getColorClasses(getTypeInfo(deletingExercise.type).color)}>
                          {getTypeInfo(deletingExercise.type).label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formError && (
                <Alert variant="destructive" className="mt-2 border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-950/30 backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <DialogFooter className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={formLoading}
                  className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-6 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteExercise}
                  disabled={formLoading}
                  variant="destructive"
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md hover:shadow-xl rounded-xl px-6 transition-all"
                >
                  {formLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Exercise'
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* ---------- 4. EXERCISE DETAILS MODAL (Premium) ---------- */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-300">
            <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500" />
            
            <div className="p-6">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                  <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Exercise Details
                </DialogTitle>
              </DialogHeader>

              {selectedExercise && (
                <div className="space-y-5 py-2 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                  {/* Header with type badge */}
                  <div className="flex items-start justify-between bg-gray-50/80 dark:bg-gray-800/50 p-4 rounded-xl backdrop-blur-sm">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                        {selectedExercise.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-gray-200 dark:bg-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">
                          Unit {selectedExercise.unit_id}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="bg-gray-200 dark:bg-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">
                          Exercise #{selectedExercise.number}
                        </span>
                      </div>
                    </div>
                    <Badge className={`${getColorClasses(getTypeInfo(selectedExercise.type).color)} px-4 py-2 text-sm font-semibold ml-2 flex-shrink-0`}>
                      {getTypeInfo(selectedExercise.type).label}
                    </Badge>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </Label>
                    <div className="bg-gray-50/80 dark:bg-gray-800/50 p-4 rounded-xl backdrop-blur-sm">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {selectedExercise.description}
                      </p>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Question Text
                    </Label>
                    <div className="bg-gray-50/80 dark:bg-gray-800/50 p-4 rounded-xl backdrop-blur-sm">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {selectedExercise.qText}
                      </p>
                    </div>
                  </div>

                  {/* Tasks count */}
                  {selectedExercise.tasks_count !== undefined && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tasks
                      </Label>
                      <div className="bg-blue-50/80 dark:bg-blue-950/30 p-4 rounded-xl backdrop-blur-sm flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total tasks</p>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {selectedExercise.tasks_count}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Media URLs */}
                  {(selectedExercise.audio_url || selectedExercise.video_url || selectedExercise.image_url) && (
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Media Resources
                      </Label>
                      <div className="space-y-2">
                        {selectedExercise.audio_url && (
                          <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
                            <div className="flex items-center gap-2 truncate">
                              <Mic className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {selectedExercise.audio_url}
                              </span>
                            </div>
                            <a
                              href={selectedExercise.audio_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex-shrink-0 ml-2"
                            >
                              Open
                            </a>
                          </div>
                        )}
                        {selectedExercise.video_url && (
                          <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
                            <div className="flex items-center gap-2 truncate">
                              <Video className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {selectedExercise.video_url}
                              </span>
                            </div>
                            <a
                              href={selectedExercise.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex-shrink-0 ml-2"
                            >
                              Open
                            </a>
                          </div>
                        )}
                        {selectedExercise.image_url && (
                          <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
                            <div className="flex items-center gap-2 truncate">
                              <ImageIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {selectedExercise.image_url}
                              </span>
                            </div>
                            <a
                              href={selectedExercise.image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex-shrink-0 ml-2"
                            >
                              Open
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-gray-50/80 dark:bg-gray-800/50 p-3 rounded-xl backdrop-blur-sm">
                      <Label className="text-xs text-gray-500 dark:text-gray-400">Created</Label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                        {formatDate(selectedExercise.created_at)}
                      </p>
                    </div>
                    <div className="bg-gray-50/80 dark:bg-gray-800/50 p-3 rounded-xl backdrop-blur-sm">
                      <Label className="text-xs text-gray-500 dark:text-gray-400">Updated</Label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                        {formatDate(selectedExercise.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="mt-6">
                <Button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-xl rounded-xl py-2 transition-all"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}