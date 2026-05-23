'use client';

import { useState, useEffect, useCallback } from 'react';
import { smsApi } from '@/api/smsApi';
import type { SmsLog, SmsTemplate, SmsStats, PaginatedResponse, SendResult } from '@/types/sms.types';

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

  return { send, sendBulk, sending, result };
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
