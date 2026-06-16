import api from '@/lib/api';

export const smsApi = {
  // ─── Asosiy ───
  send: (data: { phone: string; message: string; from?: string; center_id?: number }) =>
    api.post('/sms/send', data).then(r => r.data),

  sendBulk: (data: { messages: Array<{ phone: string; message: string; from?: string }>; center_id?: number }) =>
    api.post('/sms/send-bulk', data).then(r => r.data),

  getLogs: (params?: { start_date?: string; end_date?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/sms/logs', { params }).then(r => r.data),

  getStats: () =>
    api.get('/sms/stats').then(r => r.data),

  getStatus: (eskizMessageId: string) =>
    api.get(`/sms/status/${eskizMessageId}`).then(r => r.data),

  // ─── Markaz ma'lumoti ───
  getCenterInfo: () =>
    api.get('/sms/center-info').then(r => r.data),

  // ─── Student/Teacher tanlash ───
  searchStudents: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/sms/students', { params }).then(r => r.data),

  searchTeachers: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/sms/teachers', { params }).then(r => r.data),

  listGroups: (params?: { search?: string }) =>
    api.get('/sms/groups', { params }).then(r => r.data),

  // ─── Yangi jo'natish usullari ───
  sendToStudent: (data: { student_id: number; template_or_message: string; variables?: Record<string, string> }) =>
    api.post('/sms/send-to-student', data).then(r => r.data),

  sendToAllStudents: (data: { template_or_message: string; variables?: Record<string, string> }) =>
    api.post('/sms/send-to-all-students', data).then(r => r.data),

  sendToTeacher: (data: { teacher_id: number; message: string }) =>
    api.post('/sms/send-to-teacher', data).then(r => r.data),

  sendToAllTeachers: (data: { message: string }) =>
    api.post('/sms/send-to-all-teachers', data).then(r => r.data),

  sendToGroup: (data: { group_id: number; template_or_message: string; variables?: Record<string, string> }) =>
    api.post('/sms/send-to-group', data).then(r => r.data),

  sendToSelected: (data: { student_ids: number[]; template_or_message: string; variables?: Record<string, string> }) =>
    api.post('/sms/send-to-selected', data).then(r => r.data),

  sendCredentials: (data: { student_id: number; bot_link?: string }) =>
    api.post('/sms/send-credentials', data).then(r => r.data),

  // ─── Student qarzdorlik ma'lumoti ───
  getStudentDebt: (studentId: number) =>
    api.get(`/payments/debts/${studentId}`).then(r => r.data),

  // ─── OTP ───
  sendOtp: (phone: string) =>
    api.post('/sms/send-otp', { phone }).then(r => r.data),

  verifyOtp: (phone: string, code: string) =>
    api.post('/sms/verify-otp', { phone, code }).then(r => r.data),

  // ─── Shablonlar ───
  getTemplates: () =>
    api.get('/sms/templates').then(r => r.data),

  getCustomTemplates: () =>
    api.get('/sms/templates/custom').then(r => r.data),

  createTemplate: (data: { category: string; title: string; body: string; variables?: string[] }) =>
    api.post('/sms/templates', data).then(r => r.data),

  updateTemplate: (id: number, data: { category?: string; title?: string; body?: string; variables?: string[] }) =>
    api.post(`/sms/templates/${id}`, data).then(r => r.data),

  deleteTemplate: (id: number) =>
    api.post(`/sms/templates/${id}/delete`).then(r => r.data),

  testConnection: (email: string, password: string) =>
    api.post('/sms/test-connection', { email, password }).then(r => r.data),
};
