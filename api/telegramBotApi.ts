import api from '@/lib/api';

export type MessageContentType = 'text' | 'photo' | 'video' | 'voice' | 'document' | 'location' | 'sticker' | 'animation';

export interface MessageFile {
  file_id: string;
  file_unique_id?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  url?: string;
  thumb_url?: string;
  duration?: number;
  width?: number;
  height?: number;
}

export interface MessageLocation {
  latitude: number;
  longitude: number;
}

export interface MessageSticker {
  file_id: string;
  emoji?: string;
  url?: string;
  set_name?: string;
  width?: number;
  height?: number;
  is_animated?: boolean;
}

export interface ChatMessage {
  id: number;
  chat_id: number;
  message_id?: number;
  text?: string;
  content_type: MessageContentType;
  file?: MessageFile;
  location?: MessageLocation;
  sticker?: MessageSticker;
  caption?: string;
  is_from_admin: boolean;
  sent_at: string;
  read_at?: string;
}

export interface ChatUser {
  chat_id: number;
  user_id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
  student_name?: string;
  student_phone?: string;
  student_id?: number;
  photo_url?: string;
  is_active: boolean;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  last_message_type?: MessageContentType;
}

export const telegramBotApi = {
  getConfig: (centerId: number) =>
    api.get(`/telegram-bot/${centerId}/config`).then(r => r.data),

  updateConfig: (centerId: number, data: { bot_token?: string; is_active?: boolean }) =>
    api.put(`/telegram-bot/${centerId}/config`, data).then(r => r.data),

  getChats: (centerId: number, search?: string): Promise<ChatUser[]> =>
    api.get(`/telegram-bot/${centerId}/chats`, { params: { search } }).then(r => r.data),

  getInbox: (centerId: number, search?: string): Promise<any[]> =>
    api.get(`/telegram-bot/${centerId}/inbox`, { params: { search } }).then(r => r.data),

  getChatMessages: (centerId: number, chatId: number): Promise<ChatMessage[]> =>
    api.get(`/telegram-bot/${centerId}/chats/${chatId}/messages`).then(r => r.data),

  markChatAsRead: (centerId: number, chatId: number) =>
    api.post(`/telegram-bot/${centerId}/chats/${chatId}/read`).then(r => r.data),

  sendReply: (centerId: number, chatId: number, text: string) =>
    api.post(`/telegram-bot/${centerId}/reply`, { chat_id: chatId, text }).then(r => r.data),

  sendPhoto: (centerId: number, chatId: number, file: File, caption?: string) => {
    const fd = new FormData();
    fd.append('chat_id', String(chatId));
    fd.append('photo', file);
    if (caption) fd.append('caption', caption);
    return api.post(`/telegram-bot/${centerId}/send-photo`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  sendVideo: (centerId: number, chatId: number, file: File, caption?: string) => {
    const fd = new FormData();
    fd.append('chat_id', String(chatId));
    fd.append('video', file);
    if (caption) fd.append('caption', caption);
    return api.post(`/telegram-bot/${centerId}/send-video`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  sendDocument: (centerId: number, chatId: number, file: File, caption?: string) => {
    const fd = new FormData();
    fd.append('chat_id', String(chatId));
    fd.append('document', file);
    if (caption) fd.append('caption', caption);
    return api.post(`/telegram-bot/${centerId}/send-document`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  sendVoice: (centerId: number, chatId: number, file: File) => {
    const fd = new FormData();
    fd.append('chat_id', String(chatId));
    fd.append('voice', file);
    return api.post(`/telegram-bot/${centerId}/send-voice`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  sendLocation: (centerId: number, chatId: number, latitude: number, longitude: number) =>
    api.post(`/telegram-bot/${centerId}/send-location`, { chat_id: chatId, latitude, longitude }).then(r => r.data),

  sendSticker: (centerId: number, chatId: number, sticker: string) =>
    api.post(`/telegram-bot/${centerId}/send-sticker`, { chat_id: chatId, sticker }).then(r => r.data),

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

  checkPhone: (centerId: number, phone: string) =>
    api.post(`/telegram-bot/${centerId}/check-phone`, { phone }).then(r => r.data),

  verifyPassword: (centerId: number, phone: string, password: string) =>
    api.post(`/telegram-bot/${centerId}/verify-password`, { phone, password }).then(r => r.data),

  linkStudent: (centerId: number, data: any) =>
    api.post(`/telegram-bot/${centerId}/link-student`, data).then(r => r.data),

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
