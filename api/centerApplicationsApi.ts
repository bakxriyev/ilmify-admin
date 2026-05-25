import api from '../lib/api';

export interface CenterApplication {
  id: number;
  center_name: string;
  full_name: string;
  phone: string;
  region: string;
  description: string | null;
  status: 'new' | 'contacted' | 'approved' | 'rejected';
  created_at: string;
}

export interface CreateApplicationDto {
  center_name: string;
  full_name: string;
  phone: string;
  region: string;
  description?: string;
}

export const centerApplicationsApi = {
  createPublic: async (dto: CreateApplicationDto): Promise<CenterApplication> => {
    const { data } = await api.post('/center-applications/public', dto);
    return data;
  },

  getAll: async (): Promise<CenterApplication[]> => {
    const { data } = await api.get('/center-applications');
    return data;
  },

  getOne: async (id: number): Promise<CenterApplication> => {
    const { data } = await api.get(`/center-applications/${id}`);
    return data;
  },

  updateStatus: async (id: number, status: string): Promise<CenterApplication> => {
    const { data } = await api.patch(`/center-applications/${id}/status`, { status });
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/center-applications/${id}`);
  },
};
