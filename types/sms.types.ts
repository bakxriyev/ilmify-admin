export interface SmsLog {
  id: number;
  phone: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  eskiz_message_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_by: number | null;
  center_id: number | null;
  metadata: any;
  created_at: string;
}

export interface SmsTemplate {
  id: string;
  category: string;
  title: string;
  body: string;
  variables: string[];
}

export interface SmsTemplateModel {
  id: number;
  category: string;
  title: string;
  body: string;
  variables: string[];
  is_custom: boolean;
  center_id: number | null;
  created_at: string;
}

export interface SmsStats {
  total: number;
  today: number;
  month: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface SendResult {
  total: number;
  success: number;
  failed: number;
  logs: SmsLog[];
}
