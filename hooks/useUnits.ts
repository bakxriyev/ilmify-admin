'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { debounce } from 'lodash';
import { unitsApi, Unit, UnitStatistics } from '../api/unitsApi';
import { levelsApi, Level } from '../api/levelsApi';

export interface FilterParams {
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

export function useUnits() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Modal states
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

  // Form for create/edit
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
      const level = await levelsApi.getById(String(id));
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
    setAssignLevelData({ level_id: unit.level_id || undefined });
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

  return {
    // States
    levels,
    selectedLevel,
    units,
    totalUnits,
    totalPages,
    loading,
    loadingLevels,
    tableLoading,
    error,
    success,
    filters,
    exerciseFilter,
    searchTerm,
    activeTab,
    formData,
    bulkData,
    assignLevelData,
    selectedUnit,
    unitStatistics,
    unitExercises,
    exercisesPagination,

    // Modal states
    showCreateModal,
    showEditModal,
    showDeleteModal,
    showBulkModal,
    showStatisticsModal,
    showExercisesModal,
    showAssignLevelModal,

    // Setters
    setShowCreateModal,
    setShowEditModal,
    setShowDeleteModal,
    setShowBulkModal,
    setShowStatisticsModal,
    setShowExercisesModal,
    setShowAssignLevelModal,
    setExerciseFilter,
    setActiveTab,
    setFormData,
    setBulkData,
    setAssignLevelData,
    setSelectedUnit,
    setError,
    setSuccess,
    setSearchTerm,

    // Functions
    handleSearchChange,
    fetchUnits,
    loadLevelById,
    goBackToLevels,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleAssignToLevel,
    handleRemoveFromLevel,
    handleBulkCreate,
    loadStatistics,
    loadExercises,
    resetForm,
    openEditModal,
    openAssignLevelModal,
    handlePageChange,
    handleLimitChange,
    handleSortChange,
    clearAllFilters,
  };
}