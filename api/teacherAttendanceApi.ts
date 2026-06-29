import api from '../lib/api';

export interface CenterLocation {
  id: number;
  center_id: number;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  radius: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  center?: {
    id: number;
    name: string;
    logo: string | null;
  };
}

export interface TeacherAttendanceRecord {
  id: number;
  teacher_id: number;
  location_id: number;
  center_id: number;
  check_in: string;
  check_out: string | null;
  check_in_latitude: number;
  check_in_longitude: number;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  distance: number;
  status: 'checked_in' | 'checked_out';
  date: string;
  selfie: string | null;
  teacher?: {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    photo: string | null;
  };
  location?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
  };
}

export interface UpdateCenterLocationRequest {
  name?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  radius?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const teacherAttendanceApi = {
  getCenterLocation: async (): Promise<CenterLocation> => {
    const response = await api.get('/teacher-attendance/center-location');
    return response.data;
  },

  updateCenterLocation: async (data: UpdateCenterLocationRequest): Promise<CenterLocation> => {
    const response = await api.patch('/teacher-attendance/center-location', data);
    return response.data;
  },

  getAllRecords: async (params?: {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
    teacher_id?: number;
    location_id?: number;
  }): Promise<PaginatedResponse<TeacherAttendanceRecord>> => {
    const response = await api.get('/teacher-attendance/records', { params });
    return response.data;
  },

  getRecordById: async (id: number): Promise<TeacherAttendanceRecord> => {
    const response = await api.get(`/teacher-attendance/records/${id}`);
    return response.data;
  },
};
