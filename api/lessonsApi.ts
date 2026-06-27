import api from '@/lib/api';

export interface Lesson {
  id: string;           // e.g., "484"
  group_id: string;     // e.g., "19"
  date: string;         // ISO string: "1111-11-13T00:00:00.000Z"
  time: string;         // "11:11:00"
  parity: 'odd' | 'even' | 'everyday' | null;
  weekdays?: 'mon-fri' | 'mon-sat' | null;
  // Optional fields if your backend adds them later
  topic?: string;
  homework?: string;
}

export interface CreateLessonRequest {
  group_id: string;
  date: string;         // Format: YYYY-MM-DD (will be sent as is)
  time: string;         // Format: HH:mm (backend expects HH:mm:ss, we'll append ':00')
  parity?: 'odd' | 'even' | 'everyday' | null;
  weekdays?: 'mon-fri' | 'mon-sat' | null;
  // If your backend supports topic/homework, add them
  topic?: string;
  homework?: string;
}

export const lessonsApi = {
  /**
   * Get all lessons for a specific group
   * GET /lessons/group/{groupId}
   */
  getByGroup: async (groupId: string): Promise<Lesson[]> => {
    try {
      const response = await api.get(`/lessons/group/${groupId}`);
      // The API returns an array directly (as shown in Swagger)
      return response.data;
    } catch (error) {
      console.error(`Error fetching lessons for group ${groupId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new lesson
   * POST /lessons
   */
  create: async (data: CreateLessonRequest): Promise<Lesson> => {
    try {
      // Ensure time is in HH:mm:ss format
      const payload = {
        ...data,
        time: data.time.includes(':') && data.time.split(':').length === 2
          ? `${data.time}:00`   // add seconds if only HH:mm given
          : data.time,
      };
      const response = await api.post('/lessons', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  },

  /**
   * Delete a lesson by ID
   * DELETE /lessons/{lessonId}
   */
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/lessons/${id}`);
    } catch (error) {
      console.error(`Error deleting lesson ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete ALL lessons for a group
   * DELETE /lessons/group/{groupId}
   */
  deleteAllByGroup: async (groupId: number): Promise<{ message: string; deleted_count: number }> => {
    try {
      const response = await api.delete(`/lessons/group/${groupId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting all lessons for group ${groupId}:`, error);
      throw error;
    }
  },
};