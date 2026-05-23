import api from '@/lib/api';

export const smsApi = {
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

  sendOtp: (phone: string) =>
    api.post('/sms/send-otp', { phone }).then(r => r.data),

  verifyOtp: (phone: string, code: string) =>
    api.post('/sms/verify-otp', { phone, code }).then(r => r.data),

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
