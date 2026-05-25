'use client';

import { useState } from 'react';
import { centerApplicationsApi } from '@/api/centerApplicationsApi';

const REGIONS = [
  'Toshkent shahar',
  'Toshkent viloyati',
  'Andijon viloyati',
  'Buxoro viloyati',
  "Farg'ona viloyati",
  'Jizzax viloyati',
  'Xorazm viloyati',
  'Namangan viloyati',
  'Navoiy viloyati',
  'Qashqadaryo viloyati',
  'Samarqand viloyati',
  'Sirdaryo viloyati',
  'Surxondaryo viloyati',
  "Qoraqalpog'iston Respublikasi",
];

const style = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #e8f0fe 0%, #f0f4fa 50%, #e4ecf7 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  } as React.CSSProperties,
  card: {
    width: '100%',
    maxWidth: '420px',
    borderRadius: '28px',
    overflow: 'hidden',
    boxShadow: '0 32px 80px rgba(20,60,160,0.20), 0 4px 16px rgba(0,0,0,0.06)',
  } as React.CSSProperties,
  header: {
    background: 'linear-gradient(150deg, #1a6ef7 0%, #1250d4 50%, #0d3daa 100%)',
    padding: '36px 28px 0',
    textAlign: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  headerTitle: {
    color: 'white',
    fontSize: '22px',
    fontWeight: 800,
    letterSpacing: '-0.3px',
    position: 'relative' as const,
    zIndex: 2,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: '13px',
    fontWeight: 500,
    marginTop: '5px',
    marginBottom: '24px',
    position: 'relative' as const,
    zIndex: 2,
  },
  body: {
    background: 'white',
    padding: '28px',
  },
  fieldWrap: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: '#5a6480',
    letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    border: '1.5px solid #e2e6f0',
    borderRadius: '12px',
    padding: '11px 14px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a2240',
    background: '#f7f9fc',
    outline: 'none',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  select: {
    width: '100%',
    border: '1.5px solid #e2e6f0',
    borderRadius: '12px',
    padding: '11px 14px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a2240',
    background: '#f7f9fc',
    outline: 'none',
    boxSizing: 'border-box' as const,
    appearance: 'auto' as const,
    cursor: 'pointer',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    border: '1.5px solid #e2e6f0',
    borderRadius: '12px',
    padding: '11px 14px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a2240',
    background: '#f7f9fc',
    outline: 'none',
    minHeight: '80px',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  btn: {
    width: '100%',
    padding: '14px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #1a6ef7 0%, #1044cc 100%)',
    color: 'white',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
    marginTop: '4px',
    boxShadow: '0 6px 20px rgba(26,110,247,0.38)',
    letterSpacing: '0.2px',
  } as React.CSSProperties,
  error: {
    background: '#fff0f0',
    border: '1px solid #ffd0d0',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#c0392b',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};

const focusStyle = `
  .ariza-input:focus {
    border-color: #1a6ef7 !important;
    background: white !important;
    box-shadow: 0 0 0 3.5px rgba(26,110,247,0.12) !important;
  }
  .ariza-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(26,110,247,0.45) !important;
  }
  .ariza-btn:active { transform: translateY(0) !important; }
  .ariza-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none !important; }
  .header-orb1 {
    position: absolute; width: 200px; height: 200px;
    background: rgba(255,255,255,0.07);
    border-radius: 50%; top: -70px; right: -50px;
    pointer-events: none;
  }
  .header-orb2 {
    position: absolute; width: 130px; height: 130px;
    background: rgba(255,255,255,0.05);
    border-radius: 50%; bottom: 30px; left: -35px;
    pointer-events: none;
  }
`;

function Wave() {
  return (
    <svg viewBox="0 0 400 56" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
      style={{ display: 'block', position: 'relative', zIndex: 2, marginBottom: '-2px' }} height={56} width="100%">
      <path d="M0,20 C60,45 100,5 160,22 C220,39 260,8 320,20 C360,28 385,16 400,20 L400,56 L0,56 Z" fill="white" opacity="0.2" />
      <path d="M0,34 C50,14 110,48 180,30 C240,14 290,46 360,28 C380,22 395,30 400,34 L400,56 L0,56 Z" fill="white" opacity="0.3" />
      <path d="M0,44 C70,28 130,56 200,42 C260,30 310,52 400,40 L400,56 L0,56 Z" fill="white" />
    </svg>
  );
}

export default function ArizaPage() {
  const [form, setForm] = useState({
    center_name: '',
    full_name: '',
    phone: '',
    region: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.center_name || !form.full_name || !form.phone || !form.region) {
      setError('Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await centerApplicationsApi.createPublic({
        center_name: form.center_name,
        full_name: form.full_name,
        phone: form.phone,
        region: form.region,
        description: form.description || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={style.page}>
        <style>{focusStyle}</style>
        <div style={style.card}>
          <div style={style.header}>
            <div className="header-orb1" /><div className="header-orb2" />
            <svg width="48" height="48" viewBox="0 0 24 24" fill="white" style={{ marginBottom: '10px' }}>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <div style={style.headerTitle}>Ariza qabul qilindi!</div>
            <div style={style.headerSub}>Tez orada siz bilan bog'lanamiz</div>
            <Wave />
          </div>
          <div style={{ ...style.body, textAlign: 'center', padding: '36px 28px' }}>
            <p style={{ color: '#1a2240', fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
              Murojaatingiz uchun rahmat!
            </p>
            <p style={{ color: '#6b7391', fontSize: '14px', fontWeight: 500 }}>
              Siz bilan 1-2 ish kuni ichida bog'lanamiz.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={style.page}>
      <style>{focusStyle}</style>
      <div style={style.card}>
        <div style={style.header}>
          <div className="header-orb1" /><div className="header-orb2" />
          <div style={{ marginBottom: '10px' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="white" style={{ opacity: 0.9 }}>
              <path d="M12 3C7.5 3 4.5 7 4.5 11.5C4.5 13.5 5 15 6 16.5L8 19H16L18 16.5C19 15 19.5 13.5 19.5 11.5C19.5 7 16.5 3 12 3ZM10 21V22H14V21H10ZM12 5C15.4 5 17.5 8 17.5 11.5C17.5 13 17.1 14.1 16.3 15.3L15 17H9L7.7 15.3C6.9 14.1 6.5 13 6.5 11.5C6.5 8 8.6 5 12 5ZM11 8V13H13V8H11Z"/>
            </svg>
          </div>
          <div style={style.headerTitle}>Ilmify ga qo'shiling</div>
          <div style={style.headerSub}>
            O'quv markazingizni ro'yxatdan o'tkazing
          </div>
          <Wave />
        </div>

        <div style={style.body}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={style.error}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 13H11V7H13V13ZM13 17H11V15H13V17ZM12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2Z"/>
                </svg>
                {error}
              </div>
            )}

            <div style={style.fieldWrap}>
              <label style={style.label}>O'quv markaz nomi <span style={{ color: '#e74c3c' }}>*</span></label>
              <input className="ariza-input" style={style.input} type="text"
                placeholder="Masalan,翰林学院 yoki Best Education"
                value={form.center_name} onChange={e => handleChange('center_name', e.target.value)} required />
            </div>

            <div style={style.fieldWrap}>
              <label style={style.label}>To'liq ismingiz <span style={{ color: '#e74c3c' }}>*</span></label>
              <input className="ariza-input" style={style.input} type="text"
                placeholder="Aliyev Alisher"
                value={form.full_name} onChange={e => handleChange('full_name', e.target.value)} required />
            </div>

            <div style={style.fieldWrap}>
              <label style={style.label}>Telefon raqam <span style={{ color: '#e74c3c' }}>*</span></label>
              <input className="ariza-input" style={style.input} type="tel"
                placeholder="+998 90 123 45 67"
                value={form.phone} onChange={e => handleChange('phone', e.target.value)} required />
            </div>

            <div style={style.fieldWrap}>
              <label style={style.label}>Viloyat <span style={{ color: '#e74c3c' }}>*</span></label>
              <select className="ariza-input" style={style.select}
                value={form.region} onChange={e => handleChange('region', e.target.value)} required>
                <option value="" disabled>Viloyatni tanlang</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={style.fieldWrap}>
              <label style={style.label}>Batafsil ma'lumot</label>
              <textarea className="ariza-input" style={style.textarea}
                placeholder="O'quv markazingiz haqida qo'shimcha ma'lumot..."
                value={form.description} onChange={e => handleChange('description', e.target.value)} />
            </div>

            <button className="ariza-btn" style={style.btn} type="submit" disabled={submitting}>
              {submitting ? 'Yuborilmoqda...' : 'Ariza yuborish'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
