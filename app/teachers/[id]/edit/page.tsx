'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TeacherForm, { TeacherFormData } from '../../TeachersForm';
import { teachersApi } from '@/api/teachersApi';

export default function EditTeacherPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        setLoading(true);
        const data = await teachersApi.getById(id);
        setTeacher(data);
      } catch (err: any) {
        setError(err.message || 'O\'qituvchi maʼlumotlarini yuklashda xatolik');
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [id]);

  const handleSubmit = async (data: TeacherFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (data.photo instanceof File) {
        const fd = new FormData();
        fd.append('photo', data.photo, data.photo.name);
        fd.append('first_name', data.first_name);
        fd.append('last_name', data.last_name);
        fd.append('phone_number', data.phone_number);
        fd.append('teacher_type', data.teacher_type);
        if (data.password) fd.append('password', data.password);
        await teachersApi.update(id, fd);
      } else {
        const payload: Record<string, any> = {
          first_name: data.first_name,
          last_name: data.last_name,
          phone_number: data.phone_number,
          teacher_type: data.teacher_type,
        };
        if (data.password) payload.password = data.password;
        await teachersApi.update(id, payload);
      }
      router.push(`/teachers/${id}`);
    } catch (err: any) {
      setError(err.message || 'O\'qituvchini yangilashda xatolik');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!teacher) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-6">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>O'qituvchi topilmadi</AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Orqaga
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            O'qituvchini tahrirlash
          </h1>
          <p className="text-gray-500 mb-6">
            {teacher.first_name} {teacher.last_name} ma'lumotlarini yangilang
          </p>

          <Card className="border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">O'qituvchi ma'lumotlari</CardTitle>
              <CardDescription>
                Parolni o'zgartirish uchun yangi parol kiriting, aks holda bo'sh qoldiring.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeacherForm
                initialData={{
                  first_name: teacher.first_name,
                  last_name: teacher.last_name,
                  phone_number: teacher.phone_number,
                  password: '',
                  teacher_type: teacher.teacher_type,
                  photo: teacher.photo,
                }}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitLabel="Yangilash"
                requirePassword={false}
                onCancel={() => router.back()}
                error={error}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
