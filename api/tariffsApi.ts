import api from '@/lib/api';

export interface Tariff {
  id: number;
  name: string;
  student_min: number;
  student_max: number;
  price_1month: number;
  price_3months: number;
  price_6months: number;
  price_12months: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTariffRequest {
  name: string;
  student_min: number;
  student_max: number;
  price_1month: number;
  price_3months: number;
  price_6months: number;
  price_12months: number;
  description?: string;
  is_active?: boolean;
}

export interface UpdateTariffRequest extends Partial<CreateTariffRequest> {}

export const tariffsApi = {
  getAll: () => api.get<Tariff[]>('/tariffs').then(r => r.data),
  getById: (id: number) => api.get<Tariff>(`/tariffs/${id}`).then(r => r.data),
  create: (data: CreateTariffRequest) => api.post<Tariff>('/tariffs', data).then(r => r.data),
  update: (id: number, data: UpdateTariffRequest) => api.patch<Tariff>(`/tariffs/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/tariffs/${id}`).then(r => r.data),
};
