import api from '../lib/api';

export interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string;
  created_by: number | null;
  center_id: number | null;
  created_at: string;
}

export const expensesApi = {
  getAll: (params?: { date_from?: string; date_to?: string }) =>
    api.get<Expense[]>('/expenses', { params }).then(r => r.data),

  create: (data: { amount: number; description: string; date: string }) =>
    api.post<Expense>('/expenses', data).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/expenses/${id}`).then(r => r.data),
};
