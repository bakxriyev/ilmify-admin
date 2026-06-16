'use client';

import { useState, useEffect, useCallback } from 'react';
import { smsApi } from '@/api/smsApi';
import type { SmsLog, SmsTemplate, SmsStats, PaginatedResponse, SendResult, StudentBrief, TeacherBrief, GroupBrief } from '@/types/sms.types';

export function useSmsLogs(filters?: { start_date?: string; end_date?: string; status?: string; page?: number; limit?: number }) {
  const [data, setData] = useState<PaginatedResponse<SmsLog> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await smsApi.getLogs(filters);
      setData(result);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, refetch: load };
}

export function useSmsStats() {
  const [data, setData] = useState<SmsStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await smsApi.getStats();
      setData(result);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { data, loading, refetch: load };
}

export function useSmsTemplates() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await smsApi.getTemplates();
      setTemplates(result || []);
    } catch { setTemplates([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { templates, loading, refetch: load };
}

export function useStudentSearch() {
  const [students, setStudents] = useState<StudentBrief[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const search = useCallback(async (query: string, p = 1) => {
    setLoading(true);
    setPage(p);
    try {
      const res = await smsApi.searchStudents({ search: query, page: p, limit: 20 });
      setStudents(res.data || []);
      setTotal(res.total || 0);
    } catch { setStudents([]); setTotal(0); }
    finally { setLoading(false); }
  }, []);

  return { students, loading, total, page, search, setPage };
}

export function useTeacherSearch() {
  const [teachers, setTeachers] = useState<TeacherBrief[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const search = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await smsApi.searchTeachers({ search: query });
      setTeachers(res.data || []);
      setTotal(res.total || 0);
    } catch { setTeachers([]); setTotal(0); }
    finally { setLoading(false); }
  }, []);

  return { teachers, loading, total, search };
}

export function useAllStudents() {
  const [students, setStudents] = useState<StudentBrief[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (centerId: number) => {
    setLoading(true);
    try {
      const res = await smsApi.searchStudents({ page: 1, limit: 99999 });
      setStudents(res.data || []);
    } catch { setStudents([]); }
    finally { setLoading(false); }
  }, []);

  const filter = useCallback((query: string) => {
    if (!query) return students;
    const q = query.toLowerCase();
    return students.filter(s =>
      s.first_name.toLowerCase().includes(q) ||
      (s.last_name || '').toLowerCase().includes(q) ||
      s.phone_number.includes(q)
    );
  }, [students]);

  return { students, loading, load, filter };
}

export function useGroupList() {
  const [groups, setGroups] = useState<GroupBrief[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const res = await smsApi.listGroups({ search });
      setGroups(res || []);
    } catch { setGroups([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { groups, loading, load };
}

export function useSendSms() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  const send = async (data: { phone: string; message: string; from?: string }) => {
    setSending(true);
    try {
      const res = await smsApi.send(data);
      setResult({ total: 1, success: 1, failed: 0, logs: [res] });
      return { success: true, data: res };
    } catch (err: any) {
      setResult({ total: 1, success: 0, failed: 1, logs: [] });
      return { success: false, error: err.message };
    }
    finally { setSending(false); }
  };

  const sendBulk = async (data: { messages: Array<{ phone: string; message: string }> }) => {
    setSending(true);
    try {
      const res = await smsApi.sendBulk(data);
      setResult(res);
      return { success: true, data: res };
    } catch (err: any) {
      setResult({ total: data.messages.length, success: 0, failed: data.messages.length, logs: [] });
      return { success: false, error: err.message };
    }
    finally { setSending(false); }
  };

  const sendToStudent = async (data: { student_id: number; template_or_message: string; variables?: Record<string, string> }) => {
    setSending(true);
    try {
      const res = await smsApi.sendToStudent(data);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
    finally { setSending(false); }
  };

  const sendToAllStudents = async (data: { template_or_message: string; variables?: Record<string, string> }) => {
    setSending(true);
    try {
      const res = await smsApi.sendToAllStudents(data);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
    finally { setSending(false); }
  };

  const sendToTeacher = async (data: { teacher_id: number; message: string }) => {
    setSending(true);
    try {
      const res = await smsApi.sendToTeacher(data);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
    finally { setSending(false); }
  };

  const sendToAllTeachers = async (data: { message: string }) => {
    setSending(true);
    try {
      const res = await smsApi.sendToAllTeachers(data);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
    finally { setSending(false); }
  };

  const sendToGroup = async (data: { group_id: number; template_or_message: string; variables?: Record<string, string> }) => {
    setSending(true);
    try {
      const res = await smsApi.sendToGroup(data);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
    finally { setSending(false); }
  };

  return { send, sendBulk, sendToStudent, sendToAllStudents, sendToTeacher, sendToAllTeachers, sendToGroup, sending, result };
}

export function useOtpVerification(phone: string) {
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = async () => {
    setSending(true);
    setError('');
    try {
      await smsApi.sendOtp(phone);
      setOtpSent(true);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
    finally { setSending(false); }
  };

  const verifyOtp = async (code: string) => {
    setSending(true);
    setError('');
    try {
      const res = await smsApi.verifyOtp(phone, code);
      if (res.verified) {
        setVerified(true);
        return true;
      }
      setError(res.message);
      return false;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
    finally { setSending(false); }
  };

  const reset = () => {
    setOtpSent(false);
    setVerified(false);
    setError('');
  };

  return { otpSent, verified, sending, error, sendOtp, verifyOtp, reset };
}
