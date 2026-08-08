'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { leadsApi } from '@/api/leadsApi';
import { leadSourcesApi } from '@/api/leadSourcesApi';
import { coursesApi } from '@/api/coursesApi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');

  @keyframes float {
    0%,100% { transform: translateY(0) rotate(0deg); }
    25%     { transform: translateY(-10px) rotate(1deg); }
    50%     { transform: translateY(-5px) rotate(-1deg); }
    75%     { transform: translateY(-15px) rotate(0.5deg); }
  }
  @keyframes float2 {
    0%,100% { transform: translateY(0) translateX(0); }
    33%     { transform: translateY(-12px) translateX(8px); }
    66%     { transform: translateY(8px) translateX(-8px); }
  }
  @keyframes pulse-ring {
    0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
    50%     { box-shadow: 0 0 0 18px rgba(99,102,241,0); }
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(40px) scale(0.94); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes logoAppear {
    from { opacity: 0; transform: scale(0.3) rotate(-20deg); }
    to   { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes blob {
    0%,100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
    50%     { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
  }
  @keyframes checkDraw {
    to { stroke-dashoffset: 0; }
  }
  @keyframes confetti-fall {
    0%   { transform: translateY(-100%) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
  @keyframes bgShift {
    0%,100% { background-position: 0% 50%; }
    50%     { background-position: 100% 50%; }
  }

  .landing-input {
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
    font-family: 'Nunito', 'Segoe UI', sans-serif;
  }
  .landing-input:focus {
    outline: none;
    border-color: #6366F1 !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12), 0 2px 8px rgba(99,102,241,0.08) !important;
    transform: translateY(-1px);
  }
  .landing-input:hover:not(:focus) {
    border-color: #C7D2FE !important;
  }

  .submit-btn {
    transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
  }
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(99,102,241,0.4);
  }
  .submit-btn:active:not(:disabled) { transform: translateY(0); }
  .submit-btn:disabled { opacity: 0.75; cursor: not-allowed; }

  .course-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 14px;
    background: rgba(255,255,255,0.22);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.35);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    color: white;
    animation: fadeUp 0.4s ease both;
    letter-spacing: 0.2px;
  }
`;

/* ═══════════════════════════════════════════════ 3D CARD ═══════════════════════════════════════════════ */
function Card3D({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rx, setRx] = useState(0);
  const [ry, setRy] = useState(0);
  const [hovering, setHovering] = useState(false);

  const onMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const cx = r.width / 2;
    const cy = r.height / 2;
    setRx(((e.clientY - r.top - cy) / cy) * -4);
    setRy(((e.clientX - r.left - cx) / cx) * 4);
  }, []);

  const onLeave = useCallback(() => { setRx(0); setRy(0); setHovering(false); }, []);

  return (
    <div ref={ref} onMouseMove={onMove} onMouseEnter={() => setHovering(true)} onMouseLeave={onLeave}
      style={{
        transform: `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg)`,
        transition: hovering ? 'none' : 'transform 0.6s cubic-bezier(0.22,1,0.36,1)',
        transformStyle: 'preserve-3d',
        ...style,
      }}>
      {children}
    </div>
  );
}

function Spinner({ color = 'white' }: { color?: string }) {
  return <span style={{ display: 'inline-block', width: '16px', height: '16px', border: `2.5px solid ${color}40`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite', verticalAlign: 'middle', marginRight: '8px' }} />;
}

function FloatingShapes() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', borderRadius: '50%', top: '-80px', right: '-60px', animation: 'float 8s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', borderRadius: '50%', bottom: '10%', left: '-60px', animation: 'float2 7s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: '140px', height: '140px', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', borderRadius: '50%', bottom: '40%', right: '-30px', animation: 'float 9s ease infinite 2s' }} />
    </div>
  );
}

const confettiColors = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6'];
function Confetti() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, overflow: 'hidden' }}>
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${Math.random() * 100}%`, top: '-20px',
          width: `${6 + Math.random() * 8}px`, height: `${6 + Math.random() * 8}px`,
          backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          animation: `confetti-fall ${2 + Math.random() * 3}s linear ${Math.random() * 1.5}s both`,
        }} />
      ))}
    </div>
  );
}

function CenterLogo({ logo, name }: { logo?: string | null; name: string }) {
  const [imgError, setImgError] = useState(false);

  if (logo && !imgError) {
    return (
      <img src={`${API_URL}/uploads/centers/${logo}`} alt={name}
        onError={() => setImgError(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
      />
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
      <span style={{ color: 'white', fontSize: '28px', fontWeight: 900, lineHeight: 1 }}>
        {name?.charAt(0)?.toUpperCase() || 'O'}
      </span>
    </div>
  );
}

function LoadingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #6366F1, #4F46E5, #3730A3)', backgroundSize: '200% 200%', animation: 'bgShift 4s ease infinite' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', border: '3px solid rgba(255,255,255,0.25)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ color: 'white', fontSize: '14px', fontWeight: 600, fontFamily: "'Nunito',sans-serif" }}>Yuklanmoqda...</p>
      </div>
    </div>
  );
}

function Wave({ color = 'white' }: { color?: string }) {
  return (
    <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
      style={{ display: 'block', position: 'relative', zIndex: 2, width: '100%', height: '56px', marginBottom: '-2px' }}>
      <path d="M0,40 C180,60 300,10 480,36 C660,62 780,12 960,32 C1140,52 1260,14 1440,38 L1440,80 L0,80 Z" fill={color} opacity="0.25" />
      <path d="M0,52 C200,24 350,62 560,42 C770,22 880,56 1080,38 C1230,24 1350,52 1440,46 L1440,80 L0,80 Z" fill={color} opacity="0.35" />
      <path d="M0,64 C240,42 400,72 600,56 C800,40 920,66 1120,52 C1280,40 1380,62 1440,58 L1440,80 L0,80 Z" fill={color} />
    </svg>
  );
}

function LeadLandingPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const sourceCode = searchParams.get('source');
  const coursesParam = searchParams.get('courses');
  const urlCenterName = searchParams.get('cname');
  const urlCenterLogo = searchParams.get('clogo');

  const [centerName, setCenterName] = useState<string | null>(urlCenterName || null);
  const [centerLogo, setCenterLogo] = useState<string | null>(urlCenterLogo || null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [sourcePlatform, setSourcePlatform] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [courses, setCourses] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const [form, setForm] = useState({
    first_name: '', last_name: '', phone_number: '',
  });

  useEffect(() => {
    if (coursesParam) {
      const list = coursesParam.split(',').filter(Boolean);
      setCourses(list);
      setSelectedCourses(list);
    }
  }, [coursesParam]);

  useEffect(() => {
    if (!token && !sourceCode) {
      setErrorMessage("Havola noto'g'ri. Token yoki source kodi kerak.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        let resolvedToken = token;

        if (token && !centerName) {
          const c = await leadsApi.getCenterByToken(token);
          setCenterName(c.name);
          if (c.logo && !centerLogo) setCenterLogo(c.logo);
        }

        let sourceCourses: string[] = [];
        if (sourceCode) {
          const src = await leadSourcesApi.getByCode(sourceCode);
          if (src.center) {
            if (!centerName) setCenterName(src.center.name);
            if (src.center.logo && !centerLogo) setCenterLogo(src.center.logo);
          }
          setSourcePlatform(src.platform);
          setSourceName(src.name);
          if (src.courses) {
            sourceCourses = src.courses.split(',').filter(Boolean);
          }
        }

        let availableCourses = sourceCourses;

        const urlCourseList = coursesParam ? coursesParam.split(',').filter(Boolean) : [];

        if (token) {
          try {
            const centerCourses = await coursesApi.getByToken(token);
            if (centerCourses.length > 0) {
              const names = centerCourses.map(c => c.name);
              availableCourses = Array.from(new Set([...names, ...sourceCourses]));
            }
          } catch {}
        }

        const finalCourses = urlCourseList.length > 0
          ? Array.from(new Set([...urlCourseList, ...availableCourses]))
          : availableCourses;

        if (finalCourses.length > 0) {
          setCourses(finalCourses);
          if (urlCourseList.length > 0) {
            setSelectedCourses(urlCourseList);
          } else if (sourceCourses.length > 0) {
            setSelectedCourses(sourceCourses);
          } else {
            setSelectedCourses(finalCourses);
          }
        }

        setLoading(false);
      } catch {
        setErrorMessage("Noto'g'ri havola. Manba topilmadi yoki muddati o'tgan.");
        setLoading(false);
      }
    };
    load();
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
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number,
        courses: selectedCourses.length > 0 ? selectedCourses.join(', ') : undefined,
        source_platform: sourceCode || undefined,
        token: token || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setFieldError(err?.response?.data?.message || "Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputS: React.CSSProperties = {
    width: '100%', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '13px 16px',
    fontSize: '15px', fontFamily: 'inherit', fontWeight: 600, color: '#1E293B',
    backgroundColor: '#F8FAFC', outline: 'none',
  };

  if (loading) return <LoadingPage />;

  if (errorMessage) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Nunito','Segoe UI',sans-serif", background: 'linear-gradient(135deg, #FEE2E2, #FEF2F2, #FFF1F2)' }}>
      <style dangerouslySetInnerHTML={{ __html: globalCSS }} />
      <Card3D style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ borderRadius: '28px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(239,68,68,0.18), 0 4px 16px rgba(0,0,0,0.08)', animation: 'cardIn 0.6s ease both' }}>
          <div style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', padding: '40px 32px 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <FloatingShapes />
            <div style={{ width: '72px', height: '72px', margin: '0 auto 16px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, animation: 'logoAppear 0.6s ease 0.15s both' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
            </div>
            <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 800, position: 'relative', zIndex: 1, animation: 'fadeUp 0.5s ease 0.25s both' }}>Xatolik</h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', fontWeight: 600, marginTop: '4px', position: 'relative', zIndex: 1, animation: 'fadeUp 0.5s ease 0.35s both' }}>Havola topilmadi</p>
            <Wave color="white" />
          </div>
          <div style={{ background: 'white', padding: '32px 28px', textAlign: 'center', animation: 'fadeUp 0.5s ease 0.4s both' }}>
            <p style={{ color: '#6B7280', fontSize: '15px', fontWeight: 600 }}>{errorMessage}</p>
          </div>
        </div>
      </Card3D>
    </div>
  );

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Nunito','Segoe UI',sans-serif", background: 'linear-gradient(135deg, #D1FAE5, #ECFDF5, #F0FDF4)' }}>
      <style dangerouslySetInnerHTML={{ __html: globalCSS }} />
      <Confetti />
      <Card3D style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ borderRadius: '28px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(16,185,129,0.18), 0 4px 16px rgba(0,0,0,0.08)', animation: 'cardIn 0.6s ease both' }}>
          <div style={{ background: 'linear-gradient(135deg, #10B981, #059669)', padding: '40px 32px 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <FloatingShapes />
            <div style={{ width: '80px', height: '80px', margin: '0 auto 16px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, animation: 'pulse-ring 2s ease infinite, logoAppear 0.6s ease 0.15s both' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: '30', strokeDashoffset: '30', animation: 'checkDraw 0.5s ease 0.5s forwards' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 800, position: 'relative', zIndex: 1, animation: 'fadeUp 0.5s ease 0.3s both' }}>Muvaffaqiyat!</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 600, marginTop: '4px', position: 'relative', zIndex: 1, animation: 'fadeUp 0.5s ease 0.4s both' }}>Xabaringiz qabul qilindi</p>
            <Wave color="white" />
          </div>
          <div style={{ background: 'white', padding: '36px 28px 32px', textAlign: 'center', animation: 'fadeUp 0.5s ease 0.45s both' }}>
            <p style={{ color: '#1E293B', fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Tez orada siz bilan bog'lanamiz!</p>
            <p style={{ color: '#6B7280', fontSize: '14px', fontWeight: 500 }}>Murojaatingiz uchun rahmat.</p>
          </div>
        </div>
      </Card3D>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'Nunito','Segoe UI',sans-serif", background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 30%, #F0F4FF 60%, #F5F3FF 100%)', backgroundSize: '400% 400%', animation: 'bgShift 12s ease infinite' }}>
      <style dangerouslySetInnerHTML={{ __html: globalCSS }} />

      <FloatingShapes />

      <Card3D style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 1 }}>
        <div style={{ borderRadius: '28px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(79,70,229,0.18), 0 4px 20px rgba(0,0,0,0.06)', animation: 'cardIn 0.6s ease both' }}>
          {/* ═══════════ HEADER ═══════════ */}
          <div style={{ background: 'linear-gradient(150deg, #4F46E5 0%, #6366F1 30%, #7C3AED 70%, #8B5CF6 100%)', padding: '36px 28px 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Decorative blobs */}
            <div style={{ position: 'absolute', width: '180px', height: '180px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%', top: '-60px', right: '-50px', animation: 'blob 8s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', width: '120px', height: '120px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%', bottom: '20px', left: '-40px', animation: 'blob 8s ease-in-out infinite 2s' }} />

            {/* Logo */}
            <div style={{ width: '80px', height: '80px', margin: '0 auto 14px', position: 'relative', zIndex: 2, animation: 'logoAppear 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both' }}>
              <div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', animation: 'pulse-ring 3s ease infinite' }} />
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.4)', boxShadow: '0 0 30px rgba(255,255,255,0.2)', position: 'relative', zIndex: 1 }}>
                <CenterLogo logo={centerLogo} name={centerName || ''} />
              </div>
            </div>

            {/* Center name */}
            <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 900, letterSpacing: '-0.3px', lineHeight: 1.2, position: 'relative', zIndex: 2, animation: 'fadeUp 0.5s ease 0.2s both' }}>
              {centerName || "Ro'yxatdan o'tish"}
            </h2>

            {/* Subtitle */}
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 600, marginTop: '6px', position: 'relative', zIndex: 2, animation: 'fadeUp 0.5s ease 0.3s both' }}>
              {sourceName ? `${sourceName} orqali` : "Kursga yozilish uchun ma'lumotlaringizni qoldiring"}
            </p>

            {/* Course badges */}
            {courses.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '14px', marginBottom: '6px', position: 'relative', zIndex: 2 }}>
                {courses.map((c, i) => (
                  <span key={i} className="course-badge" style={{ animationDelay: `${0.35 + i * 0.08}s` }}>
                    {c}
                  </span>
                ))}
              </div>
            )}

            <Wave color="white" />
          </div>

          {/* ═══════════ FORM BODY ═══════════ */}
          <div style={{ background: 'white', padding: '24px 28px 28px', animation: 'fadeUp 0.5s ease 0.35s both' }}>
            {fieldError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '10px 14px', color: '#DC2626', fontSize: '13px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                {fieldError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Ism <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input className="landing-input" style={inputS} type="text" placeholder="Ismingiz"
                    value={form.first_name}
                    onChange={e => setForm({ ...form, first_name: e.target.value })} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Familiya <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input className="landing-input" style={inputS} type="text" placeholder="Familiyangiz"
                    value={form.last_name}
                    onChange={e => setForm({ ...form, last_name: e.target.value })} required />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Telefon raqam <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input className="landing-input" style={inputS} type="tel" placeholder="+998 90 123 45 67"
                  value={form.phone_number}
                  onChange={e => setForm({ ...form, phone_number: e.target.value })} required />
              </div>

<div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Kurslar
                </label>
                {courses.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {courses.map((c, i) => {
                      const selected = selectedCourses.includes(c);
                      return (
                        <button key={i} type="button" onClick={() => {
                          setSelectedCourses(prev =>
                            prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                          );
                        }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '10px 14px', borderRadius: '12px', cursor: 'pointer',
                            fontFamily: 'inherit', fontSize: '13px', fontWeight: 700,
                            border: selected ? '2px solid #6366F1' : '1.5px solid #E2E8F0',
                            background: selected ? '#EEF2FF' : '#F8FAFC',
                            color: selected ? '#4F46E5' : '#64748B',
                            transition: 'all 0.2s',
                          }}>
                          <span style={{
                            width: '18px', height: '18px', borderRadius: '6px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            background: selected ? '#6366F1' : 'white',
                            border: selected ? 'none' : '2px solid #CBD5E1',
                            transition: 'all 0.2s',
                          }}>
                            {selected && (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </span>
                          {c}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600, background: '#F8FAFC', border: '1.5px dashed #CBD5E1', borderRadius: '12px', padding: '14px' }}>
                    Ushbu manbadan kurslar ro'yxati mavjud emas
                  </p>
                )}
              </div>

              <button className="submit-btn" type="submit" disabled={submitting}
                style={{ width: '100%', padding: '15px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: 'white', fontFamily: 'inherit', fontSize: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.35)', letterSpacing: '0.2px' }}>
                {submitting ? <><Spinner /> Yuborilmoqda...</> : "Yuborish"}
              </button>
            </form>
          </div>
        </div>
      </Card3D>
    </div>
  );
}

export default function LeadLandingPageWrapper() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <LeadLandingPage />
    </Suspense>
  );
}
