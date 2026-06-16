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
  recipient_type: string | null;
  recipient_id: number | null;
  recipient_name: string | null;
  template_category: string | null;
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

export interface StudentBrief {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  group_name?: string;
  group_id?: number;
}

export interface TeacherBrief {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export interface GroupBrief {
  id: number;
  name: string;
  student_count?: number;
}

export type RecipientType = 
  | 'single_student'
  | 'all_students'
  | 'single_teacher'
  | 'all_teachers'
  | 'group_students'
  | 'selected_students';

export const RECIPIENT_LABELS: Record<RecipientType, string> = {
  single_student: 'Bitta student',
  all_students: 'Barcha studentlar',
  single_teacher: "Bitta o'qituvchi",
  all_teachers: "Barcha o'qituvchilar",
  group_students: 'Guruh studentlari',
  selected_students: 'Tanlangan studentlar',
};
