import api from '../lib/api';

export interface PrinterAgent {
  id: number;
  agent_id: string;
  agent_token: string;
  center_id: number;
  branch_id: number | null;
  computer_name: string | null;
  windows_user: string | null;
  os_version: string | null;
  cpu_info: string | null;
  memory_info: string | null;
  local_ip: string | null;
  public_ip: string | null;
  status: 'online' | 'offline' | 'not_installed';
  agent_version: string | null;
  latest_version: string | null;
  update_available: boolean;
  installed_printers: string | null;
  connected_printer: string | null;
  printer_model: string | null;
  printer_status: any;
  last_heartbeat: string | null;
  last_connection: string | null;
  cpu_usage: number;
  memory_usage: number;
  enabled: boolean;
  paper_out: boolean;
  cover_open: boolean;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrinterJob {
  id: number;
  agent_id: number;
  payment_id: number | null;
  receipt_id: number | null;
  receipt_number: string | null;
  status: 'pending' | 'printing' | 'completed' | 'failed' | 'cancelled';
  amount: number | null;
  payload: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobListResponse {
  rows: PrinterJob[];
  count: number;
  page: number;
  totalPages: number;
}

export interface AgentStatusResponse {
  total: number;
  online: number;
  offline: number;
  agents: PrinterAgent[];
}

export const printerAgentApi = {
  register: (data: any) =>
    api.post('/printer-agent/agents/register', data).then(r => r.data),

  getAll: () =>
    api.get<PrinterAgent[]>('/printer-agent/agents').then(r => r.data),

  getOne: (id: number) =>
    api.get<PrinterAgent>(`/printer-agent/agents/${id}`).then(r => r.data),

  update: (id: number, data: any) =>
    api.patch<PrinterAgent>(`/printer-agent/agents/${id}`, data).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/printer-agent/agents/${id}`).then(r => r.data),

  getStatus: () =>
    api.get<AgentStatusResponse>('/printer-agent/status').then(r => r.data),

  createJob: (data: any) =>
    api.post<PrinterJob>('/printer-agent/jobs', data).then(r => r.data),

  getJobs: (params?: { agent_id?: number; status?: string; page?: number; limit?: number }) =>
    api.get<JobListResponse>('/printer-agent/jobs', { params }).then(r => r.data),

  retryJob: (id: number) =>
    api.post(`/printer-agent/jobs/${id}/retry`).then(r => r.data),

  cancelJob: (id: number) =>
    api.post(`/printer-agent/jobs/${id}/cancel`).then(r => r.data),

  restartAgent: (id: number) =>
    api.post(`/printer-agent/agents/${id}/restart`).then(r => r.data),

  reconnectAgent: (id: number) =>
    api.post(`/printer-agent/agents/${id}/reconnect`).then(r => r.data),

  updateAgent: (id: number) =>
    api.post(`/printer-agent/agents/${id}/update`).then(r => r.data),

  getLogs: (agent_id?: number) =>
    api.get('/printer-agent/logs', { params: { agent_id } }).then(r => r.data),

  getAgentLogs: (id: number) =>
    api.get(`/printer-agent/agents/${id}/logs`).then(r => r.data),

  testPrint: (agent_id: number) =>
    api.post('/printer-agent/test', { agent_id }).then(r => r.data),

  downloadUrl: () => {
    const base = (api as any).defaults?.baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return `${base}/printer-agent/download`;
  },
};
