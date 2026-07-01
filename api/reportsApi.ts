import api from '../lib/api';

export interface DailyReport {
  date: string;
  total_income: number;
  total_expense: number;
  net: number;
  incomes: DailyIncome[];
  expenses: DailyExpense[];
}

export interface DailyIncome {
  id: number;
  type: 'payment';
  amount: number;
  student_name: string;
  student_phone: string;
  group_name: string;
  payment_type: string | null;
  created_by: number | null;
  paid_at: string;
  created_at: string;
  note: string | null;
}

export interface DailyExpense {
  id: number;
  type: 'expense';
  amount: number;
  description: string;
  created_by: number | null;
  date: string;
  created_at: string;
}

export interface MonthlyReport {
  year: number;
  month: number;
  total_income: number;
  total_expense: number;
  net: number;
  incomes: MonthlyIncomeItem[];
  expenses: MonthlyExpenseItem[];
}

export interface MonthlyIncomeItem {
  id: number;
  amount: number;
  student_name: string;
  student_phone: string;
  group_name: string;
  payment_type: string | null;
  paid_at: string;
  created_by: number | null;
}

export interface MonthlyExpenseItem {
  id: number;
  amount: number;
  description: string;
  date: string;
  created_by: number | null;
}

export interface CashBalance {
  center_id: number;
  center_name: string;
  balance: number;
}

export interface ReportOverview {
  total_students: number;
  students_with_group: number;
  students_without_group: number;
  total_income: number;
  total_expense: number;
  net: number;
  current_month_income: number;
  cash_balance: number;
}

export interface DailyListItem {
  date: string;
  total_income: number;
  income_count: number;
  total_expense: number;
  expense_count: number;
  net: number;
}

export const reportsApi = {
  getDaily: (date: string) =>
    api.get<DailyReport>('/reports/daily', { params: { date } }).then(r => r.data),

  getMonthly: (year: number, month: number) =>
    api.get<MonthlyReport>('/reports/monthly', { params: { year, month } }).then(r => r.data),

  getCashBalance: () =>
    api.get<CashBalance>('/reports/cash-balance').then(r => r.data),

  getOverview: () =>
    api.get<ReportOverview>('/reports/overview').then(r => r.data),

  getDailyList: () =>
    api.get<DailyListItem[]>('/reports/daily-list').then(r => r.data),
};
