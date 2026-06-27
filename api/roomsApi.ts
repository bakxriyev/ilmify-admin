import api from '../lib/api';

export interface Room {
  id: string;
  name: string;
  capacity: number;
  groups_count: number;
  occupied_seats: number;
  available_seats: number;
  groups?: RoomGroup[];
  lessons?: RoomLesson[];
}

export interface RoomGroup {
  id: string;
  name: string;
  student_count: number;
  trial_count?: number;
  available_seats: number;
  lessons_count?: number;
  next_lesson_date?: string | null;
  next_lesson_time?: string | null;
  next_lesson_end_time?: string | null;
  lesson_times?: string[];
  lessons?: RoomLesson[];
}

export interface RoomLesson {
  id: string;
  group_id: string;
  room_id: string;
  date: string;
  time: string;
  start_time: string;
  end_time: string;
  parity: 'odd' | 'even' | 'everyday';
}

export interface CreateRoomRequest {
  name: string;
  capacity: number;
}

export interface UpdateRoomRequest {
  name?: string;
  capacity?: number;
}

export interface GetAllRoomsParams {
  search?: string;
}

export interface RoomsResponse {
  data: Room[];
}

export const roomsApi = {
  getAll: async (params?: GetAllRoomsParams): Promise<RoomsResponse> => {
    try {
      const response = await api.get('/rooms', { params });
      if (Array.isArray(response.data)) {
        return { data: response.data };
      }
      if (response.data?.data && Array.isArray(response.data.data)) {
        return { data: response.data.data };
      }
      return { data: [] };
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Room> => {
    try {
      const response = await api.get(`/rooms/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching room ${id}:`, error);
      throw error;
    }
  },

  create: async (data: CreateRoomRequest): Promise<Room> => {
    try {
      const response = await api.post('/rooms', data);
      return response.data;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  },

  update: async (id: string, data: UpdateRoomRequest): Promise<Room> => {
    try {
      const response = await api.patch(`/rooms/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating room ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/rooms/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting room ${id}:`, error);
      throw error;
    }
  },
};
