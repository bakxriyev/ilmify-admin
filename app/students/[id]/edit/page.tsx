'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StudentForm, { StudentFormData } from '../../../../components/StudentForm';
import { studentsApi } from '@/api/studentApi';

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const data = await studentsApi.getById(id);
        setStudent(data);
      } catch (err: any) {
        setError(err.message || 'Student maʼlumotlarini yuklashda xatolik');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  const handleSubmit = async (data: StudentFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        first_name: data.first_name,
        last_name: data.last_name,
        age: Number(data.age),
        email: data.email || undefined,
        phone_number: data.phone_number,
        password: data.password || undefined,
        group_id: data.group_id ? Number(data.group_id) : undefined,
        photo: data.photo instanceof File ? data.photo : undefined,
      };

      await studentsApi.update(id, payload);
      router.push(`/students/${id}`);
    } catch (err: any) {
      setError(err.message || 'Studentni yangilashda xatolik');
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

  if (!student) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-6">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Student topilmadi</AlertDescription>
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
            Studentni tahrirlash
          </h1>
          <p className="text-gray-500 mb-6">
            {student.first_name} {student.last_name} maʼlumotlarini yangilang
          </p>

          <Card className="border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Student maʼlumotlari</CardTitle>
              <CardDescription>
                Parolni oʻzgartirish uchun yangi parol kiriting, aks holda boʻsh qoldiring.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentForm
                initialData={{
                  first_name: student.first_name,
                  last_name: student.last_name,
                  age: student.age,
                  email: student.email || '',
                  phone_number: student.phone_number,
                  password: '',
                  group_id: student.group_id || '',
                  photo: student.photo,
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