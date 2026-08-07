// services/teachersApi.ts
import api from '../lib/api';

// ---------- Types ----------
export interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  gmail: string;
  phone_number: string;
  photo: string | null;
  password?: string;
  teacher_type: 'MAIN_TEACHER' | 'SUPPORT';
  age?: string;
  specialization?: string;
  students_count?: number;
  groups_count?: number;
  paid_count?: number;
  unpaid_count?: number;
  partial_count?: number;
  paid_percent?: number;
  total_paid_amount?: number;
  total_debt?: number;
  mainGroups?: Array<{
    id: number;
    name: string;
    room?: { id: number; name: string; capacity: number; occupied_seats?: number; available_seats?: number };
    student_count?: number;
    level?: { name: string; title: string };
    lessons?: Array<{ id: number; date: string; time: string; parity: string }>;
  }>;
  supportGroups?: Array<{
    id: number;
    name: string;
    room?: { id: number; name: string; capacity: number; occupied_seats?: number; available_seats?: number };
    student_count?: number;
    level?: { name: string; title: string };
    lessons?: Array<{ id: number; date: string; time: string; parity: string }>;
  }>;
  created_at?: string;
  updated_at?: string;
}

export function getTeacherGroups(teacher: Teacher) {
  return [...(teacher.mainGroups || []), ...(teacher.supportGroups || [])];
}

export interface CreateTeacherRequest {
  first_name: string;
  last_name: string;
  gmail: string;                        // majburiy
  phone_number: string;
  password: string;
  photo?: string;                        // ixtiyoriy string (URL)
}

export interface UpdateTeacherRequest {
  first_name?: string;
  last_name?: string;
  gmail?: string;
  phone_number?: string;
  password?: string;
  photo?: string;
}

export interface GetAllTeachersParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  first_name?: string;
  last_name?: string;
  gmail?: string;                        // backendda email o'rniga gmail
  phone_number?: string;
  group_id?: number | 'notnull' | 0;
  month?: number;
  year?: number;
}

export interface TeachersResponse {
  data: Teacher[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------- API Functions ----------
export const teachersApi = {
  /**
   * Barcha teacherlarni olish (filter, pagination, sort)
   */
  getAll: async (params?: GetAllTeachersParams): Promise<TeachersResponse> => {
    try {
      const response = await api.get('/teachers', { params });
      
      // 1. Backend javobi { data: [], pagination: { total, page, limit, totalPages } } ko'rinishida
      if (response.data?.data && Array.isArray(response.data.data)) {
        return {
          data: response.data.data,
          total: response.data.pagination?.total ?? 0,
          page: response.data.pagination?.page ?? 1,
          limit: response.data.pagination?.limit ?? 10,
          totalPages: response.data.pagination?.totalPages ?? 1,
        };
      }
      
      // 2. Backend javobi to'g'ridan-to'g'ri array qaytaradi
      if (Array.isArray(response.data)) {
        return {
          data: response.data,
          total: response.data.length,
          page: 1,
          limit: response.data.length,
          totalPages: 1,
        };
      }
      
      // 3. Backend javobi { data: [], total, page, limit, totalPages } ko'rinishida
      if (response.data?.data && typeof response.data.total === 'number') {
        return {
          data: response.data.data,
          total: response.data.total,
          page: response.data.page ?? 1,
          limit: response.data.limit ?? 10,
          totalPages: response.data.totalPages ?? 1,
        };
      }
      
      // 4. Hech narsa mos kelmasa – bo'sh javob
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
    } catch (error) {
      console.error('Error fetching teachers:', error);
      // Xatolikni yuqoriga uzatish
      throw error;
    }
  },

  /**
   * ID bo'yicha bitta teacherni olish
   */
  getById: async (id: string): Promise<Teacher> => {
    try {
      const response = await api.get(`/teachers/${id}`, { params: { includeGroups: true } });
      return response.data;
    } catch (error) {
      console.error(`Error fetching teacher ${id}:`, error);
      throw error;
    }
  },

  /**
   * Yangi teacher yaratish (JSON formatida)
   */
create: async (data: CreateTeacherRequest | FormData): Promise<Teacher> => {
    try {
      let body: FormData;
      
      if (data instanceof FormData) {
        body = data;
      } else {
        body = new FormData();
        
        // Barcha maydonlarni FormData ga qo'shish
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'photo' && value instanceof File) {
              // Agar photo fayl bo'lsa
              body.append(key, value, value.name);
            } else if (key === 'age' && typeof value === 'number') {
              // Age ni string ga aylantirish
              body.append(key, value.toString());
            } else {
              // Qolgan maydonlar (string)
              body.append(key, String(value));
            }
          }
        });
      }

      const response = await api.post('/teachers', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating teacher:', error);
      throw error;
    }
  },

  /**
   * Teacherni yangilash (JSON formatida)
   */
  update: async (id: string, data: UpdateTeacherRequest | FormData): Promise<Teacher> => {
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
            } else if (key === 'age' && typeof value === 'number') {
              body.append(key, value.toString());
            } else {
              body.append(key, String(value));
            }
          }
        });
      }

      const response = await api.patch(`/teachers/${id}`, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating teacher ${id}:`, error);
      throw error;
    }
  },

  /**
   * Teacherni o'chirish
   */
  delete: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/teachers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting teacher ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bir nechta teacherni ommaviy yaratish (agar backend qo'llasa)
   */
  bulkCreate: async (data: { teachers: CreateTeacherRequest[] }): Promise<{
    success_count: number;
    error_count: number;
    created_teachers: Teacher[];
    errors: any[];
  }> => {
    try {
      const response = await api.post('/teachers/bulk', data, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk creating teachers:', error);
      throw error;
    }
  },

  /**
   * Guruh bo'yicha teacherlarni olish
   */
  login: async (data: { phone_number: string; password: string }): Promise<{ access_token: string; teacher: any }> => {
    const response = await api.post('/teachers/login', data);
    return response.data;
  },

  getByGroup: async (groupId: number): Promise<Teacher[]> => {
    try {
      const response = await api.get(`/teachers/group/${groupId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(`Error fetching teachers for group ${groupId}:`, error);
      throw error;
    }
  },

  /**
   * Barcha o'qituvchilar to'lov hisoboti
   */
  getPaymentReport: async (month?: number, year?: number): Promise<TeacherPaymentReport> => {
    try {
      const response = await api.get('/teachers/payment-report', { params: { month, year } });
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher payment report:', error);
      throw error;
    }
  },

  /**
   * Bitta o'qituvchining to'lov hisoboti (barcha o'quvchilari)
   */
  getTeacherPaymentReport: async (
    id: string,
    month?: number,
    year?: number,
    group_id?: number,
  ): Promise<TeacherPaymentDetail> => {
    try {
      const response = await api.get(`/teachers/${id}/payment-report`, { params: { month, year, group_id } });
      return response.data;
    } catch (error) {
      console.error(`Error fetching teacher ${id} payment report:`, error);
      throw error;
    }
  },
};

export interface TeacherPaymentRow {
  student: {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    password?: string;
  };
  group: {
    id: number;
    name: string;
    monthly_price: number;
    parity?: string;
    weekdays?: string;
    lesson_time?: string;
  };
  payment: {
    id: number;
    amount: number;
    status: string;
    paid_at: string | null;
    payment_type: string | null;
    cash_amount?: number | null;
    card_amount?: number | null;
    note: string | null;
  } | null;
  status: 'paid' | 'unpaid' | 'partial';
  month: number;
  year: number;
  monthly_price: number;
  effective_price: number;
  paid_amount: number;
  debt: number;
  joined_date?: string | null;
  left_date?: string | null;
}

export interface TeacherPaymentDetail {
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    gmail: string;
    photo: string | null;
    teacher_type: string;
    center_id?: number;
  };
  month: number;
  year: number;
  groups: Array<{ id: number; name: string; monthly_price: number }>;
  summary: {
    students_count: number;
    paid_count: number;
    unpaid_count: number;
    partial_count: number;
    paid_percent: number;
    total_paid_amount: number;
    total_debt: number;
    total_monthly_price: number;
  };
  rows: TeacherPaymentRow[];
}

export interface TeacherReportRow {
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    gmail: string;
    photo: string | null;
    teacher_type: string;
  };
  month: number;
  year: number;
  groups_count: number;
  students_count: number;
  paid_count: number;
  unpaid_count: number;
  partial_count: number;
  paid_percent: number;
  total_paid_amount: number;
  total_debt: number;
  groups: Array<{ id: number; name: string; monthly_price: number; parity?: string; weekdays?: string }>;
}

export interface TeacherPaymentReport {
  month: number;
  year: number;
  summary: {
    teachers_count: number;
    students_count: number;
    paid_count: number;
    unpaid_count: number;
    partial_count: number;
    paid_percent: number;
    total_paid_amount: number;
    total_debt: number;
  };
  data: TeacherReportRow[];
}