// api/adminApi.ts
import api from '../lib/api';

export interface CenterInfo {
  id: number;
  name: string;
  logo: string | null;
  location?: string;
  phone?: string;
  is_active?: boolean;
  balance?: number;
}

export interface Admin {
  id: string;
  full_name: string;
  email?: string | null;
  photo?: string | null;
  phone_number: string;
  role?: 'super_admin' | 'director' | 'admin';
  center_id?: number;
  center?: CenterInfo | null;
  permissions?: Record<string, boolean> | null;
}

export interface LoginRequest {
  phone_number: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  admin: Admin;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  email?: string;
  phone_number?: string;
  photo?: string;
}

export const adminApi = {
  /**
   * Admin login
   * Endpoint: POST /admin/login/phone
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      console.log('Sending login request to:', '/admin/login/phone');
      console.log('Login data:', { 
        phone_number: data.phone_number, 
        password: '***' 
      });
      
      const response = await api.post('/admin/login/phone', data);
      
      console.log('Login response received:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('Login API error:', error);
      
      // Error handling
      if (error.response) {
        // Serverdan kelgan xatolik
        const status = error.response.status;
        const errorData = error.response.data;
        
        let errorMessage = errorData.message || errorData.error || 'Login failed';
        
        if (status === 401) {
          errorMessage = 'Invalid phone number or password';
        } else if (status === 400) {
          errorMessage = errorData.message || 'Invalid request data';
        } else if (status === 404) {
          errorMessage = 'Admin not found';
        } else if (status === 422) {
          errorMessage = 'Validation error. Please check your input';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later';
        }
        
        throw new Error(errorMessage);
      } else if (error.request) {
        // So'rov yuborildi, ammo javob kelmadi
        throw new Error('Network error. Please check your internet connection');
      } else {
        // So'rovni tayyorlashda xatolik
        throw new Error(error.message || 'Login request failed');
      }
    }
  },

  /**
   * Admin logout
   * Endpoint: POST /admin/logout/{adminId}
   */
  logout: async (adminId: string): Promise<{ message: string }> => {
    try {
      console.log('Logging out admin:', adminId);
      const response = await api.post(`/admin/logout/${adminId}`);
      
      // LocalStorage dan tokenlarni o'chirish
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('admin');
        sessionStorage.removeItem('admin');
      }
      
      console.log('Logout successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Logout API error:', error);
      
      // Har holda local storageni tozalash
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('admin');
        sessionStorage.removeItem('admin');
      }
      
      // Agar serverga ulanib bo'lmasa ham, logout qilish
      return { message: 'Logged out locally' };
    }
  },

  /**
   * Admin ma'lumotlarini olish
   * Endpoint: GET /admin/profile
   */
  getProfile: async (): Promise<Admin> => {
    try {
      const response = await api.get('/admin/profile');
      return response.data;
    } catch (error: any) {
      console.error('Get profile API error:', error);
      throw error;
    }
  },

  /**
   * Admin ma'lumotlarini yangilash
   * Endpoint: PATCH /admin/{id}
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<Admin> => {
    try {
      const adminRaw = localStorage.getItem('admin');
      const adminId = adminRaw ? JSON.parse(adminRaw).id : null;
      if (!adminId) throw new Error('Admin ID topilmadi');
      const response = await api.patch(`/admin/${adminId}`, data);
      
      // Yangilangan ma'lumotlarni localStorage ga saqlash
      if (typeof window !== 'undefined') {
        const currentAdmin = JSON.parse(localStorage.getItem('admin') || '{}');
        const updatedAdmin = { ...currentAdmin, ...response.data };
        localStorage.setItem('admin', JSON.stringify(updatedAdmin));
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Update profile API error:', error);
      throw error;
    }
  },

  /**
   * Admin rasmini yuklash (multipart)
   * Endpoint: POST /admin/{id}/photo
   */
  uploadPhoto: async (file: File): Promise<Admin> => {
    try {
      const adminRaw = localStorage.getItem('admin');
      const adminId = adminRaw ? JSON.parse(adminRaw).id : null;
      if (!adminId) throw new Error('Admin ID topilmadi');
      const formData = new FormData();
      formData.append('photo', file);
      const response = await api.post(`/admin/${adminId}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error: any) {
      console.error('Upload photo API error:', error);
      throw error;
    }
  },

  /**
   * Parolni o'zgartirish
   * Endpoint: PATCH /admin/{id}/change-password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    try {
      const adminRaw = localStorage.getItem('admin');
      const adminId = adminRaw ? JSON.parse(adminRaw).id : null;
      if (!adminId) throw new Error('Admin ID topilmadi');
      const response = await api.patch(`/admin/${adminId}/change-password`, data);
      return response.data;
    } catch (error: any) {
      console.error('Change password API error:', error);
      throw error;
    }
  },

  /**
   * Token yangilash
   * Endpoint: POST /admin/refresh-token
   */
  refreshToken: async (refreshToken: string): Promise<{ access_token: string; refresh_token: string }> => {
    try {
      const response = await api.post('/admin/refresh-token', { 
        refresh_token: refreshToken 
      });
      return response.data;
    } catch (error: any) {
      console.error('Refresh token API error:', error);
      throw error;
    }
  },

  /**
   * Adminlar ro'yxati (faqat super admin uchun)
   * Endpoint: GET /admin
   */
  getAllAdmins: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: Admin[]; total: number }> => {
    try {
      const response = await api.get('/admin', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get all admins API error:', error);
      throw error;
    }
  },

  /**
   * Admin yaratish (faqat super admin uchun)
   * Endpoint: POST /admin
   */
  createAdmin: async (data: {
    full_name: string;
    phone_number: string;
    email?: string;
    password: string;
  }): Promise<Admin> => {
    try {
      const response = await api.post('/admin', data);
      return response.data;
    } catch (error: any) {
      console.error('Create admin API error:', error);
      throw error;
    }
  },

  /**
   * Adminni o'chirish (faqat super admin uchun)
   * Endpoint: DELETE /admin/{id}
   */
  deleteAdmin: async (adminId: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/admin/${adminId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete admin API error:', error);
      throw error;
    }
  },

  /**
   * Admin statistikasini olish
   * Endpoint: GET /admin/stats
   */
  getStats: async (): Promise<any> => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error: any) {
      console.error('Get admin stats API error:', error);
      throw error;
    }
  },

  // ========== DIRECTOR ENDPOINTS ==========

  /**
   * Director o'z markazidagi adminlar ro'yxati
   * GET /admin/directors/admins
   */
  getCenterAdmins: async (): Promise<Admin[]> => {
    const res = await api.get('/admin/directors/admins');
    return res.data;
  },

  /**
   * Director yangi admin yaratadi
   * POST /admin/directors/admins
   */
  createCenterAdmin: async (data: {
    full_name: string;
    phone_number: string;
    email: string;
    password: string;
  }): Promise<Admin> => {
    const res = await api.post('/admin/directors/admins', data);
    return res.data;
  },

  /**
   * Director admin ruxsatlarini yangilaydi
   * PATCH /admin/directors/admins/:id/permissions
   */
  updateAdminPermissions: async (id: string, permissions: Record<string, boolean>): Promise<Admin> => {
    const res = await api.patch(`/admin/directors/admins/${id}/permissions`, { permissions });
    return res.data;
  },

  /**
   * Director adminni yangilaydi
   * PATCH /admin/directors/admins/:id
   */
  updateCenterAdmin: async (id: string, data: {
    full_name?: string;
    phone_number?: string;
    email?: string;
    password?: string;
  }): Promise<Admin> => {
    const res = await api.patch(`/admin/directors/admins/${id}`, data);
    return res.data;
  },

  /**
   * Director adminni o'chiradi
   * DELETE /admin/directors/admins/:id
   */
  deleteCenterAdmin: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete(`/admin/directors/admins/${id}`);
    return res.data;
  },

  /**
   * Barcha mavjud ruxsatlar ro'yxati
   * GET /admin/directors/permissions-list
   */
  getPermissionsList: async (): Promise<{ key: string; label: string }[]> => {
    const res = await api.get('/admin/directors/permissions-list');
    return res.data;
  },
};