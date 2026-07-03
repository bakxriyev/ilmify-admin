import api from '../lib/api';

export interface Receipt {
  id: number;
  receipt_number: string;
  payment_id: number;
  amount: number;
  discount: number;
  penalty: number;
  total: number;
  status: 'pending' | 'printed' | 'failed' | 'reprinted' | 'cancelled';
  printer_id: number | null;
  printer_ip: string | null;
  error_message: string | null;
  center_id: number;
  printed_by: number | null;
  client_ip: string | null;
  print_attempts: number;
  created_at: string;
  printed_at: string | null;
  payment?: any;
}

export interface ReceiptTemplate {
  id: number;
  name: string;
  center_id: number;
  is_default: boolean;
  font_size: number;
  bold: boolean;
  align: string;
  line_width: number;
  divider_char: string;
  show_logo: boolean;
  show_header: boolean;
  show_footer: boolean;
  show_qr_telegram: boolean;
  show_qr_website: boolean;
  show_qr_instagram: boolean;
  show_qr_verify: boolean;
  show_phones: boolean;
  show_social: boolean;
  show_thank_you: boolean;
  custom_header: string | null;
  custom_footer: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReceiptListResponse {
  rows: Receipt[];
  count: number;
  page: number;
  totalPages: number;
}

export const receiptApi = {
  print: (data: { payment_id: number; printer_id?: number; template_id?: number; discount?: number; penalty?: number; months?: number[] }) =>
    api.post<Receipt>('/receipt/print', data).then(r => r.data),

  reprint: (data: { receipt_id: number; printer_id?: number }) =>
    api.post<Receipt>('/receipt/reprint', data).then(r => r.data),

  getAll: (page = 1, limit = 20) =>
    api.get<ReceiptListResponse>('/receipt', { params: { page, limit } }).then(r => r.data),

  getOne: (id: number) =>
    api.get<Receipt>(`/receipt/${id}`).then(r => r.data),

  // Templates
  getTemplates: () =>
    api.get<ReceiptTemplate[]>('/receipt/templates').then(r => r.data),

  createTemplate: (data: Partial<ReceiptTemplate>) =>
    api.post<ReceiptTemplate>('/receipt/templates', data).then(r => r.data),

  updateTemplate: (id: number, data: Partial<ReceiptTemplate>) =>
    api.patch<ReceiptTemplate>(`/receipt/templates/${id}`, data).then(r => r.data),

  deleteTemplate: (id: number) =>
    api.delete(`/receipt/templates/${id}`).then(r => r.data),
};
