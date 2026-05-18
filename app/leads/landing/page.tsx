'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { leadsApi } from '@/api/leadsApi';
import { leadSourcesApi } from '@/api/leadSourcesApi';
import { CheckCircle, Loader2, AlertCircle, GraduationCap } from 'lucide-react';

export default function LeadLandingPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    }>
      <LeadLandingPage />
    </Suspense>
  );
}

function LeadLandingPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const sourceCode = searchParams.get('source');
  const [centerName, setCenterName] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', phone_number: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      leadsApi.getCenterByToken(token)
        .then(center => {
          setCenterName(center.name);
          setLoading(false);
        })
        .catch(() => {
          setTokenError(true);
          setLoading(false);
        });
    } else if (sourceCode) {
      leadSourcesApi.getByCode(sourceCode)
        .then(source => {
          if (source.center) setCenterName(source.center.name);
          setLoading(false);
        })
        .catch(() => {
          setErrorMessage('Noto\'g\'ri havola. Token yoki source kodi noto\'g\'ri.');
          setLoading(false);
        });
    } else {
      setErrorMessage('Havola noto\'g\'ri. Token kerak.');
      setLoading(false);
    }
  }, [token, sourceCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.phone_number) {
      setError('Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await leadsApi.createPublic({
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number,
        comment: form.comment || undefined,
        source_platform: sourceCode || undefined,
        token: token || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <Loader2 className="h-8 w-8 text-white animate-spin" />
    </div>
  );

  if (tokenError || errorMessage) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center bg-white/95 rounded-2xl border-0 shadow-2xl">
        <CardContent className="p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Noto'g'ri havola</h2>
          <p className="text-gray-600">{errorMessage || 'Bu havola noto\'g\'ri yoki muddati o\'tgan.'}</p>
        </CardContent>
      </Card>
    </div>
  );

  if (success) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center bg-white/95 rounded-2xl border-0 shadow-2xl">
        <CardContent className="p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Xabar qabul qilindi!</h2>
          <p className="text-gray-600">Tez orada siz bilan bog'lanamiz.</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl border-0 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {centerName ? centerName : "Ro'yxatdan o'tish"}
          </CardTitle>
          <CardDescription className="text-gray-500">
            Kursga yozilish uchun ma'lumotlaringizni qoldiring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ism <span className="text-red-500">*</span></Label>
                <Input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} placeholder="Ismingiz" required />
              </div>
              <div className="space-y-2">
                <Label>Familiya <span className="text-red-500">*</span></Label>
                <Input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} placeholder="Familiyangiz" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Telefon <span className="text-red-500">*</span></Label>
              <Input type="tel" value={form.phone_number} onChange={e => setForm({...form, phone_number: e.target.value})} placeholder="+998901234567" required />
            </div>
            <div className="space-y-2">
              <Label>Izoh</Label>
              <textarea value={form.comment} onChange={e => setForm({...form, comment: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm min-h-[80px]" placeholder="Kurs haqida savolingiz bormi?" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold py-2.5">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Yuborilmoqda...</> : 'Yuborish'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
