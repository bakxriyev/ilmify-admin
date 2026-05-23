import api from '../lib/api';

export interface Payment {
  id: number;
  student_id: number;
  group_id: number;
  amount: number;
  month: number;
  year: number;
  status: 'paid' | 'unpaid' | 'partial';
  paid_at: string | null;
  note: string | null;
  created_by: number | null;
  created_at: string;
  student?: { id: number; first_name: string; last_name: string; phone_number?: string };
  group?: { id: number; name: string; monthly_price?: number };
}

export interface GroupPaymentSummary {
  student: { id: number; first_name: string; last_name: string; phone_number: string };
  group?: { id: number; name: string; monthly_price?: number };
  payment: Payment | null;
  status: string;
  month: number;
  year: number;
  monthly_price: number;
  effective_price?: number;
  paid_amount: number;
  debt: number;
  overdue_days: number;
  joined_date?: string;
}

export interface PaymentStats {
  total: number;
  paid: number;
  unpaid: number;
  partial: number;
  total_amount: number;
}

export const paymentsApi = {
  getAll: (params?: { group_id?: number; student_id?: number; month?: number; year?: number; status?: string }) =>
    api.get<Payment[]>('/payments', { params }).then(r => r.data),

  getStats: () =>
    api.get<PaymentStats>('/payments/stats').then(r => r.data),

  findByStudent: (studentId: number) =>
    api.get<Payment[]>(`/payments/students/${studentId}`).then(r => r.data),

  findByGroup: (groupId: number, month?: number, year?: number) =>
    api.get<GroupPaymentSummary[]>(`/payments/groups/${groupId}`, { params: { month, year } }).then(r => r.data),

  getStudentsOverview: (month: number, year: number) =>
    api.get<GroupPaymentSummary[]>('/payments/students-overview', { params: { month, year } }).then(r => r.data),

  getYearOverview: (year: number) =>
    api.get<{ month: number; year: number; total: number; paid: number; unpaid: number; partial: number }[]>('/payments/year-overview', { params: { year } }).then(r => r.data),

  getTotalDebt: () =>
    api.get<{ total_debt: number; debtors_count: number; total_students: number }>('/payments/total-debt').then(r => r.data),

  getAllTimeTotal: () =>
    api.get<{ total_income: number }>('/payments/total-income').then(r => r.data),

  getMonthlyIncome: (year: number) =>
    api.get<{ month: number; year: number; total: number }[]>('/payments/monthly-income', { params: { year } }).then(r => r.data),

  create: (data: { student_id: number; group_id: number; amount: number; month: number; year: number; status?: string; note?: string }) =>
    api.post<Payment>('/payments', data).then(r => r.data),

  update: (id: number, data: { amount?: number; status?: string; paid_at?: string; note?: string }) =>
    api.patch<Payment>(`/payments/${id}`, data).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/payments/${id}`).then(r => r.data),

  autoGenerate: () =>
    api.get('/payments/auto-generate').then(r => r.data),

  sendReminders: () =>
    api.get('/payments/send-reminders').then(r => r.data),

  sendAbsenceNotification: (studentId: number, lessonDate: string) =>
    api.post('/payments/absence-notification', { student_id: studentId, lesson_date: lessonDate }).then(r => r.data),

  checkReminders: (groupId: number) =>
    api.post<{ sent: number; total_unpaid: number }>('/payments/check-reminders', { group_id: groupId }).then(r => r.data),
};
