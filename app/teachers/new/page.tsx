// app/teachers/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import TeacherForm, { TeacherFormData } from '../TeachersForm';
import { teachersApi } from '../../../api/teachersApi.ts';

export default function NewTeacherPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: TeacherFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // 1. Majburiy maydonlarni tekshirish
      if (!data.first_name?.trim()) throw new Error('Ism kiritilishi shart');
      if (!data.last_name?.trim()) throw new Error('Familiya kiritilishi shart');
      if (!data.gmail?.trim()) throw new Error('Email kiritilishi shart');
      if (!data.phone_number?.trim()) throw new Error('Telefon raqam kiritilishi shart');
      if (!data.password || data.password.length < 6) {
        throw new Error('Parol kamida 6 belgidan iborat boʻlishi kerak');
      }
      if (!data.teacher_type) throw new Error('Teacher turi tanlanishi shart');

      // 2. Yoshni tekshirish
      const ageNum = Number(data.age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 100) {
        throw new Error('Yosh 1 dan 100 gacha boʻlishi kerak');
      }

      // 3. FormData yaratish (bitta so'rov uchun)
      const formData = new FormData();
      formData.append('first_name', data.first_name.trim());
      formData.append('last_name', data.last_name.trim());
      formData.append('gmail', data.gmail.trim());
      formData.append('phone_number', data.phone_number.trim());
      formData.append('password', data.password);
      formData.append('age', ageNum.toString());
      formData.append('teacher_type', data.teacher_type);

      // 4. Rasm faylini qo'shish (agar mavjud bo'lsa)
      if (data.photo instanceof File) {
        formData.append('photo', data.photo, data.photo.name);
      } else if (typeof data.photo === 'string' && data.photo) {
        // Agar mavjud URL bo'lsa (tahrirlashda)
        formData.append('photo', data.photo);
      }

      // 5. Konsolga tekshirish uchun
      console.log('📤 Yuborilayotgan FormData:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      // 6. API ga yuborish
      const response = await teachersApi.create(formData);
      console.log('✅ Muvaffaqiyatli javob:', response);

      // 7. Teacherlar ro'yxatiga qaytish
      router.push('/teachers');
    } catch (err: any) {
      console.error('❌ Xatolik:', err);
      
      let errorMessage = 'Oʻqituvchi yaratishda xatolik yuz berdi';
      if (err.response) {
        errorMessage = err.response.data?.message || err.response.data?.error || JSON.stringify(err.response.data);
      } else if (err.request) {
        errorMessage = 'Serverdan javob olinmadi. Internet aloqasini tekshiring.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Orqaga
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Yangi oʻqituvchi qoʻshish</h1>
            <p className="text-gray-500">Oʻqituvchi maʼlumotlarini toʻldiring</p>
          </div>

          <Card className="border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Oʻqituvchi maʼlumotlari</CardTitle>
              <CardDescription>
                <span className="text-red-500">*</span> bilan belgilangan maydonlar toʻldirilishi shart
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeacherForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitLabel="Oʻqituvchi yaratish"
                requirePassword={true}
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