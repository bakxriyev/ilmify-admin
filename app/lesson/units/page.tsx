'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '../../../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { debounce } from 'lodash';
import * as XLSX from 'xlsx';

// Icons
import {
  Search,
  Filter,
  X,
  Plus,
  Upload,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Hash,
  AlignLeft,
  Layers,
  Edit,
  Trash2,
  BarChart3,
  Users,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Folder,
  FileText,
  Book,
  ArrowLeft,
} from 'lucide-react';

// API
import { unitsApi, Unit, UnitStatistics } from '../../../api/unitsApi';
import { levelsApi, Level } from '../../../api/levelsApi';

interface FilterParams {
  title?: string;
  description?: string;
  has_exercises?: boolean;
  has_vocabs?: boolean;
  level_id?: number;
  page: number;
  limit: number;
  sort_by: string;
  sort_order: 'ASC' | 'DESC';
  include_relations?: boolean;
}

export default function UnitsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [totalUnits, setTotalUnits] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [showExercisesModal, setShowExercisesModal] = useState(false);
  const [showAssignLevelModal, setShowAssignLevelModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [unitStatistics, setUnitStatistics] = useState<UnitStatistics | null>(null);
  const [unitExercises, setUnitExercises] = useState<any[]>([]);
  const [exercisesPagination, setExercisesPagination] = useState<any>(null);

  // Filters
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    limit: 10,
    sort_by: 'unit_number',
    sort_order: 'ASC',
  });
  const [exerciseFilter, setExerciseFilter] = useState<{ has_exercises?: boolean; has_vocabs?: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Form
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    unit_number: '',
    level_id: undefined as number | undefined,
  });

  // Bulk data
  const [bulkData, setBulkData] = useState<Array<{
    name: string;
    title?: string;
    description?: string;
    unit_number?: string;
    level_id?: number;
  }>>([]);

  // Assign level data
  const [assignLevelData, setAssignLevelData] = useState({
    level_id: undefined as number | undefined,
  });

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      if (value.trim()) {
        setFilters(prev => ({
          ...prev,
          title: value,
          description: value,
          page: 1,
        }));
      } else {
        setFilters(prev => {
          const newFilters = { ...prev };
          delete newFilters.title;
          delete newFilters.description;
          newFilters.page = 1;
          return newFilters;
        });
      }
    }, 500),
    []
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Level ID ni URL dan olish
  useEffect(() => {
    const levelId = searchParams.get('level_id');
    if (levelId) {
      loadLevelById(parseInt(levelId));
    }
  }, [searchParams]);

  // Level larni yuklash
  const fetchLevels = async () => {
    try {
      setLoadingLevels(true);
      const response = await levelsApi.getAll({ limit: 100 });
      setLevels(response.data);
    } catch (err: any) {
      setError(err.message || 'Levellarni yuklashda xatolik');
    } finally {
      setLoadingLevels(false);
    }
  };

  const loadLevelById = async (id: number) => {
    try {
      setLoading(true);
      const level = await levelsApi.getById(id);
      setSelectedLevel(level);
      setFilters(prev => ({ ...prev, level_id: id, page: 1 }));
    } catch (err: any) {
      setError(err.message || 'Level maʼlumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // Fetch units
  const fetchUnits = async () => {
    if (!selectedLevel) return;

    try {
      setTableLoading(true);
      setError(null);

      const params: any = { ...filters, level_id: selectedLevel.id };

      if (exerciseFilter.has_exercises !== undefined) {
        params.has_exercises = exerciseFilter.has_exercises;
      }
      if (exerciseFilter.has_vocabs !== undefined) {
        params.has_vocabs = exerciseFilter.has_vocabs;
      }

      if (activeTab === 'with-exercises') {
        params.has_exercises = true;
      } else if (activeTab === 'with-vocabs') {
        params.has_vocabs = true;
      } else if (activeTab === 'no-exercises') {
        params.has_exercises = false;
      }

      const response = await unitsApi.getAll(params);
      setUnits(response.data);
      setTotalUnits(response.pagination.total);
      setTotalPages(response.pagination.total_pages);
    } catch (err: any) {
      setError(err.message || 'Unitlarni yuklashda xatolik');
      console.error(err);
    } finally {
      setTableLoading(false);
      setLoading(false);
    }
  };

  // Initial load
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
      await fetchLevels();
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Refetch units when filters change
  useEffect(() => {
    if (selectedLevel && typeof window !== 'undefined' && localStorage.getItem('access_token')) {
      fetchUnits();
    }
  }, [filters, exerciseFilter, activeTab, selectedLevel]);

  // ---------- CRUD ----------
  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.name.trim()) {
        setError('Unit nomi (name) kiritilishi shart');
        return;
      }

      const payload: any = {
        name: formData.name,
        title: formData.title || formData.name,
        description: formData.description || undefined,
        unit_number: formData.unit_number || undefined,
      };
      if (selectedLevel) {
        payload.level_id = selectedLevel.id;
      } else if (formData.level_id) {
        payload.level_id = formData.level_id;
      }

      const newUnit = await unitsApi.create(payload);

      setUnits(prev => [newUnit, ...prev]);
      setTotalUnits(prev => prev + 1);
      setShowCreateModal(false);
      resetForm();
      setSuccess('Unit muvaffaqiyatli qo\'shildi!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Unit qo\'shishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedUnit) return;

    try {
      setLoading(true);
      setError(null);

      if (!formData.name.trim()) {
        setError('Unit nomi (name) kiritilishi shart');
        return;
      }

      const updatedUnit = await unitsApi.update(selectedUnit.id, {
        name: formData.name,
        title: formData.title || formData.name,
        description: formData.description || undefined,
        unit_number: formData.unit_number || undefined,
        level_id: formData.level_id,
      });

      setUnits(prev => prev.map(u => (u.id === selectedUnit.id ? updatedUnit : u)));
      setShowEditModal(false);
      resetForm();
      setSuccess('Unit muvaffaqiyatli yangilandi!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Unit yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUnit) return;

    try {
      setLoading(true);
      setError(null);

      await unitsApi.delete(selectedUnit.id);

      setUnits(prev => prev.filter(u => u.id !== selectedUnit.id));
      setTotalUnits(prev => prev - 1);
      setShowDeleteModal(false);
      setSelectedUnit(null);
      setSuccess('Unit muvaffaqiyatli o\'chirildi!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Unit o\'chirishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Level assignment ----------
  const handleAssignToLevel = async () => {
    if (!selectedUnit || !assignLevelData.level_id) return;

    try {
      setLoading(true);
      setError(null);

      const updatedUnit = await unitsApi.assignToLevel(selectedUnit.id, assignLevelData.level_id);

      setUnits(prev => prev.map(u => (u.id === selectedUnit.id ? updatedUnit : u)));
      setShowAssignLevelModal(false);
      setAssignLevelData({ level_id: undefined });
      setSuccess('Unit levelga muvaffaqiyatli qo\'shildi!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Levelga qo\'shishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromLevel = async (unitId: number) => {
    try {
      setLoading(true);
      setError(null);

      const updatedUnit = await unitsApi.removeFromLevel(unitId);

      setUnits(prev => prev.map(u => (u.id === unitId ? updatedUnit : u)));
      setSuccess('Unit leveldan muvaffaqiyatli olib tashlandi!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Leveldan olib tashlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Bulk import ----------
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

        const formattedData = jsonData.map((row: any) => ({
          name: row.name || row['Name'] || row['Unit Name'] || row.title || row['Title'] || '',
          title: row.title || row['Title'] || '',
          description: row.description || row['Description'] || '',
          unit_number: row.unit_number || row['Unit Number'] || row['unit_number']?.toString() || '',
          level_id: row.level_id || row['Level ID'] ? parseInt(row['Level ID']) : undefined,
        })).filter(row => row.name);

        setBulkData(formattedData);
        setShowBulkModal(true);
      } catch (err) {
        setError('Excel faylni o\'qishda xatolik');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkCreate = async () => {
    try {
      setLoading(true);
      setError(null);

      if (bulkData.length === 0) {
        setError('Import qilish uchun ma\'lumot yo\'q');
        return;
      }

      let payloadUnits = bulkData.map(u => ({
        ...u,
        title: u.title || u.name,
      }));
      if (selectedLevel) {
        payloadUnits = payloadUnits.map(u => ({ ...u, level_id: selectedLevel.id }));
      }

      const response = await unitsApi.bulkCreate({ units: payloadUnits });

      setShowBulkModal(false);
      setBulkData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      fetchUnits();
      setSuccess(`${response.success_count} unit muvaffaqiyatli qo'shildi. ${response.error_count} ta xatolik.`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Unitlarni import qilishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Statistics & Exercises ----------
  const loadStatistics = async (unitId: number) => {
    try {
      setLoading(true);
      const stats = await unitsApi.getStatistics(unitId);
      setUnitStatistics(stats);
      setShowStatisticsModal(true);
    } catch (err: any) {
      setError(err.message || 'Statistika yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async (unitId: number) => {
    try {
      setLoading(true);
      const response = await unitsApi.getExercises(unitId);
      setUnitExercises(response.data);
      setExercisesPagination(response.pagination);
      setShowExercisesModal(true);
    } catch (err: any) {
      setError(err.message || 'Exerciselarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Helpers ----------
  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      description: '',
      unit_number: '',
      level_id: selectedLevel ? selectedLevel.id : undefined,
    });
    setSelectedUnit(null);
  };

  const openEditModal = (unit: Unit) => {
    setSelectedUnit(unit);
    setFormData({
      name: unit.name,
      title: unit.title || unit.name,
      description: unit.description || '',
      unit_number: unit.unit_number?.toString() || '',
      level_id: unit.level_id || undefined,
    });
    setShowEditModal(true);
  };

  const openAssignLevelModal = (unit: Unit) => {
    setSelectedUnit(unit);
    setAssignLevelData({
      level_id: unit.level_id || undefined,
    });
    setShowAssignLevelModal(true);
  };

  // Pagination
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sort_by: sortBy,
      sort_order: prev.sort_by === sortBy && prev.sort_order === 'ASC' ? 'DESC' : 'ASC',
      page: 1,
    }));
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setExerciseFilter({});
    setActiveTab('all');
    setFilters({
      page: 1,
      limit: 10,
      sort_by: 'unit_number',
      sort_order: 'ASC',
      ...(selectedLevel ? { level_id: selectedLevel.id } : {}),
    });
  };

  const goBackToLevels = () => {
    setSelectedLevel(null);
    setUnits([]);
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters.level_id;
      newFilters.page = 1;
      return newFilters;
    });
  };

  // Unit qatoriga bosilganda exercises sahifasiga o'tish
  const handleUnitRowClick = (unitId: number) => {
    router.push(`/lesson/units/${unitId}/exercises`);
  };

  if (loading && !selectedLevel && levels.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mb-4"></div>
            <p className="text-gray-600">Maʼlumotlar yuklanmoqda...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              {selectedLevel ? `${selectedLevel.name} - Unitlar` : 'Barcha Level lar'}
            </h1>
            <p className="text-gray-600 mt-1">
              {selectedLevel
                ? `Jami unitlar: ${totalUnits} | Sahifa ${filters.page} / ${totalPages}`
                : `${levels.length} ta level mavjud`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedLevel && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Excel Import
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Unit Qo'shish
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Level tanlanmagan bo‘lsa, level larni ko‘rsat */}
        {!selectedLevel ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingLevels ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-gray-200">
                  <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))
            ) : levels.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Layers className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Hech qanday level topilmadi</p>
              </div>
            ) : (
              levels.map((level) => (
                <Card
                  key={level.id}
                  className="border-gray-200 hover:border-blue-300 cursor-pointer transition-all hover:shadow-md"
                  onClick={() => loadLevelById(level.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Layers className="h-5 w-5 text-blue-600" />
                      {level.name}
                    </CardTitle>
                    <CardDescription>{level.description || 'Tavsif mavjud emas'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {level.unit_count ?? 0} ta unit
                      </Badge>
                      <span className="text-xs text-gray-500">Tartib: {level.order}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Level tanlangan – unitlar jadvali */
          <>
            <Button
              variant="ghost"
              onClick={goBackToLevels}
              className="mb-2 -ml-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Barcha level lar
            </Button>

            {/* Filters Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Filterlar</CardTitle>
                    <CardDescription>Unitlarni filterlash</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    disabled={tableLoading}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Tozalash
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-gray-100">
                      <TabsTrigger value="all">Hammasi</TabsTrigger>
                      <TabsTrigger value="with-exercises">Exercises bor</TabsTrigger>
                      <TabsTrigger value="with-vocabs">Vocabs bor</TabsTrigger>
                      <TabsTrigger value="no-exercises">Exercises yo'q</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="search">Qidirish</Label>
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="search"
                          placeholder="Title yoki description bo'yicha qidirish..."
                          value={searchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="pl-10 border-gray-300 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Exercises</Label>
                      <Select
                        value={exerciseFilter.has_exercises === undefined ? 'all' : exerciseFilter.has_exercises ? 'true' : 'false'}
                        onValueChange={(val) => {
                          if (val === 'all') {
                            setExerciseFilter({ ...exerciseFilter, has_exercises: undefined });
                          } else {
                            setExerciseFilter({ ...exerciseFilter, has_exercises: val === 'true' });
                          }
                          setFilters(prev => ({ ...prev, page: 1 }));
                        }}
                      >
                        <SelectTrigger className="mt-1 border-gray-300">
                          <SelectValue placeholder="Tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Hammasi</SelectItem>
                          <SelectItem value="true">Bor</SelectItem>
                          <SelectItem value="false">Yo'q</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Vocabs</Label>
                      <Select
                        value={exerciseFilter.has_vocabs === undefined ? 'all' : exerciseFilter.has_vocabs ? 'true' : 'false'}
                        onValueChange={(val) => {
                          if (val === 'all') {
                            setExerciseFilter({ ...exerciseFilter, has_vocabs: undefined });
                          } else {
                            setExerciseFilter({ ...exerciseFilter, has_vocabs: val === 'true' });
                          }
                          setFilters(prev => ({ ...prev, page: 1 }));
                        }}
                      >
                        <SelectTrigger className="mt-1 border-gray-300">
                          <SelectValue placeholder="Tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Hammasi</SelectItem>
                          <SelectItem value="true">Bor</SelectItem>
                          <SelectItem value="false">Yo'q</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="limit">Sahifada</Label>
                      <Select
                        value={filters.limit.toString()}
                        onValueChange={(value) => handleLimitChange(parseInt(value))}
                      >
                        <SelectTrigger className="mt-1 border-gray-300">
                          <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Units Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Unitlar ro'yxati</CardTitle>
                    <CardDescription>{selectedLevel.name} levelidagi barcha unitlar</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchUnits}
                      disabled={tableLoading}
                      className="border-gray-300 hover:bg-gray-50"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${tableLoading ? 'animate-spin' : ''}`} />
                      Yangilash
                    </Button>
                    <Select
                      value={filters.sort_by}
                      onValueChange={handleSortChange}
                    >
                      <SelectTrigger className="w-40 border-gray-300">
                        <SelectValue placeholder="Saralash" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unit_number">Raqam</SelectItem>
                        <SelectItem value="name">Nomi</SelectItem>
                        <SelectItem value="exercises_count">Mashqlar soni</SelectItem>
                        <SelectItem value="students_attempted">Urinishlar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">#</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Unit</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Level</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Mashqlar</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Urinishlar</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Holat</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Amallar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableLoading ? (
                        Array.from({ length: filters.limit }).map((_, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="py-3 px-4"><Skeleton className="h-4 w-8" /></td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <Skeleton className="w-8 h-8 rounded-full" />
                                <div><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20 mt-1" /></div>
                              </div>
                            </td>
                            <td className="py-3 px-4"><Skeleton className="h-6 w-16" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-6 w-16" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-6 w-16" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-6 w-16" /></td>
                            <td className="py-3 px-4"><div className="flex justify-end gap-1"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></td>
                          </tr>
                        ))
                      ) : units.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12">
                            <div className="flex flex-col items-center">
                              <BookOpen className="h-12 w-12 text-gray-400 mb-2" />
                              <p className="text-gray-600 mb-2">Bu levelda unitlar topilmadi</p>
                              <Button variant="outline" size="sm" onClick={clearAllFilters} className="border-gray-300">
                                Filterlarni tozalash
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        units.map((unit, index) => (
                          <tr
                            key={unit.id}
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleUnitRowClick(unit.id)} // ← UNIT QATORIGA BOSILSA
                          >
                            <td className="py-3 px-4 text-gray-600 font-medium">
                              {(filters.page - 1) * filters.limit + index + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                  <Hash className="h-4 w-4" />
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900 block">{unit.name}</span>
                                  <span className="text-xs text-gray-500">
                                    #{unit.unit_number} | ID: {unit.id}
                                  </span>
                                  {unit.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{unit.description}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={unit.level_id ? 'default' : 'outline'}
                                  className={unit.level_id ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-800 border-0'}
                                >
                                  <Layers className="h-3 w-3 mr-1" />
                                  {unit.level_id ? `Level #${unit.level_id}` : 'Levelsiz'}
                                </Badge>
                                {unit.level_id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation(); // ← QATOR BOSILISHINI OLDINI OLISH
                                      handleRemoveFromLevel(unit.id);
                                    }}
                                    className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </td>
                            
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                                <FileText className="h-3 w-3 mr-1" />
                                {unit.exercises_count}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                                <Users className="h-3 w-3 mr-1" />
                                {unit.students_attempted}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              {unit.exercises_count > 0 ? (
                                <Badge className="bg-green-100 text-green-800 border-0">Faol</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-0">Faol emas</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // ← QATOR BOSILISHINI OLDINI OLISH
                                    loadStatistics(unit.id);
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-purple-100 hover:text-purple-600"
                                  title="Statistika"
                                >
                                  <BarChart3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // ← QATOR BOSILISHINI OLDINI OLISH
                                    loadExercises(unit.id);
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-indigo-100 hover:text-indigo-600"
                                  title="Exerciselar (modal)"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // ← QATOR BOSILISHINI OLDINI OLISH
                                    openAssignLevelModal(unit);
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                                  title="Levelga qo'shish"
                                >
                                  <Layers className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // ← QATOR BOSILISHINI OLDINI OLISH
                                    openEditModal(unit);
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
                                    e.stopPropagation(); // ← QATOR BOSILISHINI OLDINI OLISH
                                    setSelectedUnit(unit);
                                    setShowDeleteModal(true);
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
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
                {units.length > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      {(filters.page - 1) * filters.limit + 1} dan{' '}
                      {Math.min(filters.page * filters.limit, totalUnits)} gacha, jami {totalUnits} unit
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(filters.page - 1)}
                        disabled={filters.page === 1}
                        className="border-gray-300"
                      >
                        <ChevronLeft className="h-3 w-3 mr-1" />
                        Oldingi
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) pageNum = i + 1;
                          else if (filters.page <= 3) pageNum = i + 1;
                          else if (filters.page >= totalPages - 2) pageNum = totalPages - 4 + i;
                          else pageNum = filters.page - 2 + i;
                          return (
                            <Button
                              key={pageNum}
                              variant={filters.page === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className={`h-8 w-8 p-0 ${
                                filters.page === pageNum
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
                        onClick={() => handlePageChange(filters.page + 1)}
                        disabled={filters.page === totalPages}
                        className="border-gray-300"
                      >
                        Keyingi
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ---------- Modals ---------- */}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Yangi Unit Qo'shish</DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedLevel ? `Level: ${selectedLevel.name}` : 'Unit maʼlumotlarini kiriting'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700">
                  Nomi (name) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Introduction"
                  disabled={loading}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-700">Title (ixtiyoriy)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Title"
                  disabled={loading}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_number" className="text-gray-700">Unit raqami</Label>
                <Input
                  id="unit_number"
                  value={formData.unit_number}
                  onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                  placeholder="1, 1.1, ..."
                  disabled={loading}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level_id" className="text-gray-700">Level ID</Label>
                <Input
                  id="level_id"
                  type="number"
                  value={formData.level_id || ''}
                  onChange={(e) => setFormData({ ...formData, level_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Level ID"
                  disabled={loading || !!selectedLevel}
                  className="border-gray-300 focus:border-blue-500"
                />
                {selectedLevel && (
                  <p className="text-xs text-green-600 mt-1">
                    Avtomatik ravishda {selectedLevel.name} ga bog‘lanadi
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700">Tavsif</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Unit haqida qisqacha"
                disabled={loading}
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={loading}>
              Bekor qilish
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreate} disabled={loading}>
              {loading ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Qo'shilmoqda...</> : 'Qo\'shish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Unitni Tahrirlash</DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedUnit?.name} ma'lumotlarini yangilang
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name" className="text-gray-700">Nomi (name)</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_title" className="text-gray-700">Title</Label>
                <Input
                  id="edit_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={loading}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_unit_number" className="text-gray-700">Unit raqami</Label>
                <Input
                  id="edit_unit_number"
                  value={formData.unit_number}
                  onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                  disabled={loading}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_level_id" className="text-gray-700">Level ID</Label>
                <Input
                  id="edit_level_id"
                  type="number"
                  value={formData.level_id || ''}
                  onChange={(e) => setFormData({ ...formData, level_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  disabled={loading}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description" className="text-gray-700">Tavsif</Label>
              <Input
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={loading}>
              Bekor qilish
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleUpdate} disabled={loading}>
              {loading ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Yangilanmoqda...</> : 'Yangilash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Unitni O'chirish</DialogTitle>
            <DialogDescription className="text-gray-600">
              <span className="text-red-600 font-semibold">Bu amalni bekor qilib bo'lmaydi.</span>
              <br />
              Rostdan ham <strong className="text-gray-900">{selectedUnit?.title}</strong> ni o'chirmoqchimisiz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={loading}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />O'chirilmoqda...</> : 'O\'chirish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign to Level Modal */}
      <Dialog open={showAssignLevelModal} onOpenChange={setShowAssignLevelModal}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Levelga Qo'shish</DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedUnit?.title} ni levelga biriktiring
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assign_level_id" className="text-gray-700">Level ID</Label>
              <Input
                id="assign_level_id"
                type="number"
                value={assignLevelData.level_id || ''}
                onChange={(e) => setAssignLevelData({ level_id: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Level ID kiriting"
                disabled={loading}
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignLevelModal(false)} disabled={loading}>
              Bekor qilish
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleAssignToLevel}
              disabled={loading || !assignLevelData.level_id}
            >
              {loading ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Qo'shilmoqda...</> : 'Qo\'shish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statistics Modal */}
      <Dialog open={showStatisticsModal} onOpenChange={setShowStatisticsModal}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Unit Statistikasi</DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedUnit?.title} statistikasi
            </DialogDescription>
          </DialogHeader>
          {unitStatistics && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1 text-center">
                    {unitStatistics.total_exercises}
                  </div>
                  <p className="text-sm text-gray-600 text-center">Jami Mashqlar</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-green-600 mb-1 text-center">
                    {unitStatistics.completed_exercises}
                  </div>
                  <p className="text-sm text-gray-600 text-center">Bajarilgan</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">O'rtacha baho</span>
                  <span className="text-lg font-bold text-gray-900">{unitStatistics.average_score}%</span>
                </div>
                <Progress value={unitStatistics.average_score} className="h-2 bg-gray-200" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-purple-600 mb-1 text-center">
                    {unitStatistics.total_vocabs}
                  </div>
                  <p className="text-sm text-gray-600 text-center">Jami Vocablar</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-yellow-600 mb-1 text-center">
                    {unitStatistics.mastered_vocabs}
                  </div>
                  <p className="text-sm text-gray-600 text-center">O'zlashtirilgan</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Urinishlar</span>
                  <span className="text-lg font-bold text-gray-900">{unitStatistics.students_attempted}</span>
                </div>
              </div>

              {unitStatistics.last_activity && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Book className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      Oxirgi faollik: {new Date(unitStatistics.last_activity).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatisticsModal(false)}>
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exercises Modal */}
      <Dialog open={showExercisesModal} onOpenChange={setShowExercisesModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Exerciselar</DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedUnit?.title} ga tegishli mashqlar
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {unitExercises.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Bu unitda hech qanday exercise yo'q</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unitExercises.map((ex) => (
                  <div key={ex.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{ex.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{ex.description}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-0">
                        {ex.type || 'Exercise'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {exercisesPagination && exercisesPagination.total_pages > 1 && (
              <div className="flex justify-center mt-4">
                <span className="text-sm text-gray-600">
                  {exercisesPagination.page} / {exercisesPagination.total_pages} sahifa
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExercisesModal(false)}>
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Modal */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Excel dan Import</DialogTitle>
            <DialogDescription className="text-gray-600">
              {bulkData.length} ta unit topildi. Ko'rib chiqib import qiling.
              {selectedLevel && (
                <p className="text-green-600 text-sm mt-1">
                  Barcha unitlar avtomatik ravishda "{selectedLevel.name}" leveliga biriktiriladi.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-2 px-4 font-medium text-gray-700">#</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Nomi</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Raqam</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Tavsif</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Level ID</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkData.map((unit, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-4 text-gray-600">{index + 1}</td>
                      <td className="py-2 px-4 font-medium">{unit.title}</td>
                      <td className="py-2 px-4">{unit.unit_number}</td>
                      <td className="py-2 px-4 text-sm text-gray-600">{unit.description}</td>
                      <td className="py-2 px-4">{unit.level_id || (selectedLevel ? selectedLevel.id : '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkModal(false);
                setBulkData([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              disabled={loading}
            >
              Bekor qilish
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleBulkCreate} disabled={loading || bulkData.length === 0}>
              {loading ? (
                <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Import qilinmoqda...</>
              ) : (
                `${bulkData.length} Unitni Import Qilish`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}