import api from '../lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';

export interface LeadSource {
  id: number;
  center_id: number;
  name: string;
  platform: string;
  code: string;
  is_active: boolean;
  createdAt: string;
}

export interface LeadSourceWithCenter {
  id: number;
  name: string;
  platform: string;
  code: string;
  center: { id: number; name: string } | null;
}

export const leadSourcesApi = {
  getAll: () => api.get<LeadSource[]>('/lead-sources').then(r => r.data),
  getById: (id: number) => api.get<LeadSource>(`/lead-sources/${id}`).then(r => r.data),
  create: (data: { name: string; platform: string; code: string }) =>
    api.post<LeadSource>('/lead-sources', data).then(r => r.data),
  update: (id: number, data: { name?: string; platform?: string; is_active?: boolean }) =>
    api.patch<LeadSource>(`/lead-sources/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/lead-sources/${id}`).then(r => r.data),
  getByCode: (code: string): Promise<LeadSourceWithCenter> =>
    fetch(`${API_BASE_URL}/lead-sources/by-code/${encodeURIComponent(code)}`).then(r => {
      if (!r.ok) throw new Error('Manba topilmadi');
      return r.json();
    }),
};
