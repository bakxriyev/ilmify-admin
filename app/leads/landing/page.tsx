'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { leadsApi } from '@/api/leadsApi';
import { leadSourcesApi } from '@/api/leadSourcesApi';

/* ─── Inline styles (no Tailwind needed beyond what's built in) ─── */
const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #dce9ff 0%, #e8edf5 50%, #dde4f7 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Nunito', 'Segoe UI', sans-serif",
  } as React.CSSProperties,
  card: {
    width: '100%',
    maxWidth: '400px',
    borderRadius: '28px',
    overflow: 'hidden',
    boxShadow: '0 32px 80px rgba(20,60,160,0.22), 0 4px 16px rgba(0,0,0,0.08)',
    animation: 'cardIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
  } as React.CSSProperties,
  header: {
    background: 'linear-gradient(150deg, #1a6ef7 0%, #1250d4 50%, #0d3daa 100%)',
    padding: '36px 32px 0',
    textAlign: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  logoRing: {
    width: '72px',
    height: '72px',
    background: 'rgba(255,255,255,0.18)',
    border: '2.5px solid rgba(255,255,255,0.35)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 14px',
    position: 'relative' as const,
    zIndex: 2,
    animation: 'logoIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s both',
  },
  headerTitle: {
    color: 'white',
    fontSize: '22px',
    fontWeight: 800,
    letterSpacing: '-0.3px',
    position: 'relative' as const,
    zIndex: 2,
    animation: 'fadeUp 0.5s ease 0.25s both',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: '13px',
    fontWeight: 500,
    marginTop: '5px',
    marginBottom: '24px',
    position: 'relative' as const,
    zIndex: 2,
    animation: 'fadeUp 0.5s ease 0.35s both',
  },
  body: {
    background: 'white',
    padding: '28px',
    animation: 'fadeUp 0.5s ease 0.4s both',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  fieldWrap: {
    marginBottom: '16px',
    flex: 1,
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
    fontFamily: 'inherit',
    fontWeight: 500,
    color: '#1a2240',
    background: '#f7f9fc',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    border: '1.5px solid #e2e6f0',
    borderRadius: '12px',
    padding: '11px 14px',
    fontSize: '14px',
    fontFamily: 'inherit',
    fontWeight: 500,
    color: '#1a2240',
    background: '#f7f9fc',
    outline: 'none',
    minHeight: '72px',
    resize: 'none' as const,
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  } as React.CSSProperties,
  btn: {
    width: '100%',
    padding: '14px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #1a6ef7 0%, #1044cc 100%)',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
    marginTop: '4px',
    boxShadow: '0 6px 20px rgba(26,110,247,0.38)',
    transition: 'transform 0.15s, box-shadow 0.15s',
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

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(32px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes logoIn {
    from { opacity: 0; transform: scale(0.6) rotate(-10deg); }
    to   { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .lead-input:focus {
    border-color: #1a6ef7 !important;
    background: white !important;
    box-shadow: 0 0 0 3.5px rgba(26,110,247,0.12) !important;
  }
  .lead-btn:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 10px 28px rgba(26,110,247,0.45) !important;
  }
  .lead-btn:active { transform: translateY(0) !important; }
  .lead-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none !important;
  }
  .header-orb1 {
    position: absolute; width: 200px; height: 200px;
    background: rgba(255,255,255,0.07);
    border-radius: 50%; top: -70px; right: -50px;
    animation: pulse 4s ease-in-out infinite;
    pointer-events: none;
  }
  .header-orb2 {
    position: absolute; width: 130px; height: 130px;
    background: rgba(255,255,255,0.05);
    border-radius: 50%; bottom: 30px; left: -35px;
    animation: pulse 4s ease-in-out infinite 1.5s;
    pointer-events: none;
  }
  @keyframes pulse {
    0%,100% { transform: scale(1); opacity: 1; }
    50%      { transform: scale(1.08); opacity: 0.7; }
  }
`;

/* ─── Wave SVG ─── */
function Wave() {
  return (
    <svg
      viewBox="0 0 400 56"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      style={{ display: 'block', position: 'relative', zIndex: 2, marginBottom: '-2px' }}
      height={56}
      width="100%"
    >
      <path d="M0,20 C60,45 100,5 160,22 C220,39 260,8 320,20 C360,28 385,16 400,20 L400,56 L0,56 Z" fill="white" opacity="0.2" />
      <path d="M0,34 C50,14 110,48 180,30 C240,14 290,46 360,28 C380,22 395,30 400,34 L400,56 L0,56 Z" fill="white" opacity="0.3" />
      <path d="M0,44 C70,28 130,56 200,42 C260,30 310,52 400,40 L400,56 L0,56 Z" fill="white" />
    </svg>
  );
}

/* ─── Spinner ─── */
function Spinner({ color = 'white' }: { color?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '16px', height: '16px',
        border: `2.5px solid ${color}40`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        verticalAlign: 'middle',
        marginRight: '8px',
      }}
    />
  );
}

/* ─── Center loading state ─── */
function PageCenter({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      ...s.page,
      background: 'linear-gradient(150deg, #1a6ef7 0%, #1044cc 100%)',
    }}>
      {children}
    </div>
  );
}

/* ─── Wrapper ─── */
export default function LeadLandingPageWrapper() {
  return (
    <Suspense fallback={
      <PageCenter>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </PageCenter>
    }>
      <style dangerouslySetInnerHTML={{ __html: globalCSS }} />
      <LeadLandingPage />
    </Suspense>
  );
}

/* ─── Main page ─── */
function LeadLandingPage() {
  const searchParams = useSearchParams();
  const token      = searchParams.get('token');
  const sourceCode = searchParams.get('source');

  const [centerName,  setCenterName ] = useState<string | null>(null);
  const [tokenError,  setTokenError ] = useState(false);
  const [errorMessage,setErrorMessage] = useState('');
  const [loading,     setLoading    ] = useState(true);
  const [submitting,  setSubmitting ] = useState(false);
  const [success,     setSuccess    ] = useState(false);
  const [fieldError,  setFieldError ] = useState('');

  const [form, setForm] = useState({
    first_name: '', last_name: '', phone_number: '', comment: '',
  });

  useEffect(() => {
    if (token) {
      leadsApi.getCenterByToken(token)
        .then(c => { setCenterName(c.name); setLoading(false); })
        .catch(() => { setTokenError(true); setLoading(false); });
    } else if (sourceCode) {
      leadSourcesApi.getByCode(sourceCode)
        .then(src => { if (src.center) setCenterName(src.center.name); setLoading(false); })
        .catch(() => { setErrorMessage("Noto'g'ri havola. Token yoki source kodi noto'g'ri."); setLoading(false); });
    } else {
      setErrorMessage("Havola noto'g'ri. Token kerak.");
      setLoading(false);
    }
  }, [token, sourceCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.phone_number) {
      setFieldError("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }
    try {
      setSubmitting(true);
      setFieldError('');
      await leadsApi.createPublic({
        first_name:      form.first_name,
        last_name:       form.last_name,
        phone_number:    form.phone_number,
        comment:         form.comment || undefined,
        source_platform: sourceCode || undefined,
        token:           token || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setFieldError(err?.response?.data?.message || 'Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <PageCenter>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </PageCenter>
  );

  /* ── Error ── */
  if (tokenError || errorMessage) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ ...s.header, paddingBottom: 0 }}>
          <div className="header-orb1" /><div className="header-orb2" />
          <div style={s.logoRing}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="white">
              <path d="M13 13H11V7H13V13ZM13 17H11V15H13V17ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"/>
            </svg>
          </div>
          <div style={s.headerTitle}>Xatolik</div>
          <div style={s.headerSub}>Havola topilmadi</div>
          <Wave />
        </div>
        <div style={{ ...s.body, textAlign: 'center', padding: '32px 28px' }}>
          <p style={{ color: '#6b7391', fontSize: '14px', fontWeight: 500 }}>
            {errorMessage || "Bu havola noto'g'ri yoki muddati o'tgan."}
          </p>
        </div>
      </div>
    </div>
  );

  /* ── Success ── */
  if (success) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ ...s.header, paddingBottom: 0 }}>
          <div className="header-orb1" /><div className="header-orb2" />
          <div style={s.logoRing}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="white">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
          <div style={s.headerTitle}>Muvaffaqiyat!</div>
          <div style={s.headerSub}>Xabar qabul qilindi</div>
          <Wave />
        </div>
        <div style={{ ...s.body, textAlign: 'center', padding: '36px 28px' }}>
          <p style={{ color: '#1a2240', fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
            Tez orada siz bilan bog'lanamiz!
          </p>
          <p style={{ color: '#6b7391', fontSize: '14px', fontWeight: 500 }}>
            Murojaatingiz uchun rahmat. 🎉
          </p>
        </div>
      </div>
    </div>
  );

  /* ── Form ── */
  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Header */}
        <div style={s.header}>
          <div className="header-orb1" />
          <div className="header-orb2" />

          <div style={s.logoRing}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="white">
              <path d="M12 3C7.5 3 4.5 7 4.5 11.5C4.5 13.5 5 15 6 16.5L8 19H16L18 16.5C19 15 19.5 13.5 19.5 11.5C19.5 7 16.5 3 12 3ZM10 21V22H14V21H10ZM12 5C15.4 5 17.5 8 17.5 11.5C17.5 13 17.1 14.1 16.3 15.3L15 17H9L7.7 15.3C6.9 14.1 6.5 13 6.5 11.5C6.5 8 8.6 5 12 5ZM11 8V13H13V8H11Z"/>
            </svg>
          </div>

          <div style={s.headerTitle}>
            {centerName || "Ro'yxatdan o'tish"}
          </div>
          <div style={s.headerSub}>
            Kursga yozilish uchun ma'lumotlaringizni qoldiring
          </div>

          <Wave />
        </div>

        {/* Form body */}
        <div style={s.body}>
          <form onSubmit={handleSubmit}>

            {fieldError && (
              <div style={s.error}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 13H11V7H13V13ZM13 17H11V15H13V17ZM12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2Z"/>
                </svg>
                {fieldError}
              </div>
            )}

            {/* First / Last name row */}
            <div style={s.row}>
              <div style={s.fieldWrap}>
                <label style={s.label}>Ism <span style={{ color: '#e74c3c' }}>*</span></label>
                <input
                  className="lead-input"
                  style={s.input}
                  type="text"
                  placeholder="Ismingiz"
                  value={form.first_name}
                  onChange={e => setForm({ ...form, first_name: e.target.value })}
                  required
                />
              </div>
              <div style={s.fieldWrap}>
                <label style={s.label}>Familiya <span style={{ color: '#e74c3c' }}>*</span></label>
                <input
                  className="lead-input"
                  style={s.input}
                  type="text"
                  placeholder="Familiyangiz"
                  value={form.last_name}
                  onChange={e => setForm({ ...form, last_name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div style={s.fieldWrap}>
              <label style={s.label}>Telefon raqam <span style={{ color: '#e74c3c' }}>*</span></label>
              <input
                className="lead-input"
                style={s.input}
                type="tel"
                placeholder="+998 90 123 45 67"
                value={form.phone_number}
                onChange={e => setForm({ ...form, phone_number: e.target.value })}
                required
              />
            </div>

            {/* Comment */}
            <div style={s.fieldWrap}>
              <label style={s.label}>Izoh</label>
              <textarea
                className="lead-input"
                style={s.textarea}
                placeholder="Kurs haqida savolingiz bormi?"
                value={form.comment}
                onChange={e => setForm({ ...form, comment: e.target.value })}
              />
            </div>

            {/* Submit */}
            <button
              className="lead-btn"
              style={s.btn}
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? <><Spinner /> Yuborilmoqda...</>
                : 'Yuborish'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}