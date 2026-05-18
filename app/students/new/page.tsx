'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { ArrowLeft, User, Phone, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import StudentForm, { StudentFormData } from '@/components/StudentForm';
import { studentsApi } from '../../../api/studentApi';

export default function NewStudentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parent fields
  const [parentFirstName, setParentFirstName] = useState('');
  const [parentLastName, setParentLastName] = useState('');
  const [parentPhoneNumber, setParentPhoneNumber] = useState('');

  const handleSubmit = async (data: StudentFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!data.first_name?.trim()) throw new Error('Ism kiritilishi shart');
      if (!data.last_name?.trim()) throw new Error('Familiya kiritilishi shart');
      if (!data.age) throw new Error('Yosh kiritilishi shart');
      if (!data.phone_number?.trim()) throw new Error('Telefon raqam kiritilishi shart');
      if (!data.password || data.password.length < 6) {
        throw new Error('Parol kamida 6 belgidan iborat boʻlishi kerak');
      }

      const ageNum = Number(data.age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 100) {
        throw new Error('Yosh 1 dan 100 gacha boʻlishi kerak');
      }

      const formData = new FormData();
      formData.append('first_name', data.first_name.trim());
      formData.append('last_name', data.last_name.trim());
      formData.append('age', ageNum.toString());
      formData.append('phone_number', data.phone_number.trim());
      formData.append('password', data.password);

      if (data.email?.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          throw new Error('Email notoʻgʻri formatda');
        }
        formData.append('email', data.email.trim());
      }

      if (data.photo instanceof File) {
        formData.append('photo', data.photo, data.photo.name);
      } else if (typeof data.photo === 'string' && data.photo) {
        formData.append('photo', data.photo);
      }

      // Parent fields (optional)
      if (parentFirstName.trim()) {
        formData.append('parent_first_name', parentFirstName.trim());
      }
      if (parentLastName.trim()) {
        formData.append('parent_last_name', parentLastName.trim());
      }
      if (parentPhoneNumber.trim()) {
        formData.append('parent_phone_number', parentPhoneNumber.trim());
      }

      await studentsApi.create(formData);

      router.push('/students');
    } catch (err: any) {
      console.error('Xatolik:', err);
      const backendMessage = err.response?.data?.message;
      const message = backendMessage || err.message || 'Student qoʻshishda xatolik';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Orqaga
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Yangi Student Qoʻshish</h1>
          <p className="text-gray-500 mb-6">Student maʼlumotlarini toʻldiring</p>

          <Card className="border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Student maʼlumotlari</CardTitle>
              <CardDescription>
                <span className="text-red-500">*</span> belgisi majburiy maydonlar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitLabel="Student Qoʻshish"
                requirePassword={true}
                onCancel={() => router.back()}
                error={error}
              />
            </CardContent>
          </Card>

          {/* Parent Information Section */}
          <Card className="border-gray-100 shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                Ota-ona ma'lumotlari
              </CardTitle>
              <CardDescription>
                Ota-onaning ma'lumotlari ixtiyoriy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="parent_first_name" className="text-gray-700 font-medium">
                    Ota-ona ismi
                  </Label>
                  <div className="relative">
                    <Input
                      id="parent_first_name"
                      value={parentFirstName}
                      onChange={(e) => setParentFirstName(e.target.value)}
                      placeholder="Ota-ona ismi"
                      className="pl-10 border-gray-300 focus:border-pink-500"
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-pink-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_last_name" className="text-gray-700 font-medium">
                    Ota-ona familiyasi
                  </Label>
                  <div className="relative">
                    <Input
                      id="parent_last_name"
                      value={parentLastName}
                      onChange={(e) => setParentLastName(e.target.value)}
                      placeholder="Ota-ona familiyasi"
                      className="pl-10 border-gray-300 focus:border-pink-500"
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_phone_number" className="text-gray-700 font-medium">
                    Ota-ona telefoni
                  </Label>
                  <div className="relative">
                    <Input
                      id="parent_phone_number"
                      value={parentPhoneNumber}
                      onChange={(e) => setParentPhoneNumber(e.target.value)}
                      placeholder="+998901234567"
                      className="pl-10 border-gray-300 focus:border-pink-500"
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}