// services/studentsApi.ts
import api from '../lib/api';

// ---------- Types ----------
export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  email: string | null;
  phone_number: string;
  photo: string | null;
  password?: string;
  is_active?: boolean;
  isActive?: boolean;
  group_id: number | null;
  group?: {
    id: number;
    name: string;
    description?: string;
  } | null;
  group_students?: Array<{
    id: number;
    group_id: number;
    student_id: string;
    joined_date: string;
    left_date: string | null;
    is_trial: boolean;
    group?: {
      id: number;
      name: string;
    };
  }>;
  created_at?: string;
  updated_at?: string;
}


export interface CreateStudentRequest {
  first_name: string;
  last_name: string;
  age: number;
  email?: string;
  phone_number?: string;
  password: string;
  photo?: File | string;
  parent_first_name?: string;
  parent_last_name?: string;
  parent_phone_number?: string;
  parent_password?: string;
}

export interface UpdateStudentRequest {
  first_name?: string;
  last_name?: string;
  age?: number;
  email?: string;
  phone_number?: string;
  password?: string;
  photo?: File | string;
  is_active?: boolean;
  isActive?: boolean;
}

export interface GetAllStudentsParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  search?: string;
  group_id?: number | 'notnull' | 0;
  min_age?: number;
  max_age?: number;
  phone_number_empty?: 'true';
}

export interface StudentsResponse {
  data: Student[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// ---------- API Functions ----------
export const studentsApi = {
  /**
   * Barcha studentlarni olish
   */
  getAll: async (params?: GetAllStudentsParams): Promise<StudentsResponse> => {
    try {
      const response = await api.get('/students', { params });
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        return {
          data: response.data.data,
          pagination: {
            total: response.data.pagination?.total ?? 0,
            page: response.data.pagination?.page ?? 1,
            limit: response.data.pagination?.limit ?? 10,
            total_pages: response.data.pagination?.total_pages ?? 1,
          },
        };
      }
      
      if (Array.isArray(response.data)) {
        return {
          data: response.data,
          pagination: {
            total: response.data.length,
            page: 1,
            limit: response.data.length,
            total_pages: 1,
          },
        };
      }
      
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          total_pages: 1,
        },
      };
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },
  getNoGroup: async (params?: { page?: number; limit?: number }): Promise<StudentsResponse> => {
    const response = await api.get('/students/no-group', { params });
    // API javobi { data: Student[], pagination: {...} } formatida keladi
    if (response.data?.data && Array.isArray(response.data.data)) {
      return {
        data: response.data.data,
        pagination: {
          total: response.data.pagination?.total ?? 0,
          page: response.data.pagination?.page ?? 1,
          limit: response.data.pagination?.limit ?? 10,
          total_pages: response.data.pagination?.total_pages ?? 1,
        },
      };
    }
    // Agar to'g'ridan-to'g'ri array qaytsa (ehtiyot)
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        pagination: {
          total: response.data.length,
          page: 1,
          limit: response.data.length,
          total_pages: 1,
        },
      };
    }
    return {
      data: [],
      pagination: { total: 0, page: 1, limit: 10, total_pages: 1 },
    };
  },
  getById: async (id: string): Promise<Student> => {
    try {
      const response = await api.get(`/students/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching student ${id}:`, error);
      throw error;
    }
  },

  /**
   * Yangi student yaratish (JSON)
   */
  create: async (data: CreateStudentRequest | FormData): Promise<Student> => {
    try {
      let body: FormData;
      if (data instanceof FormData) {
        body = data;
      } else {
        body = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'photo' && value instanceof File) {
              body.append(key, value, value.name);
            } else {
              body.append(key, String(value));
            }
          }
        });
      }

      const response = await api.post('/students', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  },


  update: async (id: string, data: UpdateStudentRequest | FormData): Promise<Student> => {
    try {
      let response;
      if (data instanceof FormData) {
        // If FormData (likely with photo), use multipart
        response = await api.patch(`/students/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // If plain object (no photo or photo is string/url), send as JSON
        // Ensure booleans like isActive remain booleans
        response = await api.patch(`/students/${id}`, data, {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return response.data;
    } catch (error) {
      console.error(`Error updating student ${id}:`, error);
      throw error;
    }
  },

  /**
   * Studentni o'chirish
   */
  delete: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/students/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting student ${id}:`, error);
      throw error;
    }
  },

  /**
   * Student parolini yangilash
   */
  updatePassword: async (id: string, data: { password: string }): Promise<{ message: string }> => {
    try {
      const response = await api.put(`/students/${id}/password`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating password for student ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bir nechta student yaratish (ommaviy)
   */
  bulkCreate: async (data: { students: CreateStudentRequest[] }): Promise<{
    success_count: number;
    error_count: number;
    errors: Array<{ index: number; student: any; error: string }>;
  }> => {
    try {
      const response = await api.post('/students/bulk', data, { timeout: 180000 });
      return response.data;
    } catch (error) {
      console.error('Error bulk creating students:', error);
      throw error;
    }
  },

  /**
   * Guruh bo'yicha studentlarni olish
   */
  getByGroup: async (groupId: number): Promise<Student[]> => {
    try {
      const response = await api.get(`/students/group/${groupId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(`Error fetching students for group ${groupId}:`, error);
      throw error;
    }
  },

  getStats: async (): Promise<{
    total: number;
    active: number;
    inactive: number;
    withGroup: number;
    withoutGroup: number;
  }> => {
    const response = await api.get('/students/stats');
    return response.data;
  },

  bulkToggleActive: async (isActive: boolean): Promise<{ updated: number; message: string }> => {
    const response = await api.patch('/students/bulk/toggle-active', { isActive });
    return response.data;
  },

  bulkUpdatePassword: async (password: string): Promise<{ message: string }> => {
    const response = await api.patch('/students/password/bulk', { password });
    return response.data;
  },

  getSuspicious: async (): Promise<{
    total_suspicious: number;
    total_groups: number;
    groups: Array<{
      type: string;
      label: string;
      students: Student[];
    }>;
  }> => {
    const response = await api.get('/students/suspicious/all');
    return response.data;
  },

  mergeStudents: async (main_student_id: number, secondary_student_id: number): Promise<{ message: string }> => {
    const response = await api.post('/students/merge', { main_student_id, secondary_student_id });
    return response.data;
  },
};