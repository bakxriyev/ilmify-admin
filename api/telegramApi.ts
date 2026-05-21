import api from '../lib/api';

export interface TelegramSettings {
  id: number;
  bot_token: string;
  channel_usernames: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BotConfig {
  bot_token: string;
  channel_usernames: string[];
}

export const telegramApi = {
  getSettings: async (): Promise<TelegramSettings> => {
    const response = await api.get('/telegram-settings');
    return response.data;
  },

  updateSettings: async (data: { bot_token?: string; channel_usernames?: string; is_active?: boolean }): Promise<TelegramSettings> => {
    const response = await api.put('/telegram-settings', data);
    return response.data;
  },

  getBotConfig: async (): Promise<BotConfig> => {
    const response = await api.get('/telegram-settings/bot-config');
    return response.data;
  },
};
