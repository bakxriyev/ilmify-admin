import api from '../lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';

export interface Course {
  id: number;
  center_id: number;
  name: string;
  created_at?: string;
}

export const coursesApi = {
  getAll: () => api.get<Course[]>('/courses').then(r => r.data),
  create: (data: { name: string }) =>
    api.post<Course>('/courses', data).then(r => r.data),
  update: (id: number, data: { name: string }) =>
    api.patch<Course>(`/courses/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/courses/${id}`).then(r => r.data),
  getByToken: (token: string): Promise<Course[]> =>
    fetch(`${API_BASE_URL}/courses/public/center/${encodeURIComponent(token)}`).then(r => {
      if (!r.ok) throw new Error('Kurslar topilmadi');
      return r.json();
    }),
};