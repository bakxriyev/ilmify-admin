import api from '@/lib/api';

export interface SendNotificationData {
  title: string;
  description?: string;
  link?: string;
  image?: File;
  student_id?: number;
  teacher_id?: number;
  group_id?: number;
  group_ids?: number[];
  student_ids?: number[];
  teacher_ids?: number[];
  send_to_all_students?: boolean;
  send_to_all_teachers?: boolean;
  sender_type?: string;
  sender_id?: number;
  template_id?: number;
}

export interface TemplateData {
  name: string;
  title: string;
  description?: string;
  category?: string;
}

export const notificationApi = {
  send: (data: SendNotificationData) => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.link) formData.append('link', data.link);
    if (data.image) formData.append('image', data.image);
    if (data.student_id) formData.append('student_id', String(data.student_id));
    if (data.teacher_id) formData.append('teacher_id', String(data.teacher_id));
    if (data.group_id) formData.append('group_id', String(data.group_id));
    if (data.group_ids?.length) formData.append('group_ids', JSON.stringify(data.group_ids));
    if (data.student_ids?.length) formData.append('student_ids', JSON.stringify(data.student_ids));
    if (data.teacher_ids?.length) formData.append('teacher_ids', JSON.stringify(data.teacher_ids));
    if (data.send_to_all_students) formData.append('send_to_all_students', 'true');
    if (data.send_to_all_teachers) formData.append('send_to_all_teachers', 'true');
    if (data.sender_type) formData.append('sender_type', data.sender_type);
    if (data.sender_id) formData.append('sender_id', String(data.sender_id));
    if (data.template_id) formData.append('template_id', String(data.template_id));
    return api.post('/notifications/send', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  findAll: (page = 1, limit = 20) =>
    api.get(`/notifications?page=${page}&limit=${limit}`),

  findUser: (userId: number, role?: string, page = 1, limit = 20) => {
    let url = `/notifications/user/${userId}?page=${page}&limit=${limit}`;
    if (role) url += `&role=${role}`;
    return api.get(url);
  },

  unreadCount: (userId: number, role?: string) => {
    let url = `/notifications/unread/${userId}`;
    if (role) url += `?role=${role}`;
    return api.get(url);
  },

  markAsRead: (id: number) => api.patch(`/notifications/${id}/read`),

  markAllAsRead: (userId: number, role?: string) => {
    let url = `/notifications/read-all/${userId}`;
    if (role) url += `?role=${role}`;
    return api.patch(url);
  },

  remove: (id: number) => api.delete(`/notifications/${id}`),

  // Templates
  createTemplate: (data: TemplateData) => api.post('/notifications/templates', data),
  findAllTemplates: () => api.get('/notifications/templates/all'),
  updateTemplate: (id: number, data: Partial<TemplateData>) => api.patch(`/notifications/templates/${id}`, data),
  deleteTemplate: (id: number) => api.delete(`/notifications/templates/${id}`),
};
