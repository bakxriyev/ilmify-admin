import api from '../lib/api';

export interface AcademySettings {
  id: number;
  center_id: number;
  academy_name: string | null;
  logo: string | null;
  address: string | null;
  phone1: string | null;
  phone2: string | null;
  phone3: string | null;
  email: string | null;
  website: string | null;
  telegram_bot_link: string | null;
  telegram_channel: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  tiktok: string | null;
  google_maps: string | null;
  working_hours: string | null;
  footer_text: string | null;
  receipt_header: string | null;
  receipt_footer: string | null;
  receipt_note: string | null;
  receipt_thank_you_text: string | null;
  created_at: string;
  updated_at: string;
}

export const academySettingsApi = {
  get: () =>
    api.get<AcademySettings>('/academy-settings').then(r => r.data),

  update: (data: Partial<AcademySettings>) =>
    api.put<AcademySettings>('/academy-settings', data).then(r => r.data),
};
