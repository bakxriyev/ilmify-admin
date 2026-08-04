import api from '../lib/api';

export interface Lead {
  id: number;
  center_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  comment: string | null;
  status: string;
  source_id: number | null;
  source_platform: string | null;
  notes: string | null;
  callback_date: string | null;
  contacted_at: string | null;
  trial_group_id: number | null;
  student_id: number | null;
  created_at: string;
  source?: { id: number; name: string; platform: string };
}

export interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  interested: number;
  not_interested: number;
  trial_registered?: number;
  enrolled: number;
  archived: number;
}

export const leadsApi = {
  getAll: (params?: { status?: string; source_id?: number; search?: string; exclude_status?: string }) =>
    api.get<Lead[]>('/leads', { params }).then(r => r.data),
  getStats: () => api.get<LeadStats>('/leads/stats').then(r => r.data),
  getById: (id: number) => api.get<Lead>(`/leads/${id}`).then(r => r.data),
  create: (data: { first_name: string; last_name: string; phone_number: string; comment?: string; source_id?: number; source_platform?: string }) =>
    api.post<Lead>('/leads', data).then(r => r.data),
  createPublic: (data: { first_name: string; last_name: string; phone_number: string; comment?: string; source_id?: number; source_platform?: string; token?: string; center_id?: number }) =>
    api.post<Lead>('/leads/public', data).then(r => r.data),
  getCenterByToken: (token: string) =>
    api.get<{ id: number; name: string; logo?: string | null }>(`/leads/public/center/${token}`).then(r => r.data),
  update: (id: number, data: { status?: string; notes?: string; callback_date?: string }) =>
    api.patch<Lead>(`/leads/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/leads/${id}`).then(r => r.data),
  registerTrial: (id: number, data: { group_id: number; student_password?: string }) =>
    api.post<{ message: string; lead: Lead; student_id: number; group_id: number }>(`/leads/${id}/register-trial`, data).then(r => r.data),
};
