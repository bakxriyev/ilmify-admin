import api from '../lib/api';

export interface Group {
  id: string;
  name: string;
  teacher_id: string;
  support_teacher_id: string;
  level_id: string;
  monthly_price?: number;
  created_at: string;
  updated_at: string;
  mainTeacher?: {
    id: string;
    first_name: string;
    last_name: string;
    gmail: string;
    phone_number: string;
    photo: string;
  };
  supportTeacher?: {
    id: string;
    first_name: string;
    last_name: string;
    gmail: string;
    phone_number: string;
    photo: string;
  };
  level?: {
    id: string;
    name: string;
    title: string;
    description: string;
  };
  lessons?: Array<{
    id: string;
    group_id: string;
    date: string;
    time: string;
    start_time?: string;
    end_time?: string;
    room_id?: string;
    parity: string;
  }>;
  room_id?: string;
  room?: {
    id: string;
    name: string;
    capacity: number;
    occupied_seats: number;
    available_seats: number;
  };
  student_count?: number;
  trial_count?: number;
}

export interface CreateGroupRequest {
  name: string;
  teacher_id: string;
  support_teacher_id: string;
  level_id: string;
  room_id?: string | null;
  monthly_price?: number;
  start_date?: string;
  duration_months?: number;
  time?: string;
  start_time?: string;
  end_time?: string;
  parity?: 'odd' | 'even';
}

export interface UpdateGroupRequest {
  name?: string;
  teacher_id?: string;
  support_teacher_id?: string;
  level_id?: string;
  room_id?: string | null;
  monthly_price?: number;
  start_date?: string;
  duration_months?: number;
  time?: string;
  start_time?: string;
  end_time?: string;
  parity?: 'odd' | 'even';
}

export interface GetAllGroupsParams {
  page?: number;
  limit?: number;
  teacher_id?: string;
  support_teacher_id?: string;
  name?: string;
  day?: string;
  include?: string;
}

export interface GroupsResponse {
  data: Group[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const groupsApi = {
  getAll: async (params?: GetAllGroupsParams): Promise<GroupsResponse> => {
    try {
      // Default include relations
      const defaultParams = {
        include: 'mainTeacher,supportTeacher,level,lessons',
        ...params
      };
      
      const response = await api.get('/groups', { params: defaultParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  },

    getById: async (id: string): Promise<Group> => {
    try {
      const response = await api.get(`/groups/${id}`, {
        params: { include: 'mainTeacher,supportTeacher,level,lessons,room' },
      });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch group';
      throw new Error(errorMessage);
    }
  },

  create: async (data: CreateGroupRequest): Promise<Group> => {
    try {
      const response = await api.post('/groups', data);
      return response.data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  },

  update: async (id: string, data: UpdateGroupRequest): Promise<Group> => {
    try {
      const response = await api.patch(`/groups/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating group with id ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/groups/${id}`);
    } catch (error) {
      console.error(`Error deleting group with id ${id}:`, error);
      throw error;
    }
  },

  getStudents: async (id: string): Promise<any[]> => {
    try {
      const response = await api.get(`/groups/${id}/students`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching students for group ${id}:`, error);
      throw error;
    }
  },

  addStudent: async (groupId: string, studentId: string): Promise<any> => {
    try {
      const response = await api.post(`/groups/${groupId}/students/${studentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error adding student ${studentId} to group ${groupId}:`, error);
      throw error;
    }
  },

  removeStudent: async (groupId: string, studentId: string): Promise<void> => {
    try {
      await api.delete(`/groups/${groupId}/students/${studentId}`);
    } catch (error) {
      console.error(`Error removing student ${studentId} from group ${groupId}:`, error);
      throw error;
    }
  },

  getLessons: async (id: string): Promise<any[]> => {
    try {
      const response = await api.get(`/groups/${id}/lessons`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching lessons for group ${id}:`, error);
      throw error;
    }
  }
};