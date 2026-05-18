import api from '../lib/api';

export interface Parent {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  photo: string | null;
  password?: string;
  created_at: string;
  updated_at: string;
  children_count?: number;
}

export interface ParentStudent {
  id: string;
  parent_id: string;
  student_id: string;
  created_at: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    age: number;
    phone_number: string;
    photo: string | null;
    group?: { id: number; name: string } | null;
    group_id?: number | null;
  };
}

export const parentsApi = {
  getAll: async (search?: string): Promise<Parent[]> => {
    const params = search ? { search } : {};
    const response = await api.get('/parents', { params });
    return Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.data) ? response.data.data : []);
  },

  getById: async (id: string): Promise<Parent> => {
    const response = await api.get(`/parents/${id}`);
    return response.data;
  },

  getChildren: async (parentId: number): Promise<ParentStudent[]> => {
    const response = await api.get(`/parents/${parentId}/children`);
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  },

  create: async (data: { first_name: string; last_name: string; phone_number: string; password: string }): Promise<Parent> => {
    const response = await api.post('/parents', data);
    return response.data;
  },

  linkStudent: async (parentId: number, studentId: number): Promise<any> => {
    const response = await api.post(`/parents/${parentId}/children`, { student_id: studentId });
    return response.data;
  },

  unlinkStudent: async (parentId: number, studentId: number): Promise<any> => {
    const response = await api.post(`/parents/${parentId}/children/${studentId}`);
    return response.data;
  },
};
