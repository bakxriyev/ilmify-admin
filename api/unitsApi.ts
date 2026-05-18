// services/unitsApi.ts
import api from '../lib/api';

// ---------- Types ----------
export interface Unit {
  id: number;
  name: string;                 // backend name maydoni
  unit_number: string | number;
  title: string;                // backend title maydoni
  description: string | null;
  level_id: number | null;
  exercises_count: number;
  students_attempted: number;
  level?: {
    id: number;
    name: string;
    description?: string;
  } | null;
}

export interface CreateUnitRequest {
  name: string;                 // majburiy
  unit_number?: string | number;
  title?: string;               // ixtiyoriy, lekin Swagger misolida bor
  description?: string;
  level_id?: number;
}

export interface UpdateUnitRequest {
  name?: string;
  unit_number?: string | number;
  title?: string;
  description?: string;
  level_id?: number | null;
}

export interface BulkCreateUnitRequest {
  units: Array<{
    name: string;
    unit_number?: string | number;
    title?: string;
    description?: string;
    level_id?: number;
  }>;
}

export interface BulkCreateUnitResponse {
  success_count: number;
  error_count: number;
  created_units: Unit[];
  errors: Array<{
    index: number;
    unit: any;
    error: string;
  }>;
}

export interface UnitStatistics {
  total_exercises: number;
  completed_exercises: number;
  average_score: number;
  total_vocabs: number;
  mastered_vocabs: number;
  students_attempted: number;
  last_activity?: string;
}

export interface GetAllUnitsParams {
  title?: string;
  description?: string;
  has_exercises?: boolean;
  has_vocabs?: boolean;
  level_id?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  include_relations?: boolean;
}

export interface UnitsResponse {
  data: Unit[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface ExercisesResponse {
  data: any[]; // exercise typeni alohida qo'shishingiz mumkin
  pagination: any;
}

// ---------- API Functions ----------
export const unitsApi = {
  /**
   * Barcha unitlarni olish (filter, pagination, sort)
   */
  getAll: async (params?: GetAllUnitsParams): Promise<UnitsResponse> => {
    try {
      const response = await api.get('/units', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching units:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch units');
    }
  },

  /**
   * Bitta unitni olish
   */
  getById: async (id: number, includeRelations?: boolean): Promise<Unit> => {
    try {
      const response = await api.get(`/units/${id}`, {
        params: { include_relations: includeRelations },
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching unit with id ${id}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to fetch unit');
    }
  },

  /**
   * Yangi unit yaratish
   */
  create: async (data: CreateUnitRequest): Promise<Unit> => {
    try {
      const response = await api.post('/units', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating unit:', error);
      throw new Error(error.response?.data?.message || 'Failed to create unit');
    }
  },

  /**
   * Unitni yangilash
   */
  update: async (id: number, data: UpdateUnitRequest): Promise<Unit> => {
    try {
      const response = await api.patch(`/units/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating unit with id ${id}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to update unit');
    }
  },

  /**
   * Unitni o'chirish
   */
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/units/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error deleting unit with id ${id}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to delete unit');
    }
  },

  /**
   * Bir nechta unitni ommaviy yaratish
   */
  bulkCreate: async (data: BulkCreateUnitRequest): Promise<BulkCreateUnitResponse> => {
    try {
      const response = await api.post('/units/bulk', data);
      return response.data;
    } catch (error: any) {
      console.error('Error bulk creating units:', error);
      throw new Error(error.response?.data?.message || 'Failed to bulk create units');
    }
  },

  /**
   * Unit statistikasini olish
   */
  getStatistics: async (id: number): Promise<UnitStatistics> => {
    try {
      const response = await api.get(`/units/${id}/statistics`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching statistics for unit ${id}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to fetch statistics');
    }
  },

  /**
   * Unitga tegishli exerciselar ro'yxati
   */
  getExercises: async (id: number, params?: { page?: number; limit?: number }): Promise<ExercisesResponse> => {
    try {
      const response = await api.get(`/units/${id}/exercises`, { params });
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching exercises for unit ${id}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to fetch exercises');
    }
  },

  /**
   * Unitni levelga biriktirish
   */
  assignToLevel: async (unitId: number, levelId: number): Promise<Unit> => {
    try {
      // PATCH /units/:id orqali level_id ni yangilaymiz
      const response = await unitsApi.update(unitId, { level_id: levelId });
      return response;
    } catch (error: any) {
      console.error(`Error assigning unit ${unitId} to level ${levelId}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to assign to level');
    }
  },

  /**
   * Unitni leveldan olib tashlash (level_id = null)
   */
  removeFromLevel: async (unitId: number): Promise<Unit> => {
    try {
      const response = await unitsApi.update(unitId, { level_id: null });
      return response;
    } catch (error: any) {
      console.error(`Error removing unit ${unitId} from level:`, error);
      throw new Error(error.response?.data?.message || 'Failed to remove from level');
    }
  },
};