'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Phone, Lock, AlertCircle, Eye, EyeOff,
  CheckCircle, Shield, Mail, MessageCircle, Ban,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/adminApi';

/* ─────────────── Ilmify Edu SVG Logo ─────────────── */
const IlmifyLogo = ({ size = 48 }: { size?: number }) => (
  <img src="./logo.jpg" alt="ILMIFY LOGO" />
);

/* ─────────────────────────────────────────────────── */

export default function LoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* ── Mount — localStorage tozalash → sidebar/header bo'lmasligi uchun ── */
  useEffect(() => {
    ['access_token', 'refresh_token', 'admin', 'teacher'].forEach(k => localStorage.removeItem(k));
    setMounted(true);
    return () => setMounted(false);
  }, []);

  /* ── Video loop ── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = 0.85;
    v.play().catch(() => {/* autoplay blocked: silently ignore */});
  }, []);

  /* ── Auth check ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (token && localStorage.getItem('admin')) router.push('/dashboard');
    else if (token && localStorage.getItem('teacher')) router.push('/teachers');
  }, [router]);

  /* ── Remember phone ── */
  useEffect(() => {
    const saved = localStorage.getItem('rememberedPhone');
    if (saved) { setPhone(saved); setRememberMe(true); }
  }, []);

  /* ── Enter key ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !loading) handleLogin(e as any);
    };
    window.addEventListener('keypress', onKey);
    return () => window.removeEventListener('keypress', onKey);
  }, [loading, phone, password]);

  /* ── Phone formatting ── */
  const formatPhone = (input: string): string => {
    let d = input.replace(/\D/g, '');
    if (d.startsWith('998')) d = d.slice(3);
    d = d.slice(0, 9);
    if (d.length > 5) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
    if (d.length > 2) return `${d.slice(0, 2)} ${d.slice(2)}`;
    return d;
  };

  const preparePhone = (input: string): string => {
    const d = input.replace(/\D/g, '');
    if (d.length === 9) return `+998${d}`;
    if (d.length === 12 && d.startsWith('998')) return `+${d}`;
    if (input.startsWith('+998')) return input;
    return `+998${d.slice(-9)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
    setError(null);
  };

  /* ── Login ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { setError("Iltimos, telefon raqamini kiriting"); return; }
    if (!password.trim()) { setError("Iltimos, parolni kiriting"); return; }
    if (phone.replace(/\D/g, '').length < 9) { setError("Telefon raqami noto'g'ri formatda"); return; }

    try {
      setLoading(true);
      setError(null);

      const response = await adminApi.login({
        phone_number: preparePhone(phone),
        password,
      });

      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('admin', JSON.stringify(response.admin));
      localStorage.removeItem('teacher');

      if (rememberMe) localStorage.setItem('rememberedPhone', phone);
      else localStorage.removeItem('rememberedPhone');

      toast.success("Xush kelibsiz!", { duration: 2000, position: 'top-right' });

      setTimeout(() => router.push('/dashboard'), 800);
    } catch (err: any) {
      let msg = "Kirish muvaffaqiyatsiz. Qayta urinib ko'ring.";
      if (err.message) msg = err.message;
      else if (err.response?.data?.message) msg = err.response.data.message;
      else if (err.response?.data?.error) msg = err.response.data.error;

      setError(msg);

      // Deaktivatsiya modalkasi
      if (msg.includes('faol emas') || msg.includes('bloklangan')) {
        setShowDeactivationModal(true);
      } else if (!msg.toLowerCase().includes('topilmadi')) {
        toast.error(msg, { duration: 3000, position: 'top-right' });
      }

      ['access_token', 'refresh_token', 'admin', 'teacher'].forEach(k => localStorage.removeItem(k));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ilmify-root">

      {/* ─── Video Background ─── */}
      <div className="video-bg">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="video-el"
        >
          
          <source src="./bg.mp4" type="video/mp4" />
          <source src="./bg.webm" type="video/webm" />
        </video>
        {/* Dark overlay — video ustidan qoraytiruvchi qatlam */}
        <div className="video-overlay" />
        {/* Markazga gradient vignette */}
        <div className="video-vignette" />
      </div>

      {/* ─── Floating particles (pure CSS) ─── */}
      <div className="particles" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className={`particle particle-${i % 6}`} />
        ))}
      </div>

      {/* ─── Main centered layout ─── */}
      <main className="login-main">

        {/* ─── Brand header ─── */}
        <div className={`brand-header ${mounted ? 'brand-in' : ''}`}>
          <div className="">
            <IlmifyLogo size={52} />
          </div>
          <div className="brand-text">
            <span className="brand-name">Ilmify</span>
            <span className="brand-tag">1.0</span>
          </div>
          <div className="brand-divider" />
          <span className="brand-panel-label">Admin Panel</span>
        </div>

        {/* ─── Card ─── */}
        <div className={`login-card ${mounted ? 'card-in' : ''}`}>
          {/* Card top accent line */}
          <div className="card-accent-line" />

          <div className="card-inner">
            <div className="card-heading">
              <h2 className="card-title">Tizimga Kirish</h2>
              <p className="card-subtitle">Admin hisob ma'lumotlaringizni kiriting</p>
            </div>

            {/* ─── Error alert ─── */}
            {error && (
              <div className="error-alert">
                <AlertCircle size={16} className="error-icon" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form" noValidate>

              {/* Phone */}
              <div className="field-group">
                <label htmlFor="phone" className="field-label">
                  <Phone size={14} />
                  Telefon Raqami
                </label>
                <div className="input-wrap">
                  <span className="input-prefix">+998</span>
                  <input
                    id="phone"
                    type="tel"
                    className="ilmify-input phone-input"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="90 123 45 67"
                    disabled={loading}
                    autoComplete="tel"
                    required
                  />
                </div>
                <p className="field-hint">
                  <CheckCircle size={11} className="hint-icon" />
                  +998 kodsiz kiriting
                </p>
              </div>

              {/* Password */}
              <div className="field-group">
                <label htmlFor="password" className="field-label">
                  <Lock size={14} />
                  Parol
                </label>
                <div className="input-wrap">
                  <Lock size={16} className="input-icon-left" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="ilmify-input password-input"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(null); }}
                    placeholder="••••••••"
                    disabled={loading}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(p => !p)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="remember-row">
                <button
                  type="button"
                  className={`checkbox ${rememberMe ? 'checked' : ''}`}
                  onClick={() => setRememberMe(p => !p)}
                  disabled={loading}
                  aria-checked={rememberMe}
                  role="checkbox"
                >
                  {rememberMe && (
                    <svg viewBox="0 0 12 12" fill="none" className="check-svg">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className="remember-label" onClick={() => setRememberMe(p => !p)}>
                  Eslab qolish
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className={`submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading || !phone.trim() || !password.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    <span>Kirish amalga oshirilmoqda…</span>
                  </>
                ) : (
                  <>
                    <Shield size={17} />
                    <span>Tizimga Kirish</span>
                  </>
                )}
              </button>

            </form>

            {/* SSL badge */}
            <div className="ssl-badge">
              <Shield size={13} className="ssl-icon" />
              <span>Xavfsiz ulanish • SSL himoyalangan</span>
            </div>
          </div>
        </div>

        {/* ─── Contact / Support ─── */}
        <div className={`contact-section ${mounted ? 'contact-in' : ''}`}>
          <button
            className="contact-toggle"
            onClick={() => setShowContact(p => !p)}
            type="button"
          >
            <MessageCircle size={14} />
            {showContact ? "Yopish" : "Muammo bormi? Biz bilan bog'laning"}
          </button>

          {showContact && (
            <div className="contact-panel">
              <p className="contact-title">Texnik yordam</p>
              <a href="tel:+998901234567" className="contact-link">
                <Phone size={14} />
                +998 90 123 45 67
              </a>
              <a href="mailto:support@ilmify.uz" className="contact-link">
                <Mail size={14} />
                support@ilmify.uz
              </a>
              <a
                href="https://t.me/ilmifysupport"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.04 9.608c-.152.674-.546.84-1.107.523l-3.062-2.256-1.478 1.422c-.163.163-.3.3-.616.3l.22-3.11 5.656-5.11c.246-.22-.054-.34-.38-.12L7.286 14.46l-3.026-.944c-.658-.207-.672-.659.137-.977l11.82-4.559c.548-.198 1.027.133.845.977l-.5.29z" />
                </svg>
                @ilmifysupport
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className={`footer-note ${mounted ? 'footer-in' : ''}`}>
          © 2026 Ilmify Edu. Barcha huquqlar himoyalangan. • v2.0
        </p>

      </main>

      {/* ─── Deaktivatsiya modalkasi ─── */}
      <Dialog open={showDeactivationModal} onOpenChange={setShowDeactivationModal}>
        <DialogContent className="max-w-sm bg-white rounded-xl shadow-2xl border-0">
          <DialogHeader>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ban className="h-8 w-8 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900 text-center">
              Akkauntingiz aktiv holatida emas
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-center">
              Sizning o'quv markazingiz vaqtincha bloklangan. Buning sabablari:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <p className="font-medium">Sinov muddati tugagan</p>
              <p className="text-xs mt-1">7 kunlik BETA rejimi tugagan bo'lishi mumkin</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <p className="font-medium">Tarif muddati tugagan</p>
              <p className="text-xs mt-1">Tanlangan tarifning amal qilish muddati tugagan</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
              <p className="font-medium">Yechim</p>
              <p className="text-xs mt-1">Iltimos, Super Admin bilan bog'lanib, tarifni yangilang yoki muddatni uzaytiring</p>
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setShowDeactivationModal(false)}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
            >
              Tushunarli
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Global CSS ─── */}
      <style jsx global>{`
        /* ── Google Fonts ── */
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@300;400;600;700&display=swap');

        /* ── Reset & base ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ilmify-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          overflow: hidden;
          background: #050a14;
        }

        /* ── Video Background ── */
        .video-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }
        .video-el {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          filter: saturate(0.7) brightness(0.55);
        }
        /* Qoraytiruvchi overlay — 65% qoralik */
        .video-overlay {
          position: absolute;
          inset: 0;
          background: rgba(4, 8, 20, 0.65);
          backdrop-filter: brightness(0.85);
        }
        /* Qirralarni qoraytiruvchi vignette */
        .video-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(4, 8, 20, 0.8) 100%);
        }

        /* ── Particles ── */
        .particles {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          overflow: hidden;
        }
        .particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(110, 231, 247, 0.12);
          animation: floatUp linear infinite;
        }
        .particle-0 { width:4px;height:4px; left:8%;  animation-duration:18s; animation-delay:0s; }
        .particle-1 { width:6px;height:6px; left:17%; animation-duration:24s; animation-delay:3s; }
        .particle-2 { width:3px;height:3px; left:33%; animation-duration:20s; animation-delay:7s; }
        .particle-3 { width:5px;height:5px; left:52%; animation-duration:22s; animation-delay:1s; }
        .particle-4 { width:7px;height:7px; left:68%; animation-duration:19s; animation-delay:5s; }
        .particle-5 { width:4px;height:4px; left:82%; animation-duration:26s; animation-delay:9s; }
        @keyframes floatUp {
          from { transform: translateY(110vh) rotate(0deg); opacity:0; }
          10% { opacity:1; }
          90% { opacity:0.6; }
          to   { transform: translateY(-10vh) rotate(360deg); opacity:0; }
        }

        /* ── Main layout ── */
        .login-main {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 460px;
          padding: 24px 16px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        /* ── Brand ── */
        .brand-header {
          display: flex;
          align-items: center;
          gap: 12px;
          opacity: 0;
          transform: translateY(-24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .brand-header.brand-in { opacity: 1; transform: translateY(0); }

        .brand-logo-wrap {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(110,231,247,0.22);
          border-radius: 14px;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(8px);
          box-shadow: 0 0 20px rgba(110,231,247,0.12);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .brand-logo-wrap:hover {
          transform: scale(1.07) rotate(-2deg);
          box-shadow: 0 0 32px rgba(110,231,247,0.25);
        }
        .brand-text {
          display: flex;
          align-items: baseline;
          gap: 3px;
        }
        .brand-name {
          font-family: 'Sora', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.5px;
        }
        .brand-tag {
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #6EE7F7;
          background: rgba(110,231,247,0.12);
          border: 1px solid rgba(110,231,247,0.28);
          border-radius: 6px;
          padding: 1px 7px;
          letter-spacing: 0.5px;
          text-transform: lowercase;
          margin-bottom: 2px;
        }
        .brand-divider {
          width: 1px;
          height: 28px;
          background: rgba(255,255,255,0.2);
          margin: 0 4px;
        }
        .brand-panel-label {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
          letter-spacing: 0.8px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        /* ── Card ── */
        .login-card {
          width: 100%;
          background: rgba(10, 18, 38, 0.72);
          border: 1px solid rgba(110,231,247,0.15);
          border-radius: 24px;
          backdrop-filter: blur(24px) saturate(1.4);
          box-shadow:
            0 8px 48px rgba(0,0,0,0.55),
            0 1px 0 rgba(255,255,255,0.04) inset,
            0 0 60px rgba(59,130,246,0.08);
          overflow: hidden;
          opacity: 0;
          transform: translateY(32px) scale(0.97);
          transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1),
                      transform 0.7s cubic-bezier(0.22,1,0.36,1);
          position: relative;
        }
        .login-card.card-in { opacity: 1; transform: translateY(0) scale(1); }
        .login-card:hover {
          border-color: rgba(110,231,247,0.28);
          box-shadow: 0 12px 60px rgba(0,0,0,0.6), 0 0 80px rgba(59,130,246,0.13);
        }

        /* Top accent gradient line */
        .card-accent-line {
          height: 3px;
          background: linear-gradient(90deg, transparent, #6EE7F7, #3B82F6, #6EE7F7, transparent);
          background-size: 200% 100%;
          animation: accentSlide 4s linear infinite;
        }
        @keyframes accentSlide {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .card-inner { padding: 36px 36px 32px; }

        @media (max-width: 480px) {
          .card-inner { padding: 28px 22px 24px; }
        }

        .card-heading { margin-bottom: 28px; }
        .card-title {
          font-family: 'Sora', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 6px;
          letter-spacing: -0.3px;
        }
        .card-subtitle {
          font-size: 13.5px;
          color: rgba(255,255,255,0.45);
          font-weight: 400;
        }

        /* ── Error alert ── */
        .error-alert {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.35);
          border-radius: 12px;
          color: #fca5a5;
          font-size: 13px;
          margin-bottom: 20px;
          animation: shake 0.4s ease;
        }
        .error-icon { flex-shrink: 0; margin-top: 1px; }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-5px); }
          40%,80% { transform: translateX(5px); }
        }

        /* ── Form ── */
        .login-form { display: flex; flex-direction: column; gap: 20px; }

        .field-group { display: flex; flex-direction: column; gap: 7px; }
        .field-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }

        .input-wrap { position: relative; }

        .ilmify-input {
          width: 100%;
          height: 52px;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
          outline: none;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
          appearance: none;
        }
        .ilmify-input::placeholder { color: rgba(255,255,255,0.25); }
        .ilmify-input:focus {
          border-color: #6EE7F7;
          background: rgba(110,231,247,0.06);
          box-shadow: 0 0 0 3px rgba(110,231,247,0.12);
        }
        .ilmify-input:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Phone input has +998 prefix */
        .input-prefix {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 14px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          pointer-events: none;
          z-index: 1;
        }
        .phone-input { padding: 0 16px 0 60px; }

        /* Password input */
        .input-icon-left {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.3);
          pointer-events: none;
        }
        .password-input { padding: 0 48px 0 46px; }

        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.35);
          padding: 4px;
          border-radius: 6px;
          transition: color 0.2s;
          display: flex;
          align-items: center;
        }
        .eye-btn:hover { color: #6EE7F7; }

        .field-hint {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
        }
        .hint-icon { color: #34d399; flex-shrink: 0; }

        /* ── Remember me ── */
        .remember-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: -4px;
        }
        .checkbox {
          width: 22px;
          height: 22px;
          border-radius: 7px;
          border: 1.5px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, border-color 0.2s;
          flex-shrink: 0;
        }
        .checkbox.checked {
          background: linear-gradient(135deg, #6EE7F7, #3B82F6);
          border-color: transparent;
        }
        .check-svg { width: 12px; height: 12px; }
        .remember-label {
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          cursor: pointer;
          user-select: none;
        }

        /* ── Submit button ── */
        .submit-btn {
          width: 100%;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, #6EE7F7 0%, #3B82F6 60%, #2563EB 100%);
          color: #fff;
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.3px;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0 4px 24px rgba(59,130,246,0.4);
          margin-top: 4px;
        }
        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.18), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .submit-btn:hover:not(:disabled)::before { opacity: 1; }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(59,130,246,0.55);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }
        .submit-btn.loading { cursor: wait; }

        /* Spinner */
        .spinner {
          width: 18px; height: 18px;
          border-radius: 50%;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── SSL badge ── */
        .ssl-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 20px;
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 100px;
          padding: 7px 18px;
        }
        .ssl-icon { color: #34d399; }

        /* ── Contact section ── */
        .contact-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          opacity: 0;
          transition: opacity 0.7s ease 0.5s;
        }
        .contact-section.contact-in { opacity: 1; }

        .contact-toggle {
          display: flex;
          align-items: center;
          gap: 7px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          color: rgba(255,255,255,0.38);
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 8px;
          transition: color 0.2s, background 0.2s;
        }
        .contact-toggle:hover {
          color: #6EE7F7;
          background: rgba(110,231,247,0.06);
        }

        .contact-panel {
          width: 100%;
          margin-top: 12px;
          background: rgba(10,18,38,0.7);
          border: 1px solid rgba(110,231,247,0.14);
          border-radius: 16px;
          padding: 20px 24px;
          backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: slideDown 0.3s ease;
        }
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .contact-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: rgba(255,255,255,0.35);
          margin-bottom: 2px;
        }
        .contact-link {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          padding: 8px 12px;
          border-radius: 10px;
          transition: background 0.2s, color 0.2s;
          border: 1px solid transparent;
        }
        .contact-link:hover {
          background: rgba(110,231,247,0.08);
          color: #6EE7F7;
          border-color: rgba(110,231,247,0.18);
        }

        /* ── Footer ── */
        .footer-note {
          font-size: 11.5px;
          color: rgba(255,255,255,0.22);
          text-align: center;
          opacity: 0;
          transition: opacity 0.8s ease 0.7s;
        }
        .footer-note.footer-in { opacity: 1; }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0a0f1a; }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(#6EE7F7, #3B82F6);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}