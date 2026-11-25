'use client';

import { useEffect, useState } from 'react';
import { educationCentersApi } from '@/api/educationCentersApi';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';

export interface ShellAdmin {
  id?: number | string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  photo?: string | null;
  role?: string;
  center_id?: number | string;
  permissions?: Record<string, boolean> | null;
  center?: ShellCenter;
}

export interface ShellCenter {
  id?: number | string;
  name: string;
  logo?: string | null;
  balance?: number | string;
  tariff_id?: number | null;
  tariff?: { name?: string } | null;
  tariff_ends_at?: string | null;
  trial_ends_at?: string | null;
}

export interface TariffStatus {
  name: string;
  days: number;
  expired: boolean;
  tone: 'ok' | 'warn' | 'bad';
}

const centerCache: Record<string, ShellCenter> = {};

export function readAdmin(): ShellAdmin | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('admin');
    return raw ? (JSON.parse(raw) as ShellAdmin) : null;
  } catch {
    return null;
  }
}

export const photoUrl = (photo?: string | null) =>
  !photo ? null : photo.startsWith('data:') || photo.startsWith('http') ? photo : `${API_BASE}/uploads/${photo}`;

export const centerLogoUrl = (logo?: string | null) =>
  logo ? `${API_BASE}/uploads/centers/${logo}` : null;

export function initials(name?: string) {
  const parts = (name || 'Admin').trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'A';
}

export function roleLabel(role?: string) {
  if (role === 'director') return 'Direktor';
  if (role === 'super_admin') return 'Super admin';
  return 'Administrator';
}

export function tariffStatus(center: ShellCenter | null): TariffStatus | null {
  if (!center) return null;
  const endsAt = center.tariff_ends_at || center.trial_ends_at;
  if (!endsAt) return null;
  const days = Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000);
  const name = !center.tariff_id ? 'BETA' : center.tariff?.name || 'Tarif';
  return { name, days, expired: days <= 0, tone: days <= 0 ? 'bad' : days <= 5 ? 'warn' : 'ok' };
}

/** Admin + center for the shell, read once from localStorage, center fetched when only an id is stored. */
export function useShellData() {
  const [admin, setAdmin] = useState<ShellAdmin | null>(null);
  const [center, setCenter] = useState<ShellCenter | null>(null);

  useEffect(() => {
    const a = readAdmin();
    setAdmin(a);
    if (!a) return;
    if (a.center) {
      setCenter(a.center);
      return;
    }
    if (a.center_id) {
      const key = String(a.center_id);
      if (centerCache[key]) {
        setCenter(centerCache[key]);
        return;
      }
      educationCentersApi
        .getById(a.center_id as any)
        .then((c: any) => {
          if (c) {
            centerCache[key] = c;
            setCenter(c);
          }
        })
        .catch(() => {});
    }
  }, []);

  return { admin, setAdmin, center };
}
