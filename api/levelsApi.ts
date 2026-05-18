// api/levelsApi.ts
import api from '../lib/api';
import { Unit } from './unitsApi';

export interface Level {
  id: string;
  name: string;
  title: string;
  description: string;
  unit_count?: number;
  units?: Unit[];
  created_at: string;
  updated_at: string;
}

export interface CreateLevelRequest {
  name: string;
  title: string;
  description: string;
}

export interface UpdateLevelRequest {
  name?: string;
  title?: string;
  description?: string;
}

export interface GetAllLevelsParams {
  page?: number ;
  limit?: number;
  sort_by?: 'name' | 'created_at' | 'unit_count';
  sort_order?: 'asc' | 'desc';
  name?: string;
  search?: string;
}

export interface LevelsResponse {
  data: Level[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnitsResponse {
  data: Unit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Parametrlarni to'g'rilash uchun helper funksiya
const processApiParams = (params?: GetAllLevelsParams): Record<string, any> => {
  const processedParams: Record<string, any> = {};
  
  if (!params) {
    return { page: 1, limit: 10 };
  }
  
  // Har bir parametrni alohida tekshirish
  if (params.page !== undefined && params.page !== null) {
    const pageNum = Number(params.page);
    processedParams.page = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
  } else {
    processedParams.page = 1;
  }
  
  if (params.limit !== undefined && params.limit !== null) {
    const limitNum = Number(params.limit);
    if (isNaN(limitNum) || limitNum < 1) {
      processedParams.limit = 10;
    } else if (limitNum > 100) {
      processedParams.limit = 100;
    } else {
      processedParams.limit = limitNum;
    }
  } else {
    processedParams.limit = 10;
  }
  
  // Boshqa parametrlar
  if (params.sort_by) processedParams.sort_by = params.sort_by;
  if (params.sort_order) processedParams.sort_order = params.sort_order;
  if (params.name) processedParams.name = params.name;
  if (params.search) processedParams.search = params.search;
  
  return processedParams;
};

export const levelsApi = {
  // Yangi level yaratish
  async create(data: CreateLevelRequest): Promise<Level> {
    try {
      const response = await api.post('/levels', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating level:', error);
      throw error;
    }
  },

  // Barcha levellarni olish - TO'G'RI VERSIYA
  async getAll(params?: GetAllLevelsParams): Promise<LevelsResponse> {
    try {
      // Parametrlarni to'g'rilash
      const processedParams = processApiParams(params);
      
      console.log('API Request Params:', processedParams);
      
      const response = await api.get('/levels', { 
        params: processedParams 
      });
      
      console.log('API Response:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching levels:', error);
      
      // Agar xato 400 bo'lsa, parametrlarni tekshirish kerak
      if (error.response?.status === 400) {
        console.error('Bad request. Check parameters:', params);
        
        // Parametrlarni to'g'rilab qayta urinib ko'rish
        const safeParams = { page: 1, limit: 10 };
        const retryResponse = await api.get('/levels', { params: safeParams });
        return retryResponse.data;
      }
      
      throw error;
    }
  },

  // Bir nechta level yaratish
  async createBulk(data: CreateLevelRequest[]): Promise<Level[]> {
    try {
      const response = await api.post('/levels/bulk', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating bulk levels:', error);
      throw error;
    }
  },

  // Bitta levelni olish
  async getById(id: string): Promise<Level> {
    try {
      const response = await api.get(`/levels/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching level ${id}:`, error);
      throw error;
    }
  },

  // Levelni yangilash
  async update(id: string, data: UpdateLevelRequest): Promise<Level> {
    try {
      const response = await api.patch(`/levels/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating level ${id}:`, error);
      throw error;
    }
  },

  // Levelni o'chirish
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/levels/${id}`);
    } catch (error: any) {
      console.error(`Error deleting level ${id}:`, error);
      throw error;
    }
  },

  // Level unitlarini olish - TO'G'RI VERSIYA
  async getUnits(
    id: string, 
    params?: { page?: number | string; limit?: number | string }
  ): Promise<UnitsResponse> {
    try {
      // Parametrlarni to'g'rilash
      const processedParams = processApiParams({
        page: params?.page,
        limit: params?.limit,
      });
      
      const response = await api.get(`/levels/${id}/units`, { 
        params: processedParams 
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching units for level ${id}:`, error);
      
      // Agar xato 400 bo'lsa, default parametrlar bilan qayta urinib ko'rish
      if (error.response?.status === 400) {
        console.error('Bad request for units. Using safe parameters');
        const safeParams = { page: 1, limit: 10 };
        const retryResponse = await api.get(`/levels/${id}/units`, { params: safeParams });
        return retryResponse.data;
      }
      
      throw error;
    }
  },

  // Levelga unit qo'shish
  async addUnit(id: string, unitData: { name: string; description?: string }): Promise<Unit> {
    try {
      const response = await api.post(`/levels/${id}/units`, unitData);
      return response.data;
    } catch (error: any) {
      console.error(`Error adding unit to level ${id}:`, error);
      throw error;
    }
  },
};