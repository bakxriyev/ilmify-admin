'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileText,
  BookOpen,
  Type,
  Mic,
  Pencil,
  Headphones,
  HelpCircle,
  Languages,
  GraduationCap,
  ListChecks,
  Image,
  Video,
  Music
} from 'lucide-react';
import { exercisesApi, Exercise, CreateExerciseRequest, UpdateExerciseRequest } from '../../../../../api/exercisesApi';
import { unitsApi, Unit } from '../../../../../api/unitsApi';

// Exercise type configuration with icons and colors
const exerciseTypeConfig = {
  reading: { 
    label: 'Reading', 
    icon: BookOpen, 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    badgeColor: 'blue'
  },
  gap_fill: { 
    label: 'Gap Fill', 
    icon: Type, 
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    badgeColor: 'amber'
  },
  speaking: { 
    label: 'Speaking', 
    icon: Mic, 
    color: 'bg-green-100 text-green-800 border-green-200',
    badgeColor: 'green'
  },
  writing: { 
    label: 'Writing', 
    icon: Pencil, 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    badgeColor: 'purple'
  },
  listening: { 
    label: 'Listening', 
    icon: Headphones, 
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    badgeColor: 'pink'
  },
  test: { 
    label: 'Test', 
    icon: HelpCircle, 
    color: 'bg-red-100 text-red-800 border-red-200',
    badgeColor: 'red'
  },
  vocabulary: { 
    label: 'Vocabulary', 
    icon: Languages, 
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    badgeColor: 'indigo'
  },
  grammar: { 
    label: 'Grammar', 
    icon: GraduationCap, 
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badgeColor: 'emerald'
  },
  summary_c: { 
    label: 'Summary C', 
    icon: ListChecks, 
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    badgeColor: 'cyan'
  },
  summary_d: { 
    label: 'Summary D', 
    icon: ListChecks, 
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    badgeColor: 'teal'
  },
    summary_choice: { 
    label: 'Summary Choice', 
    icon: ListChecks, 
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    badgeColor: 'teal'
  },
    summary_ing: { 
    label: 'Gapni to`liq yozish', 
    icon: ListChecks, 
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    badgeColor: 'teal'
  },
   summary_no: { 
    label: 'Blanksiz gapga option tanlash', 
    icon: ListChecks, 
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    badgeColor: 'teal'
  },
   summary_writing: { 
    label: 'Writing Summary', 
    icon: ListChecks, 
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    badgeColor: 'teal'
  },
};

// Exercise types array for select dropdown
const exerciseTypes = Object.entries(exerciseTypeConfig).map(([value, config]) => ({
  value: value as Exercise['type'],
  label: config.label,
  icon: config.icon,
  color: config.badgeColor
}));

export default function UnitExercisesPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = parseInt(params.unitId as string);

  // States
  const [unit, setUnit] = useState<Unit | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [totalExercises, setTotalExercises] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Form data for create/edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    number: 1,
    type: 'reading' as Exercise['type'],
    qText: '',
    audio_url: '',
    video_url: '',
    image_url: '',
  });

  // Load unit details
  const fetchUnit = async () => {
    try {
      const unitData = await unitsApi.getById(unitId);
      setUnit(unitData);
    } catch (err: any) {
      setError(err.message || 'Unit maʼlumotlarini yuklashda xatolik');
    }
  };

  // Load exercises
  const fetchExercises = async (page = currentPage) => {
    try {
      setLoading(true);
      const response = await exercisesApi.getAllExercises({
        unit_id: unitId,
        page,
        limit,
      });
      setExercises(response.data);
      setTotalExercises(response.pagination.total);
      setTotalPages(response.pagination.total_pages);
      setCurrentPage(response.pagination.page);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Exerciselarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (unitId) {
      fetchUnit();
      fetchExercises(1);
    }
  }, [unitId]);

  // Create exercise
  const handleCreate = async () => {
    try {
      setActionLoading(true);
      setError(null);

      // Validation
      if (!formData.name.trim()) {
        setError('Exercise nomi kiritilishi shart');
        return;
      }
      if (!formData.qText.trim()) {
        setError('Savol matni kiritilishi shart');
        return;
      }

      const payload: CreateExerciseRequest = {
        unit_id: unitId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        number: formData.number,
        type: formData.type,
        qText: formData.qText.trim(),
        audio_url: formData.audio_url.trim() || undefined,
        video_url: formData.video_url.trim() || undefined,
        image_url: formData.image_url.trim() || undefined,
      };

      await exercisesApi.createExercise(payload);
      setShowCreateModal(false);
      resetForm();
      await fetchExercises(currentPage);
      setSuccess('Exercise muvaffaqiyatli qo\'shildi!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Exercise yaratishda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  // Update exercise
  const handleUpdate = async () => {
    if (!selectedExercise) return;

    try {
      setActionLoading(true);
      setError(null);

      // Validation
      if (!formData.name.trim()) {
        setError('Exercise nomi kiritilishi shart');
        return;
      }
      if (!formData.qText.trim()) {
        setError('Savol matni kiritilishi shart');
        return;
      }

      const payload: UpdateExerciseRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        number: formData.number,
        type: formData.type,
        qText: formData.qText.trim(),
        audio_url: formData.audio_url.trim() || undefined,
        video_url: formData.video_url.trim() || undefined,
        image_url: formData.image_url.trim() || undefined,
      };

      await exercisesApi.updateExercise(selectedExercise.id, payload);
      setShowEditModal(false);
      resetForm();
      await fetchExercises(currentPage);
      setSuccess('Exercise muvaffaqiyatli yangilandi!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Exercise yangilashda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete exercise
  const handleDelete = async () => {
    if (!selectedExercise) return;

    try {
      setActionLoading(true);
      setError(null);

      await exercisesApi.deleteExercise(selectedExercise.id);
      setShowDeleteModal(false);
      setSelectedExercise(null);
      await fetchExercises(currentPage);
      setSuccess('Exercise muvaffaqiyatli o\'chirildi!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Exercise o\'chirishda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  // Helpers
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      number: 1,
      type: 'reading',
      qText: '',
      audio_url: '',
      video_url: '',
      image_url: '',
    });
    setSelectedExercise(null);
  };

  const openEditModal = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setFormData({
      name: exercise.name,
      description: exercise.description || '',
      number: exercise.number,
      type: exercise.type,
      qText: exercise.qText || '',
      audio_url: exercise.audio_url || '',
      video_url: exercise.video_url || '',
      image_url: exercise.image_url || '',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowDeleteModal(true);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    fetchExercises(page);
  };

  if (loading && !unit && exercises.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-lg shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Exerciselar yuklanmoqda...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 bg-gray-50 min-h-screen p-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Link href="/lesson/units" className="hover:text-blue-600 transition-colors">
                  Unitlar
                </Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-gray-700 font-medium">{unit?.name || 'Unit'}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-blue-600 font-medium">Exerciselar</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                {unit ? `${unit.name} - Exerciselar` : 'Exerciselar'}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-gray-600">
                  Jami: <span className="font-semibold text-gray-900">{totalExercises}</span> ta exercise
                </p>
                <p className="text-gray-600">
                  Sahifa: <span className="font-semibold text-gray-900">{currentPage} / {totalPages}</span>
                </p>
              </div>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Yangi Exercise
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Exercises Table */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Exerciselar ro'yxati</CardTitle>
                <CardDescription className="text-gray-600">
                  {unit?.name} unitiga tegishli barcha mashqlar
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchExercises(currentPage)}
                disabled={loading}
                className="border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Yangilash
              </Button>
            </div>
          </CardHeader>
          <CardContent className="bg-white p-6">
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">#</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nomi</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Turi</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Raqam</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Savol</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Media</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: limit }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-3 px-4"><Skeleton className="h-4 w-8" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-6 w-20" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-12" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-48" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="py-3 px-4"><div className="flex justify-end gap-1"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></td>
                      </tr>
                    ))
                  ) : exercises.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <FileText className="h-12 w-12 text-gray-400 mb-2" />
                          <p className="text-gray-600 mb-2">Bu unitda hech qanday exercise yo'q</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowCreateModal(true)} 
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Birinchi exerciseni qo'shish
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    exercises.map((ex, index) => {
                      const config = exerciseTypeConfig[ex.type] || exerciseTypeConfig.reading;
                      const Icon = config.icon;
                      
                      return (
                        <tr
                          key={ex.id}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => router.push(`/lesson/units/${unitId}/exercises/${ex.id}/tasks`)}
                        >
                          <td className="py-3 px-4 text-gray-600 font-medium">
                            {(currentPage - 1) * limit + index + 1}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900">{ex.name}</span>
                            {ex.description && (
                              <p className="text-xs text-gray-500 mt-1">{ex.description}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={`${config.color} border-0 flex items-center gap-1 w-fit`}>
                              <Icon className="h-3 w-3" />
                              {config.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-700">#{ex.number}</td>
                          <td className="py-3 px-4 max-w-xs truncate text-gray-600">{ex.qText}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {ex.audio_url && <span title="Audio bor"><Music className="h-4 w-4 text-blue-500 inline" /></span>}
                              {ex.video_url && <span title="Video bor"><Video className="h-4 w-4 text-green-500 inline" /></span>}
                              {ex.image_url && <span title="Rasm bor"><Image className="h-4 w-4 text-purple-500 inline" /></span>}
                              {!ex.audio_url && !ex.video_url && !ex.image_url && (
                                <span className="text-xs text-gray-400">Yo'q</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(ex);
                                }}
                                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                                title="Tahrirlash"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteModal(ex);
                                }}
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                title="O'chirish"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {exercises.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {(currentPage - 1) * limit + 1} dan{' '}
                  {Math.min(currentPage * limit, totalExercises)} gacha, jami {totalExercises} ta exercise
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Oldingi
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`h-8 w-8 p-0 ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
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
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Keyingi
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[600px] bg-white border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Yangi Exercise Qo'shish</DialogTitle>
            <DialogDescription className="text-gray-600">
              Unit: <span className="font-medium text-gray-900">{unit?.name}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700">
                  Nomi <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Reading Exercise 1"
                  disabled={actionLoading}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="number" className="text-gray-700">
                  Raqami <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="number"
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 1 })}
                  min={1}
                  disabled={actionLoading}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-gray-700">
                Turi <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(val) => setFormData({ ...formData, type: val as Exercise['type'] })}
              >
                <SelectTrigger className="border-gray-300 bg-white">
                  <SelectValue placeholder="Exercise turini tanlang" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  {exerciseTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qText" className="text-gray-700">
                Savol matni <span className="text-red-500">*</span>
              </Label>
              <Input
                id="qText"
                value={formData.qText}
                onChange={(e) => setFormData({ ...formData, qText: e.target.value })}
                placeholder="Asosiy savol matnini kiriting"
                disabled={actionLoading}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700">Tavsif (ixtiyoriy)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mashq haqida qisqacha tavsif"
                disabled={actionLoading}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Media fayllar (ixtiyoriy)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="audio_url" className="text-gray-700 flex items-center gap-1">
                    <Music className="h-3 w-3" /> Audio URL
                  </Label>
                  <Input
                    id="audio_url"
                    value={formData.audio_url}
                    onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                    placeholder="https://example.com/audio.mp3"
                    disabled={actionLoading}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="video_url" className="text-gray-700 flex items-center gap-1">
                    <Video className="h-3 w-3" /> Video URL
                  </Label>
                  <Input
                    id="video_url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://example.com/video.mp4"
                    disabled={actionLoading}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="image_url" className="text-gray-700 flex items-center gap-1">
                    <Image className="h-3 w-3" /> Rasm URL
                  </Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    disabled={actionLoading}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateModal(false)} 
              disabled={actionLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Bekor qilish
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={handleCreate} 
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Qo'shilmoqda...
                </>
              ) : (
                'Qo\'shish'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[600px] bg-white border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Exercise ni Tahrirlash</DialogTitle>
            <DialogDescription className="text-gray-600">
              <span className="font-medium text-gray-900">{selectedExercise?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name" className="text-gray-700">Nomi</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={actionLoading}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_number" className="text-gray-700">Raqami</Label>
                <Input
                  id="edit_number"
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 1 })}
                  min={1}
                  disabled={actionLoading}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_type" className="text-gray-700">Turi</Label>
              <Select
                value={formData.type}
                onValueChange={(val) => setFormData({ ...formData, type: val as Exercise['type'] })}
              >
                <SelectTrigger className="border-gray-300 bg-white">
                  <SelectValue placeholder="Exercise turini tanlang" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  {exerciseTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_qText" className="text-gray-700">Savol matni</Label>
              <Input
                id="edit_qText"
                value={formData.qText}
                onChange={(e) => setFormData({ ...formData, qText: e.target.value })}
                disabled={actionLoading}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_description" className="text-gray-700">Tavsif</Label>
              <Input
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={actionLoading}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Media fayllar</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_audio_url" className="text-gray-700 flex items-center gap-1">
                    <Music className="h-3 w-3" /> Audio URL
                  </Label>
                  <Input
                    id="edit_audio_url"
                    value={formData.audio_url}
                    onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                    disabled={actionLoading}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_video_url" className="text-gray-700 flex items-center gap-1">
                    <Video className="h-3 w-3" /> Video URL
                  </Label>
                  <Input
                    id="edit_video_url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    disabled={actionLoading}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_image_url" className="text-gray-700 flex items-center gap-1">
                    <Image className="h-3 w-3" /> Rasm URL
                  </Label>
                  <Input
                    id="edit_image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    disabled={actionLoading}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditModal(false)} 
              disabled={actionLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Bekor qilish
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={handleUpdate} 
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Yangilanmoqda...
                </>
              ) : (
                'Yangilash'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[400px] bg-white border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Exercise ni O'chirish</DialogTitle>
            <DialogDescription className="text-gray-600">
              <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 font-medium mb-2">⚠️ Diqqat! Bu amalni qaytarib bo'lmaydi.</p>
                <p>
                  <span className="font-medium text-gray-900">{selectedExercise?.name}</span> nomli exercise 
                  va unga tegishli barcha ma'lumotlar o'chiriladi.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteModal(false)} 
              disabled={actionLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Bekor qilish
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  O'chirilmoqda...
                </>
              ) : (
                'O\'chirish'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}