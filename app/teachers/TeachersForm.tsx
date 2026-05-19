// components/TeacherForm.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Phone, Key, Upload, X, AlertCircle, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type TeacherType = 'MAIN_TEACHER' | 'SUPPORT';

export interface TeacherFormData {
  first_name: string;
  last_name: string;
  phone_number: string;
  password?: string;
  teacher_type: TeacherType;
  photo: File | string | null;
}

interface TeacherFormProps {
  initialData?: Partial<TeacherFormData>;
  onSubmit: (data: TeacherFormData) => Promise<void>;
  isSubmitting: boolean;
  submitLabel: string;
  requirePassword?: boolean;
  onCancel: () => void;
  error?: string | null;
}

export default function TeacherForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel,
  requirePassword = false,
  onCancel,
  error,
}: TeacherFormProps) {
  const [formData, setFormData] = useState<TeacherFormData>({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    phone_number: initialData?.phone_number || '',
    password: initialData?.password || '',
    teacher_type: initialData?.teacher_type || 'SUPPORT',
    photo: initialData?.photo || null,
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(
    typeof initialData?.photo === 'string'
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/teachers/${initialData.photo}`
      : null
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (value: TeacherType) => {
    setFormData((prev) => ({ ...prev, teacher_type: value }));
    if (validationErrors.teacher_type) {
      setValidationErrors((prev) => ({ ...prev, teacher_type: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setFormData((prev) => ({ ...prev, photo: file }));
  };

  const clearPhoto = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    setFormData((prev) => ({ ...prev, photo: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.first_name.trim()) errors.first_name = 'Ism kiritilishi shart';
    if (!formData.last_name.trim()) errors.last_name = 'Familiya kiritilishi shart';
    if (!formData.phone_number.trim()) errors.phone_number = 'Telefon raqami kiritilishi shart';
    if (!formData.teacher_type) {
      errors.teacher_type = 'Teacher turi tanlanishi shart';
    }
    if (requirePassword && !formData.password?.trim()) {
      errors.password = 'Parol kiritilishi shart';
    } else if (requirePassword && formData.password && formData.password.length < 6) {
      errors.password = 'Parol kamida 6 belgidan iborat boʻlishi kerak';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Photo Upload */}
      <div className="space-y-2">
        <Label htmlFor="photo" className="text-gray-700 font-medium">Rasm</Label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden border-2 border-blue-200">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-blue-400" />
              )}
            </div>
            {photoPreview && (
              <button
                type="button"
                onClick={clearPhoto}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
                title="Rasmni olib tashlash"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Fayl tanlash
            </Button>
            <input
              ref={fileInputRef}
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-gray-400">
              Qoʻllab-quvvatlanadigan formatlar: JPG, PNG, GIF. Maksimal 5MB.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div className="space-y-2">
          <Label htmlFor="first_name" className="text-gray-700 font-medium">
            Ism <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Ism"
              className={`pl-10 ${validationErrors.first_name ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500" />
          </div>
          {validationErrors.first_name && (
            <p className="text-sm text-red-600">{validationErrors.first_name}</p>
          )}
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <Label htmlFor="last_name" className="text-gray-700 font-medium">
            Familiya <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Familiya"
              className={`pl-10 ${validationErrors.last_name ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
          </div>
          {validationErrors.last_name && (
            <p className="text-sm text-red-600">{validationErrors.last_name}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone_number" className="text-gray-700 font-medium">
            Telefon <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="+998901234567"
              className={`pl-10 ${validationErrors.phone_number ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
            />
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-500" />
          </div>
          {validationErrors.phone_number && (
            <p className="text-sm text-red-600">{validationErrors.phone_number}</p>
          )}
        </div>

        {/* Teacher Type */}
        <div className="space-y-2">
          <Label htmlFor="teacher_type" className="text-gray-700 font-medium">
            Teacher turi <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Select
              value={formData.teacher_type}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger className={`pl-10 ${validationErrors.teacher_type ? 'border-red-500' : 'border-gray-300'}`}>
                <SelectValue placeholder="Teacher turini tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MAIN_TEACHER">Asosiy o'qituvchi (MAIN_TEACHER)</SelectItem>
                <SelectItem value="SUPPORT">Yordamchi o'qituvchi (SUPPORT)</SelectItem>
              </SelectContent>
            </Select>
            <UserCog className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-indigo-500" />
          </div>
          {validationErrors.teacher_type && (
            <p className="text-sm text-red-600">{validationErrors.teacher_type}</p>
          )}
        </div>

        {/* Password */}
        {requirePassword && (
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Parol <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                className={`pl-10 ${validationErrors.password ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
              />
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
            </div>
            {validationErrors.password && (
              <p className="text-sm text-red-600">{validationErrors.password}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-gray-300 hover:bg-gray-100 text-gray-700"
        >
          Bekor qilish
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saqlanmoqda...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}