import api from '../lib/api';

export interface MarkAttendanceDto {
  lesson_id: number;
  attendance: Array<{
    student_id: number;
    is_present: boolean;
    reason?: string;
  }>;
}

export interface GroupAttendanceRecord {
  id: number;
  group_id: number;
  student_id: number;
  lesson_id: number;
  date: string;
  is_present: boolean;
  reason?: string;
  student?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface AttendanceCell {
  is_present: boolean;
  reason?: string;
}

export interface MonthlyGridResponse {
  lessons: Array<{
    id: number;
    date: string;
    start_time: string;
    end_time: string;
  }>;
  attendance: Record<number, Record<number, AttendanceCell>>;
  student_join_dates: Record<number, string>;
}

export interface MonthlyStats {
  lessons: number;
  totalAttendance: number;
  present: number;
  absent: number;
  presentPercent: number;
  absentPercent: number;
}

export const attendanceApi = {
  markLesson: (dto: MarkAttendanceDto) =>
    api.post<any>('/attendances/lesson', dto).then(r => r.data),

  getGroupAttendance: (groupId: number, date: string) =>
    api.get<GroupAttendanceRecord[]>('/attendances/group', { params: { group_id: groupId, date } }).then(r => r.data),

  getStats: (groupId: number, year: number, month: number) =>
    api.get<MonthlyStats>('/attendances/stats', { params: { group_id: groupId, year, month } }).then(r => r.data),

  getMonthlyGrid: (groupId: number, year: number, month: number) =>
    api.get<MonthlyGridResponse>(`/attendances/group/${groupId}/monthly`, { params: { year, month } }).then(r => r.data),
};
