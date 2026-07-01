'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { academySettingsApi, type AcademySettings } from '@/api/academySettingsApi';
import {
  Building2,
  Save,
  RefreshCw,
  Printer,
  Smartphone,
  Globe,
  Instagram,
  ShieldCheck,
  Phone,
  Mail,
  Clock,
  MapPin,
  MessageCircle,
  ImageIcon,
  UploadCloud,
  X as XIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

// The backend model may not yet have a logo column — this extends the form
// locally so the UI works today. Add `academy_logo` (text/url) to
// AcademySettings on the backend to persist it permanently.
type SettingsForm = Partial<AcademySettings> & { academy_logo?: string };

const TABS = [
  { id: 'main', label: 'Asosiy', icon: Building2 },
  { id: 'contact', label: "Aloqa va tarmoqlar", icon: Phone },
  { id: 'receipt', label: 'Chek matni', icon: FileText },
  { id: 'logo', label: 'Logotip', icon: ImageIcon },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AcademySettingsPage() {
  const [settings, setSettings] = useState<AcademySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SettingsForm>({});
  const [activeTab, setActiveTab] = useState<TabId>('main');
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await academySettingsApi.get();
      setSettings(data);
      setForm({ ...data });
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Close fullscreen preview with Escape
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFullscreen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const save = async () => {
    try {
      setSaving(true);
      const data = await academySettingsApi.update(form as Partial<AcademySettings>);
      setSettings(data);
      toast.success('Sozlamalar saqlandi');
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleLogoUpload = (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logotip hajmi 2MB dan oshmasligi kerak");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set('academy_logo', reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const win = window.open('', '_blank', 'width=420,height=700');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Chek — sinov</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print { @page { margin: 8mm; } }
            body { margin: 0; background: #fff; font-family: 'Courier New', monospace; }
          </style>
        </head>
        <body>${printRef.current.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
    };
  };

  const preview = useMemo(
    () => ({
      logo: form.academy_logo || '',
      academyName: form.academy_name || '',
      header: form.receipt_header || '',
      footer: form.receipt_footer || '',
      note: form.receipt_note || '',
      thankYou: form.receipt_thank_you_text || '',
      footerText: form.footer_text || '',
      phone1: form.phone1 || '',
      phone2: form.phone2 || '',
      phone3: form.phone3 || '',
      website: form.website || '',
      instagram: form.instagram || '',
      tgLink: form.telegram_bot_link || '',
      address: form.address || '',
      hasPhones: !!(form.phone1 || form.phone2 || form.phone3),
      hasSocial: !!(form.website || form.instagram || form.telegram_bot_link),
      hasAddress: !!form.address,
    }),
    [form]
  );

  const today = new Date();
  const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
  const dateStr = `${today.getDate()}-${months[today.getMonth()]} ${today.getFullYear()}`;
  const receiptNo = 'REC-20260701-000001';

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-6 w-full max-w-6xl mx-auto space-y-5">
          <Skeleton className="h-16 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
            <Skeleton className="h-[520px] rounded-2xl" />
            <Skeleton className="h-[520px] rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  const rw = form.receipt_width || 320;
  const rfs = form.receipt_font_size || 13;

  const ReceiptPaper = ({ scale = 1 }: { scale?: number }) => (
    <div
      className="bg-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.25)] rounded-sm relative"
      style={{
        width: rw,
        fontFamily: "'Courier New', monospace",
        fontSize: rfs,
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
      }}
    >
      {/* punch holes to sell the "receipt roll" look */}
      <div className="absolute -left-[7px] top-10 w-3.5 h-3.5 rounded-full bg-gray-100 border border-gray-200" />
      <div className="absolute -right-[7px] top-10 w-3.5 h-3.5 rounded-full bg-gray-100 border border-gray-200" />

      <div className="p-4 pt-5 space-y-2 leading-tight text-black">
        {/* Logo + Header */}
        <div className="text-center">
          {preview.logo ? (
            <img src={preview.logo} alt="Logo" className="h-11 mx-auto mb-1.5 object-contain" />
          ) : preview.academyName ? (
            <div className="h-9 w-9 mx-auto mb-1.5 rounded-full bg-amber-600/10 flex items-center justify-center">
              <Building2 className="h-4.5 w-4.5 text-amber-700" />
            </div>
          ) : null}
          {preview.academyName && (
            <p className="font-bold uppercase tracking-wider" style={{ fontSize: rfs + 4 }}>{preview.academyName}</p>
          )}
          {preview.header && <p className="text-gray-600 mt-0.5" style={{ fontSize: rfs - 2 }}>{preview.header}</p>}
          {(preview.academyName || preview.header) && (
            <div className="border-t border-dashed border-gray-400 my-1.5" />
          )}
        </div>

        {/* Receipt meta */}
        <div style={{ fontSize: rfs - 1 }}>
          <div className="flex justify-between">
            <span>Chek №:</span>
            <span className="font-semibold">{receiptNo}</span>
          </div>
          <div className="flex justify-between">
            <span>Sana:</span>
            <span>{dateStr}</span>
          </div>
          <div className="flex justify-between">
            <span>O'quvchi:</span>
            <span>Test User</span>
          </div>
          <div className="flex justify-between">
            <span>Guruh:</span>
            <span>Frontend N3</span>
          </div>
          <div className="border-t border-dashed border-gray-400 my-1.5" />
        </div>

        {/* Items */}
        <div style={{ fontSize: rfs - 1 }}>
          <div className="flex justify-between font-semibold">
            <span>To'lov:</span>
            <span>200,000 so'm</span>
          </div>
          <div className="flex justify-between">
            <span>To'lov turi:</span>
            <span>Naqt</span>
          </div>
          <div className="border-t border-dashed border-gray-400 my-1" />
          <div className="flex justify-between font-bold" style={{ fontSize: rfs + 2 }}>
            <span>JAMI:</span>
            <span>200,000 so'm</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-400 my-1.5" />

        {(preview.tgLink || preview.website || preview.instagram) && (
          <>
            <div className="flex justify-center gap-3 py-1">
              {preview.tgLink && (
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                    <Smartphone className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[6px] text-gray-500">Telegram</span>
                </div>
              )}
              {preview.website && (
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <Globe className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[6px] text-gray-500">Website</span>
                </div>
              )}
              {preview.instagram && (
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-8 h-8 bg-pink-600 rounded flex items-center justify-center">
                    <Instagram className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[6px] text-gray-500">Instagram</span>
                </div>
              )}
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
                <span className="text-[6px] text-gray-500">Tasdiqlangan</span>
              </div>
            </div>
            <div className="border-t border-dashed border-gray-400 my-1.5" />
          </>
        )}

        <div className="text-center space-y-0.5">
          {preview.thankYou && <p className="text-[10px] font-semibold">{preview.thankYou}</p>}
          {preview.footerText && <p className="text-[8px] text-gray-500">{preview.footerText}</p>}
          {preview.footer && <p className="text-[8px] text-gray-600">{preview.footer}</p>}
          {preview.address && <p className="text-[8px] text-gray-500">{preview.address}</p>}
          {preview.hasPhones && (
            <div className="text-[8px] text-gray-500">
              {preview.phone1 && <p>{preview.phone1}</p>}
              {preview.phone2 && <p>{preview.phone2}</p>}
              {preview.phone3 && <p>{preview.phone3}</p>}
            </div>
          )}
          {preview.hasSocial && (
            <p className="text-[8px] text-gray-500">
              {[preview.website, preview.instagram, preview.tgLink].filter(Boolean).join(' | ')}
            </p>
          )}
        </div>
      </div>

      {/* torn bottom edge */}
      <div
        className="h-2.5 w-full"
        style={{
          background: 'inherit',
          backgroundColor: '#fff',
          WebkitMaskImage:
            'linear-gradient(135deg, black 25%, transparent 25.5%), linear-gradient(225deg, black 25%, transparent 25.5%)',
          maskImage:
            'linear-gradient(135deg, black 25%, transparent 25.5%), linear-gradient(225deg, black 25%, transparent 25.5%)',
          WebkitMaskSize: '9px 14px',
          maskSize: '9px 14px',
          WebkitMaskPosition: 'top left',
          maskPosition: 'top left',
          WebkitMaskRepeat: 'repeat-x',
          maskRepeat: 'repeat-x',
        }}
      />
    </div>
  );

  return (
    <Layout>
      <div className="p-4 md:p-6 w-full max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl shadow-sm">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Chek ma'lumotlari</h1>
              <p className="text-gray-400 text-xs mt-0.5">Chek va akademiya ma'lumotlarini sozlash</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} className="text-xs h-9">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Yangilash
            </Button>
            <Button onClick={save} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-xs h-9">
              <Save className="h-3.5 w-3.5 mr-1" /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
          {/* Left: Tabbed form */}
          <div className="space-y-4">
            {/* Tab bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 flex flex-wrap gap-1.5">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Asosiy */}
            {activeTab === 'main' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-600" /> Asosiy ma'lumotlar
                </h3>
                <div>
                  <Label className="text-xs text-gray-500">Akademiya nomi</Label>
                  <Input
                    value={form.academy_name || ''}
                    onChange={(e) => set('academy_name', e.target.value)}
                    placeholder="Masalan: Excellent Academy"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Manzil
                  </Label>
                  <Input
                    value={form.address || ''}
                    onChange={(e) => set('address', e.target.value)}
                    placeholder="Shahar, ko'cha, uy"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Ish vaqti
                  </Label>
                  <Input
                    value={form.working_hours || ''}
                    onChange={(e) => set('working_hours', e.target.value)}
                    placeholder="Dush-Shan: 09:00 - 20:00"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Aloqa va tarmoqlar */}
            {activeTab === 'contact' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-amber-600" /> Aloqa ma'lumotlari
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">Telefon 1</Label>
                      <Input value={form.phone1 || ''} onChange={(e) => set('phone1', e.target.value)} placeholder="+998 90 123 45 67" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Telefon 2</Label>
                      <Input value={form.phone2 || ''} onChange={(e) => set('phone2', e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">Telefon 3</Label>
                      <Input value={form.phone3 || ''} onChange={(e) => set('phone3', e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Email
                      </Label>
                      <Input value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="info@academy.uz" className="mt-1" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-amber-600" /> Ijtimoiy tarmoqlar
                  </h3>
                  <div>
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Website
                    </Label>
                    <Input value={form.website || ''} onChange={(e) => set('website', e.target.value)} placeholder="https://academy.uz" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> Telegram Bot
                    </Label>
                    <Input value={form.telegram_bot_link || ''} onChange={(e) => set('telegram_bot_link', e.target.value)} placeholder="t.me/academy_bot" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                      <Instagram className="h-3 w-3" /> Instagram
                    </Label>
                    <Input value={form.instagram || ''} onChange={(e) => set('instagram', e.target.value)} placeholder="@academy" className="mt-1" />
                  </div>
                </div>
              </div>
            )}

            {/* Chek matni */}
            {activeTab === 'receipt' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Printer className="h-4 w-4 text-amber-600" /> Chek sozlamalari
                </h3>
                <div>
                  <Label className="text-xs text-gray-500">Chek sarlavhasi</Label>
                  <Input value={form.receipt_header || ''} onChange={(e) => set('receipt_header', e.target.value)} placeholder="Rasmiy to'lov cheki" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Chek footer (pastki matn)</Label>
                  <Textarea value={form.receipt_footer || ''} onChange={(e) => set('receipt_footer', e.target.value)} rows={2} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Chek izohi</Label>
                  <Textarea value={form.receipt_note || ''} onChange={(e) => set('receipt_note', e.target.value)} rows={2} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Rahmat matni</Label>
                  <Input value={form.receipt_thank_you_text || ''} onChange={(e) => set('receipt_thank_you_text', e.target.value)} placeholder="Xaridingiz uchun rahmat!" className="mt-1" />
                </div>
              <div>
                <Label className="text-xs text-gray-500">Footer text</Label>
                <Textarea value={form.footer_text || ''} onChange={(e) => set('footer_text', e.target.value)} rows={2} className="mt-1" />
              </div>
              <div className="border-t border-gray-100 pt-4 mt-2">
                <h4 className="text-xs font-bold text-gray-800 mb-3">Chek o'lchamlari</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Chek eni (px)</Label>
                    <Input
                      type="number"
                      value={form.receipt_width ?? 320}
                      onChange={(e) => set('receipt_width', Number(e.target.value) || 320)}
                      min={200}
                      max={600}
                      className="mt-1"
                    />
                    <p className="text-[9px] text-gray-400 mt-0.5">200-600 px, standart: 320</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Shrift hajmi (px)</Label>
                    <Input
                      type="number"
                      value={form.receipt_font_size ?? 13}
                      onChange={(e) => set('receipt_font_size', Number(e.target.value) || 13)}
                      min={8}
                      max={24}
                      className="mt-1"
                    />
                    <p className="text-[9px] text-gray-400 mt-0.5">8-24 px, standart: 13</p>
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* Logotip */}
            {activeTab === 'logo' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-amber-600" /> O'quv markaz logotipi
                </h3>
                <p className="text-xs text-gray-400">
                  Logotip chekning yuqori qismida ko'rinadi. PNG yoki SVG, orqa foni shaffof bo'lgani tavsiya etiladi.
                </p>

                {preview.logo ? (
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                      <img src={preview.logo} alt="Logo" className="max-h-16 max-w-16 object-contain" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="cursor-pointer">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-lg px-3 py-1.5 transition-colors">
                          <UploadCloud className="h-3.5 w-3.5" /> Almashtirish
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
                      </label>
                      <button
                        onClick={() => set('academy_logo', '')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        <XIcon className="h-3.5 w-3.5" /> Logotipni o'chirish
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-8 cursor-pointer hover:border-amber-300 hover:bg-amber-50/40 transition-colors">
                    <UploadCloud className="h-6 w-6 text-gray-400" />
                    <span className="text-xs text-gray-500 font-medium">Logotipni yuklash uchun bosing</span>
                    <span className="text-[10px] text-gray-400">PNG, JPG yoki SVG — 2MB gacha</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Right: Live Receipt Preview */}
          <div className="lg:sticky lg:top-6 self-start space-y-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                  <Printer className="h-3.5 w-3.5" /> Jonli namuna
                </h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                    title="Kichraytirish"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[10px] text-gray-400 w-8 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.15).toFixed(2)))}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                    title="Kattalashtirish"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setFullscreen(true)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                    title="To'liq ekran"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-b from-gray-50 to-gray-100 p-6 flex justify-center overflow-auto max-h-[560px]">
                <div ref={printRef}>
                  <ReceiptPaper scale={zoom} />
                </div>
              </div>

              <div className="px-4 py-3 border-t border-gray-100">
                <Button variant="outline" size="sm" onClick={handlePrint} className="w-full text-xs h-8">
                  <Printer className="h-3.5 w-3.5 mr-1.5" /> Sinov chekni chop etish
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center px-2">
              Ma'lumotlarni kiritganingizda chek ko'rinishi avtomatik yangilanadi. Bo'sh maydonlar chekda ko'rinmaydi.
            </p>
          </div>
        </div>
      </div>

      {/* Fullscreen zoom modal */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setFullscreen(false)}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <Minimize2 className="h-5 w-5" />
          </button>
          <div className="overflow-auto max-h-full py-8" onClick={(e) => e.stopPropagation()}>
            <ReceiptPaper scale={1.7} />
          </div>
        </div>
      )}
    </Layout>
  );
}