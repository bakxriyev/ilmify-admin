// api/tasksApi.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';

export interface Task {
  id: number;
  exercise_id: number;
  title: string | null;
  description: string | null;
  question_text: string | null;
  correct_answer: string | null;
  writing_q: string | null;
  ordinary_number: number;
  media: string | null;
  photo: string | null;
  audio: string | null;
  video: string | null;
  extra_data: any | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  exercise_id: number;
  title?: string;
  description?: string;
  question_text?: string;
  correct_answer?: string;
  writing_q?: string;
  ordinary_number?: number;
  extra_data?: string;
  // Fayllar alohida-alohida fieldlarda
  media?: File;
  photo?: File;
  audio?: File;
  video?: File;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  question_text?: string;
  correct_answer?: string;
  writing_q?: string;
  ordinary_number?: number;
  extra_data?: string;
  // Fayllar alohida-alohida
  media?: File;
  photo?: File;
  audio?: File;
  video?: File;
}

export interface TasksResponse {
  data: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const tasksApi = {
  // Task turlari (frontend uchun)
  getTaskTypes: () => [
    { value: 'multiple_choice', label: 'Multiple Choice', color: 'blue' },
    { value: 'fill_blank', label: 'Fill the Blank', color: 'green' },
    { value: 'matching', label: 'Matching', color: 'purple' },
    { value: 'speaking', label: 'Speaking', color: 'orange' },
    { value: 'writing', label: 'Writing', color: 'pink' },
  ],

  // Filterlar
  getTaskFilters: () => [
    { value: 'all', label: 'Barcha tasklar' },
    { value: 'with_audio', label: 'Audio bilan' },
    { value: 'with_video', label: 'Video bilan' },
    { value: 'with_photo', label: 'Rasm bilan' },
  ],

  // Barcha tasklarni olish
  async getAllTasks(exerciseId?: number, params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    sort_by?: 'id' | 'ordinary_number' | 'title';
    sort_order?: 'ASC' | 'DESC';
    include?: 'exercise' | 'student_answers';
  }): Promise<TasksResponse> {
    const queryParams = new URLSearchParams();
    
    if (exerciseId) queryParams.append('exercise_id', exerciseId.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.include) queryParams.append('include', params.include);

    const url = `${API_BASE_URL}/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Fetching tasks from:', url);

    const res = await fetch(url);
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to fetch tasks: ${error}`);
    }
    return res.json();
  },

  // Bitta taskni olish
  async getTaskById(id: number, include?: string): Promise<Task> {
    const url = `${API_BASE_URL}/tasks/${id}${include ? `?include=${include}` : ''}`;
    console.log('Fetching task from:', url);

    const res = await fetch(url);
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to fetch task: ${error}`);
    }
    return res.json();
  },

  // Yangi task yaratish
  async createTask(data: CreateTaskRequest): Promise<Task> {
    const formData = new FormData();
    
    // Asosiy maydonlar (SWAGGER'DAGI KELISHIGA MOS)
    formData.append('exercise_id', data.exercise_id.toString());
    
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.question_text) formData.append('question_text', data.question_text);
    if (data.correct_answer) formData.append('correct_answer', data.correct_answer);
    if (data.writing_q) formData.append('writing_q', data.writing_q);
    if (data.ordinary_number) formData.append('ordinary_number', data.ordinary_number.toString());
    if (data.extra_data) formData.append('extra_data', data.extra_data);

    // Fayllar alohida-alohida fieldlarda (SWAGGER'DA KO'RSATILGANDEK)
    if (data.media) formData.append('media', data.media);
    if (data.photo) formData.append('photo', data.photo);
    if (data.audio) formData.append('audio', data.audio);
    if (data.video) formData.append('video', data.video);

    // Debug uchun
    console.log('Creating task with FormData:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(key, `File: ${value.name} (${value.type})`);
      } else {
        console.log(key, value);
      }
    }

    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Create task error:', errorData);
      throw new Error(errorData.message || 'Failed to create task');
    }
    
    return res.json();
  },

  // Taskni yangilash
    async updateTask(id: number, formData: FormData): Promise<Task> {
    console.log('Updating task with FormData:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(key, `File: ${value.name}`);
      } else {
        console.log(key, value);
      }
    }

    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PATCH',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Update task error:', errorData);
      throw new Error(errorData.message || 'Failed to update task');
    }
    
    return res.json();
  },


  async deleteTask(id: number): Promise<{ message: string; id: number }> {
    console.log('Deleting task:', id);

    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Delete task error:', errorData);
      throw new Error(errorData.message || 'Failed to delete task');
    }
    
    return res.json();
  },
  // Exercise bo'yicha tasklarni olish
  async getTasksByExercise(exerciseId: number): Promise<Task[]> {
    const url = `${API_BASE_URL}/tasks/exercise/${exerciseId}`;
    console.log('Fetching tasks by exercise from:', url);

    const res = await fetch(url);
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to fetch tasks by exercise: ${error}`);
    }
    
    return res.json();
  },
};