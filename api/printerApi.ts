import api from '../lib/api';

export interface Printer {
  id: number;
  name: string;
  model: string;
  connection_type: 'usb' | 'lan';
  ip_address: string | null;
  port: number;
  usb_device_name: string | null;
  center_id: number;
  is_default: boolean;
  enabled: boolean;
  auto_cut: boolean;
  cash_drawer: boolean;
  receipt_width: number;
  qr_size: number;
  auto_print: boolean;
  last_connected_at: string | null;
  created_at: string;
  updated_at: string;
}

export const printerApi = {
  getAll: () =>
    api.get<Printer[]>('/printer').then(r => r.data),

  getOne: (id: number) =>
    api.get<Printer>(`/printer/${id}`).then(r => r.data),

  create: (data: Partial<Printer>) =>
    api.post<Printer>('/printer', data).then(r => r.data),

  update: (id: number, data: Partial<Printer>) =>
    api.patch<Printer>(`/printer/${id}`, data).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/printer/${id}`).then(r => r.data),

  test: (printer_id: number) =>
    api.post<{ success: boolean; message: string }>('/printer/test', { printer_id }).then(r => r.data),
};
