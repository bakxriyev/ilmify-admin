import api from '../lib/api';

export interface TeacherCommission {
  id: number;
  teacher_id: number;
  percentage: number;
  center_id: number | null;
  created_at: string;
  updated_at: string;
  teacher?: {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    teacher_type: string;
  };
}

export interface StudentSalaryInfo {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  paid: boolean;
}

export interface GroupSalaryInfo {
  group_id: number;
  group_name: string;
  monthly_price: number;
  total: number;
  expected: number;
  total_students: number;
  paid_students: number;
  unpaid_students: number;
  students: StudentSalaryInfo[];
}

export interface TeacherSalary {
  teacher_id: number;
  teacher_name: string;
  phone_number: string;
  teacher_type: string;
  percentage: number;
  total_payments: number;
  total_expected: number;
  salary: number;
  total_students: number;
  total_groups: number;
  paid_students: number;
  unpaid_students: number;
  groups: GroupSalaryInfo[];
}

export const teacherCommissionsApi = {
  getAll: () =>
    api.get<TeacherCommission[]>('/teacher-commissions').then(r => r.data),

  getSalaries: (month: number, year: number) =>
    api.get<TeacherSalary[]>('/teacher-commissions/salaries', { params: { month, year } }).then(r => r.data),

  create: (data: { teacher_id: number; percentage: number }) =>
    api.post<TeacherCommission>('/teacher-commissions', data).then(r => r.data),

  update: (id: number, data: { percentage?: number }) =>
    api.patch<TeacherCommission>(`/teacher-commissions/${id}`, data).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/teacher-commissions/${id}`),
};
