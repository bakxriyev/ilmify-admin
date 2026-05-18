import api from '../lib/api';

export interface DashboardStats {
  total_students: number;
  total_teachers: number;
  total_groups: number;
  total_levels: number;
  total_rooms: number;
  total_lessons: number;
  attendance_rate: number;
  students_this_month: number;
  groups_with_lessons: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string | string[];
  }>;
}

export interface TeacherStats {
  id: number;
  first_name: string;
  last_name: string;
  gmail: string;
  total_groups: number;
  main_groups?: number;
  support_groups?: number;
  total_students?: number;
}

export interface StudentAttendance {
  id: number;
  first_name: string;
  last_name: string;
  group_name: string;
  total_attendance: number;
  present: number;
  absent: number;
  attendance_rate: number;
}

export interface Activity {
  type: string;
  message: string;
  time: string;
  icon: string;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getStudentGrowth: async (period: 'week' | 'month' | 'year' = 'month'): Promise<ChartData> => {
    const response = await api.get('/dashboard/student-growth', { params: { period } });
    return response.data;
  },

  getGroupDistribution: async (): Promise<ChartData> => {
    const response = await api.get('/dashboard/group-distribution');
    return response.data;
  },

  getTopTeachersByGroups: async (limit = 5): Promise<TeacherStats[]> => {
    const response = await api.get('/dashboard/top-teachers-by-groups', { params: { limit } });
    return response.data;
  },

  getTopTeachersByStudents: async (limit = 5): Promise<TeacherStats[]> => {
    const response = await api.get('/dashboard/top-teachers-by-students', { params: { limit } });
    return response.data;
  },

  getBestAttendance: async (limit = 10): Promise<StudentAttendance[]> => {
    const response = await api.get('/dashboard/best-attendance', { params: { limit } });
    return response.data;
  },

  getMonthlyAttendance: async (): Promise<ChartData> => {
    const response = await api.get('/dashboard/monthly-attendance');
    return response.data;
  },

  getRecentActivities: async (limit = 10): Promise<Activity[]> => {
    const response = await api.get('/dashboard/recent-activities', { params: { limit } });
    return response.data;
  },
};
