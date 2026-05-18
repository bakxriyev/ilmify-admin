import api from '@/lib/api';

export interface EducationCenter {
  id: number;
  name: string;
  location: string | null;
  phone: string | null;
  logo: string | null;
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  branches?: CenterBranch[];
  student_count?: number;
  teacher_count?: number;
  group_count?: number;
  admin_count?: number;
  tariff_id?: number | null;
  tariff?: TariffInfo | null;
  trial_ends_at?: string | null;
  tariff_started_at?: string | null;
  tariff_ends_at?: string | null;
  call_center_enabled?: boolean;
  features?: Record<string, boolean>;
}

export interface TariffInfo {
  id: number;
  name: string;
  student_min: number;
  student_max: number;
}

export interface CenterBranch {
  id: number;
  center_id: number;
  name: string;
  location: string | null;
  phone: string | null;
}

export interface CenterStats {
  total_centers: number;
  active_centers: number;
  total_balance: number;
  total_students: number;
  total_teachers: number;
  total_parents: number;
  total_groups: number;
  centers: Array<{
    id: number;
    name: string;
    students: number;
    teachers: number;
    groups: number;
    is_active: boolean;
    tariff?: { id: number; name: string } | null;
    trial_ends_at?: string | null;
    tariff_ends_at?: string | null;
  }>;
}

export interface CreateCenterRequest {
  name: string;
  location?: string;
  phone?: string;
  tariff_id?: number;
  admin?: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    password: string;
  };
}

export interface UpdateCenterRequest {
  name?: string;
  location?: string;
  phone?: string;
  is_active?: boolean;
  tariff_id?: number;
  call_center_enabled?: boolean;
  features?: Record<string, boolean>;
}

export const educationCentersApi = {
  getAll: () => api.get<EducationCenter[]>('/education-centers').then(r => r.data),
  getById: (id: number) => api.get<EducationCenter>(`/education-centers/${id}`).then(r => r.data),
  getStats: () => api.get<CenterStats>('/education-centers/stats').then(r => r.data),
  create: (data: CreateCenterRequest) => api.post<EducationCenter>('/education-centers', data).then(r => r.data),
  update: (id: number, data: UpdateCenterRequest) => api.patch<EducationCenter>(`/education-centers/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/education-centers/${id}`).then(r => r.data),
  addBranch: (centerId: number, data: { name: string; location?: string; phone?: string }) =>
    api.post<CenterBranch>(`/education-centers/${centerId}/branches`, data).then(r => r.data),
  getBranches: (centerId: number) =>
    api.get<CenterBranch[]>(`/education-centers/${centerId}/branches`).then(r => r.data),
  removeBranch: (branchId: number) =>
    api.delete(`/education-centers/branches/${branchId}`).then(r => r.data),
  getMyPublicToken: () =>
    api.get<{ token: string }>('/education-centers/my-public-token').then(r => r.data),
  uploadLogo: async (id: number, file: File) => {
    // Rasmni compress qilish (katta fayllarni server qabul qilmasligi mumkin)
    let uploadFile = file;
    if (file.type.startsWith('image/')) {
      try {
        const canvas = document.createElement('canvas');
        const img = new Image();
        const blob = await new Promise<Blob | null>((resolve) => {
          img.onload = () => {
            const MAX = 800;
            let { width, height } = img;
            if (width > MAX || height > MAX) {
              if (width > height) { height = (height / width) * MAX; width = MAX; }
              else { width = (width / height) * MAX; height = MAX; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(resolve, 'image/webp', 0.7);
          };
          img.onerror = () => resolve(null);
          img.src = URL.createObjectURL(file);
        });
        if (blob) uploadFile = new File([blob], 'logo.webp', { type: 'image/webp' });
      } catch { /* compress failed, use original */ }
    }
    const formData = new FormData();
    formData.append('logo', uploadFile);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';
    const res = await fetch(`${baseUrl}/education-centers/${id}/logo`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Xatolik yuz berdi' }));
      throw new Error(err.message || 'Fayl yuklanmadi');
    }
    return res.json() as Promise<EducationCenter>;
  },
};
