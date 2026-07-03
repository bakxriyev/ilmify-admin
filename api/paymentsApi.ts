import api from '../lib/api';

export interface Payment {
  id: number;
  student_id: number;
  group_id: number;
  amount: number;
  cash_amount?: number | null;
  card_amount?: number | null;
  month: number;
  year: number;
  status: 'paid' | 'unpaid' | 'partial';
  paid_at: string | null;
  payment_type: string | null;
  note: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  student?: { id: number; first_name: string; last_name: string; phone_number?: string };
  group?: { id: number; name: string; monthly_price?: number };
}

export interface GroupPaymentSummary {
  student: { id: number; first_name: string; last_name: string; phone_number: string; password?: string };
  group?: { id: number; name: string; monthly_price?: number };
  payment: Payment | null;
  payment_type: string | null;
  status: string;
  month: number;
  year: number;
  monthly_price: number;
  effective_price?: number;
  paid_amount: number;
  debt: number;
  overdue_lessons: number;
  joined_date?: string;
}

export interface PaymentStats {
  total: number;
  paid: number;
  unpaid: number;
  partial: number;
  total_amount: number;
}

export interface TodayPaymentStats {
  date: string;
  total_count: number;
  total_amount: number;
  total_cash: number;
  total_card: number;
  split_count: number;
  split_cash_amount: number;
  split_card_amount: number;
  naqt_count: number;
  naqt_amount: number;
  karta_count: number;
  karta_amount: number;
  click_count: number;
  other_count: number;
}

export const paymentsApi = {
  getAll: (params?: { group_id?: number; student_id?: number; month?: number; year?: number; status?: string; payment_type?: string; date_from?: string; date_to?: string }) =>
    api.get<Payment[]>('/payments', { params }).then(r => r.data),

  getStats: () =>
    api.get<PaymentStats>('/payments/stats').then(r => r.data),

  getTodayStats: () =>
    api.get<TodayPaymentStats>('/payments/today-stats').then(r => r.data),

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

  getStudentDebts: (studentId: number) =>
    api.get<{
      student: { id: number; first_name: string; last_name: string; phone_number: string; password?: string };
      debts: Array<{
        id?: number;
        month: number;
        month_name: string;
        year: number;
        group_id: number;
        group_name: string;
        amount: number;
        status: 'paid' | 'unpaid' | 'partial';
        is_auto_generated?: boolean;
        full_amount?: number;
        paid_amount?: number;
      }>;
      paid_payments: Array<{
        id: number;
        month: number;
        month_name: string;
        year: number;
        group_id: number;
        group_name: string;
        amount: number;
        status: 'paid' | 'partial';
        paid_at: string;
        payment_type?: string | null;
      }>;
      orphaned_payments: Array<{
        id: number;
        month: number;
        month_name: string;
        year: number;
        amount: number;
        status: string;
        paid_at: string | null;
        payment_type?: string | null;
        created_at: string;
        note: string | null;
      }>;
      total_debt: number;
      paid_total: number;
      student_groups: Array<{ id: number; name: string }>;
    }>(`/payments/debts/${studentId}`).then(r => r.data),

  create: (data: { student_id: number; group_id: number; amount: number; month: number; year: number; status?: string; payment_type?: string; cash_amount?: number; card_amount?: number; note?: string; paid_at?: string }) =>
    api.post<Payment>('/payments', data).then(r => r.data),

  update: (id: number, data: { amount?: number; status?: string; paid_at?: string; payment_type?: string; cash_amount?: number; card_amount?: number; note?: string }) =>
    api.patch<Payment>(`/payments/${id}`, data).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/payments/${id}`).then(r => r.data),

  getCancelled: () =>
    api.get<Payment[]>('/payments/cancelled').then(r => r.data),

  autoGenerate: () =>
    api.get('/payments/auto-generate').then(r => r.data),

  sendReminders: () =>
    api.get('/payments/send-reminders').then(r => r.data),

  sendAbsenceNotification: (studentId: number, lessonDate: string) =>
    api.post('/payments/absence-notification', { student_id: studentId, lesson_date: lessonDate }).then(r => r.data),

  checkReminders: (groupId: number) =>
    api.post<{ sent: number; total_unpaid: number }>('/payments/check-reminders', { group_id: groupId }).then(r => r.data),

  exportToExcel: (month: number, year: number) => {
    const baseURL = api.defaults.baseURL || 'https://api.ilmify-edu.uz';
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
    const adminRaw = typeof window !== 'undefined' ? localStorage.getItem('admin') : '';
    let centerId = '';
    try { const a = JSON.parse(adminRaw || '{}'); centerId = a.center_id || ''; } catch {}

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${baseURL}/payments/export?month=${month}&year=${year}`, true);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    if (centerId) xhr.setRequestHeader('x-center-id', String(centerId));
    xhr.responseType = 'blob';
    xhr.onload = () => {
      if (xhr.status !== 200) {
        console.error('Excel yuklab olishda xatolik:', xhr.status);
        return;
      }
      const disposition = xhr.getResponseHeader('Content-Disposition') || '';
      let fileName = `Tolovlar_${month}_${year}.xlsx`;
      const match = disposition.match(/filename\*=UTF-8''([^;]+)/);
      if (match) fileName = decodeURIComponent(match[1]);

      const urlObj = window.URL.createObjectURL(xhr.response);
      const link = document.createElement('a');
      link.href = urlObj;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlObj);
    };
    xhr.onerror = () => console.error('Excel yuklab olishda xatolik');
    xhr.send();
  },
};
