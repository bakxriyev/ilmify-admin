import api from '../lib/api';

export interface AuditLog {
  id: number;
  admin_id: number;
  admin_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  details: any;
  description: string;
  center_id: number;
  created_at: string;
}

export interface AuditLogResponse {
  data: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const auditApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    action?: string;
    entity_type?: string;
    admin_name?: string;
    search?: string;
    from_date?: string;
    to_date?: string;
    sort_order?: 'asc' | 'desc';
  }) =>
    api.get<AuditLogResponse>('/audit', { params }).then(r => r.data),

  getActions: () =>
    api.get<string[]>('/audit/actions').then(r => r.data),

  getEntityTypes: () =>
    api.get<string[]>('/audit/entity-types').then(r => r.data),
};
