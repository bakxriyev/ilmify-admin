import api from '../lib/api';

// -------------------- Backend Response Types --------------------
export interface Exercise {
  id: string;
  unit_id: string;
  name: string;
  description: string;
  number: number;
  type: 'reading' | 'gap_fill' | 'speaking' | 'writing' | 'listening' | 'test' | 'vocabulary' | 'grammar' | 'summary_c' | 'summary_d' | 'summary_ing' | 'summary_choice' | 'summary_no' | 'summary_writing';
  qText: string;
  audio_url?: string;
  video_url?: string;
  image_url?: string;
  tasks?: any[];
  exercise_results?: any[];
  redo_incorrect_tasks?: any[];
  tasks_count?: number;
  results_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// -------------------- Request Types --------------------
export interface CreateExerciseRequest {
  unit_id: number;
  name: string;
  description?: string;
  number: number;
  type: Exercise['type'];
  qText: string;
  audio_url?: string;
  video_url?: string;
  image_url?: string;
}

export interface UpdateExerciseRequest {
  unit_id?: number;
  name?: string;
  description?: string;
  number?: number;
  type?: Exercise['type'];
  qText?: string;
  audio_url?: string;
  video_url?: string;
  image_url?: string;
}

// -------------------- Filter Types --------------------
export interface ExerciseFilter {
  unit_id?: number;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
  // include_relations har doim true – parametr sifatida yuboriladi
}

// -------------------- API Client --------------------
export const exercisesApi = {
  /**
   * Yangi mashq yaratish
   * POST /exercises
   */
  createExercise: async (data: CreateExerciseRequest): Promise<Exercise> => {
    try {
      const response = await api.post('/exercises', data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create exercise';
      throw new Error(errorMessage);
    }
  },

  /**
   * Barcha mashqlarni olish (pagination, filter)
   * GET /exercises?page=1&limit=10&include_relations=true&search=...
   * SORT ISHLATILMAYDI
   */
  getAllExercises: async (params?: ExerciseFilter): Promise<PaginatedResponse<Exercise>> => {
    try {
      const cleanParams: Record<string, any> = {
        include_relations: 'true', // ✅ har doim string 'true'
      };

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'page' || key === 'limit' || key === 'unit_id') {
              cleanParams[key] = Number(value);
            } else {
              cleanParams[key] = value;
            }
          }
        });
      }

      const response = await api.get('/exercises', { params: cleanParams });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch exercises';
      throw new Error(errorMessage);
    }
  },

  /**
   * Bitta mashqni olish
   * GET /exercises/{id}
   */
  getExerciseById: async (id: string): Promise<Exercise> => {
    try {
      const response = await api.get(`/exercises/${id}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch exercise';
      throw new Error(errorMessage);
    }
  },

  /**
   * Mashqni yangilash
   * PATCH /exercises/{id}
   */
  updateExercise: async (id: string, data: UpdateExerciseRequest): Promise<Exercise> => {
    try {
      const response = await api.patch(`/exercises/${id}`, data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update exercise';
      throw new Error(errorMessage);
    }
  },

  /**
   * Mashqni o‘chirish
   * DELETE /exercises/{id}
   */
  deleteExercise: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/exercises/${id}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete exercise';
      throw new Error(errorMessage);
    }
  },

  /**
   * Unit bo‘yicha mashqlar ro‘yxati
   * GET /exercises/unit/{unitId}
   */
  getExercisesByUnitId: async (unitId: number): Promise<Exercise[]> => {
    try {
      const response = await api.get(`/exercises/unit/${unitId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch exercises';
      throw new Error(errorMessage);
    }
  },

  /**
   * Exercise typelar ro‘yxati (faqat frontend uchun)
   */
  getExerciseTypes: () => {
    return [
      { value: 'reading', label: 'Reading', color: 'blue', icon: 'BookOpenIcon' },
      { value: 'listening', label: 'Listening', color: 'green', icon: 'SpeakerWaveIcon' },
      { value: 'writing', label: 'Writing', color: 'yellow', icon: 'PencilIcon' },
      { value: 'speaking', label: 'Speaking', color: 'purple', icon: 'MicrophoneIcon' },
      { value: 'grammar', label: 'Grammar', color: 'red', icon: 'AcademicCapIcon' },
      { value: 'vocabulary', label: 'Vocabulary', color: 'indigo', icon: 'LanguageIcon' },
    ];
  },
};