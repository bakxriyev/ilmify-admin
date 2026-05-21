import api from '@/lib/api';

export const telegramBotApi = {
  getConfig: (centerId: number) =>
    api.get(`/telegram-bot/${centerId}/config`).then(r => r.data),

  updateConfig: (centerId: number, data: { bot_token?: string; is_active?: boolean }) =>
    api.put(`/telegram-bot/${centerId}/config`, data).then(r => r.data),

  getChats: (centerId: number, search?: string) =>
    api.get(`/telegram-bot/${centerId}/chats`, { params: { search } }).then(r => r.data),

  getInbox: (centerId: number, search?: string) =>
    api.get(`/telegram-bot/${centerId}/inbox`, { params: { search } }).then(r => r.data),

  sendReply: (centerId: number, chatId: number, text: string) =>
    api.post(`/telegram-bot/${centerId}/reply`, { chat_id: chatId, text }).then(r => r.data),

  getTemplates: (centerId: number) =>
    api.get(`/telegram-bot/${centerId}/templates`).then(r => r.data),

  createTemplate: (centerId: number, data: { name: string; content: string }) =>
    api.post(`/telegram-bot/${centerId}/templates`, data).then(r => r.data),

  updateTemplate: (id: number, data: { name?: string; content?: string }) =>
    api.put(`/telegram-bot/templates/${id}`, data).then(r => r.data),

  deleteTemplate: (id: number) =>
    api.delete(`/telegram-bot/templates/${id}`).then(r => r.data),

  getBroadcasts: (centerId: number) =>
    api.get(`/telegram-bot/${centerId}/broadcasts`).then(r => r.data),

  sendMessage: (centerId: number, data: {
    target_type: string;
    target_id?: number;
    text: string;
    template_id?: number;
  }) => api.post(`/telegram-bot/${centerId}/send`, data).then(r => r.data),

  // Bot auth endpoints (used by standalone bot)
  checkPhone: (centerId: number, phone: string) =>
    api.post(`/telegram-bot/${centerId}/check-phone`, { phone }).then(r => r.data),

  verifyPassword: (centerId: number, phone: string, password: string) =>
    api.post(`/telegram-bot/${centerId}/verify-password`, { phone, password }).then(r => r.data),

  linkStudent: (centerId: number, data: any) =>
    api.post(`/telegram-bot/${centerId}/link-student`, data).then(r => r.data),

  // Chat management
  deleteChat: (centerId: number, chatId: number) =>
    api.delete(`/telegram-bot/${centerId}/chats/${chatId}`).then(r => r.data),

  deleteAllChats: (centerId: number) =>
    api.delete(`/telegram-bot/${centerId}/chats`).then(r => r.data),
};

function getCenterId(): number | null {
  try {
    const admin = JSON.parse(localStorage.getItem('admin') || '{}');
    return admin.center_id || null;
  } catch { return null; }
}

export async function getCenterIdOrThrow(): Promise<number> {
  const id = getCenterId();
  if (!id) throw new Error('Markaz aniqlanmadi');
  return id;
}
