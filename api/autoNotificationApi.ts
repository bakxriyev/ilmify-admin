import api from '../lib/api';

export const autoNotificationApi = {
  getConfig: (centerId: number) => api.get(`/auto-notification/${centerId}/config`),

  updateConfig: (centerId: number, data: any) => api.put(`/auto-notification/${centerId}/config`, data),

  getLogs: (centerId: number, page = 1, limit = 50) =>
    api.get(`/auto-notification/${centerId}/logs`, { params: { page, limit } }),

  getStats: (centerId: number) => api.get(`/auto-notification/${centerId}/stats`),

  triggerManual: (centerId: number) => api.post(`/auto-notification/${centerId}/trigger`),
};
