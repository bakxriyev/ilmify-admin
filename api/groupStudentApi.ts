// api/groupStudentsApi.ts
import api from '../lib/api';

// ---------- Types ----------
export interface GroupStudent {
  id: number;
  group_id: number;
  student_id: number;
  joined_date: string;
  left_date: string | null;
  is_trial: boolean;
  created_at?: string;
  updated_at?: string;
  student?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    phone_number: string;
    photo: string | null;
    age?: number;
    parent_links?: Array<{
      parent?: {
        id: number;
        first_name: string;
        last_name: string;
        phone_number: string;
      };
    }>;
  };
  group?: {
    id: number;
    name: string;
    level?: {
      id: number;
      name: string;
      title: string;
    };
  };
}

export interface AddStudentToGroupRequest {
  group_id: number;
  student_id: number;
  joined_date: string; // format: YYYY-MM-DD
}

export interface UpdateGroupStudentRequest {
  joined_date?: string;
}
export interface BulkAddStudentsRequest {
  student_ids: number[];
  joined_date: string;
}
export interface BulkRemoveStudentsRequest {
  student_ids: number[];
}

export interface GroupStatsResponse {
  total_students: number;
  active_students: number;
  average_attendance?: number;
  joined_today?: number;
  joined_this_week?: number;
  joined_this_month?: number;
}

export interface GroupStudentsResponse {
  data: GroupStudent[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// ---------- API Functions ----------
export const groupStudentsApi = {
  /**
   * POST /group-students
   * Guruhga bitta student qo'shish
   */
  addStudent: async (data: AddStudentToGroupRequest): Promise<GroupStudent> => {
    try {
      const response = await api.post('/group-students', data);
      return response.data;
    } catch (error) {
      console.error('Error adding student to group:', error);
      throw error;
    }
  },

  /**
   * GET /group-students
   * Barcha group-student munosabatlarini olish
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    group_id?: number;
    student_id?: number;
  }): Promise<GroupStudentsResponse> => {
    try {
      const response = await api.get('/group-students', { params });
      
      // API javob formatiga moslash
      if (response.data?.data && Array.isArray(response.data.data)) {
        return {
          data: response.data.data,
          total: response.data.total || response.data.data.length,
          page: response.data.page || 1,
          limit: response.data.limit || 10,
          totalPages: response.data.totalPages || Math.ceil((response.data.total || response.data.data.length) / (response.data.limit || 10)),
        };
      }
      
      if (Array.isArray(response.data)) {
        return {
          data: response.data,
          total: response.data.length,
          page: 1,
          limit: response.data.length,
          totalPages: 1,
        };
      }
      
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
    } catch (error) {
      console.error('Error fetching group-student relations:', error);
      throw error;
    }
  },

  /**
   * GET /group-students/{id}
   * ID bo'yicha group-student munosabatini olish
   */
  getById: async (id: number): Promise<GroupStudent> => {
    try {
      const response = await api.get(`/group-students/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching group-student relation ${id}:`, error);
      throw error;
    }
  },

  /**
   * PATCH /group-students/{id}
   * Group-student munosabatini yangilash
   */
  update: async (id: number, data: UpdateGroupStudentRequest): Promise<GroupStudent> => {
    try {
      const response = await api.patch(`/group-students/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating group-student relation ${id}:`, error);
      throw error;
    }
  },

  /**
   * DELETE /group-students/{id}
   * Group-student munosabatini o'chirish (relation ID orqali)
   */
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/group-students/${id}`);
    } catch (error) {
      console.error(`Error deleting group-student relation ${id}:`, error);
      throw error;
    }
  },

  /**
   * GET /group-students/group/{groupId}
   * Guruhdagi barcha studentlarni olish
   */
  getStudentsByGroup: async (
    groupId: number, 
    params?: { page?: number; limit?: number }
  ): Promise<GroupStudent[]> => {
    try {
      const response = await api.get(`/group-students/group/${groupId}`, { params });
      
      // API to'g'ridan-to'g'ri array qaytaradi deb faraz qilamiz
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Agar { data: [] } formatida bo'lsa
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching students for group ${groupId}:`, error);
      throw error;
    }
  },

  /**
   * GET /group-students/student/{studentId}
   * Studentning barcha guruhlarini olish
   */
  getGroupsByStudent: async (studentId: number): Promise<GroupStudent[]> => {
    try {
      const response = await api.get(`/group-students/student/${studentId}`);
      
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching groups for student ${studentId}:`, error);
      throw error;
    }
  },

  /**
   * GET /group-students/group/{groupId}/stats
   * Guruh statistikasini olish
   */
  getGroupStats: async (groupId: number): Promise<GroupStatsResponse> => {
    try {
      const response = await api.get(`/group-students/group/${groupId}/stats`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching stats for group ${groupId}:`, error);
      throw error;
    }
  },
  removeStudentFromGroup: async (groupId: number, studentId: number): Promise<void> => {
    try {
      await api.delete(`/group-students/group/${groupId}/student/${studentId}`);
    } catch (error) {
      console.error(`Error removing student ${studentId} from group ${groupId}:`, error);
      throw error;
    }
  },


  
  bulkRemoveStudents: async (
    groupId: number, 
    data: BulkRemoveStudentsRequest
  ): Promise<{ message: string; removed_count: number }> => {
    try {
      const response = await api.delete(`/group-students/group/${groupId}/bulk-remove`, { data });
      return response.data;
    } catch (error) {
      console.error(`Error bulk removing students from group ${groupId}:`, error);
      throw error;
    }
  },
  bulkUpdateJoinDate: async (groupId: number, joined_date: string): Promise<{ updated: number }> => {
    const response = await api.patch(`/group-students/group/${groupId}/bulk-join-date`, { joined_date });
    return response.data;
  },

  bulkAddStudents: async (
    groupId: number,
    data: BulkAddStudentsRequest
  ): Promise<GroupStudent[]> => {   // Backend to'g'ridan-to'g'ri yaratilgan munosabatlar massivini qaytaradi
    const response = await api.post(`/group-students/group/${groupId}/bulk-add`, data);
    return response.data;
  },

  // ===================== TRIAL (PROBNIY DARS) =====================

  /**
   * GET /group-students/trial/all
   * Barcha probniy studentlarni olish
   */
  getAllTrial: async (): Promise<GroupStudent[]> => {
    const response = await api.get('/group-students/trial/all');
    return response.data;
  },

  /**
   * PATCH /group-students/{id}/confirm-trial
   * Probniy studentni to'liq studentga aylantirish
   */
  confirmTrial: async (id: number): Promise<{ message: string; data: GroupStudent }> => {
    const response = await api.patch(`/group-students/${id}/confirm-trial`);
    return response.data;
  },
};