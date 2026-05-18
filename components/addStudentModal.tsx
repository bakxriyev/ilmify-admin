// components/AddStudentsModal.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, X, Users, Loader2 } from 'lucide-react';
import { studentsApi, type Student } from '../api/studentApi';        // ✅ to‘g‘ri import
import { groupStudentsApi } from '../api/groupStudentApi';
import toast from 'react-hot-toast';

interface AddStudentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  groupName: string;
  onSuccess?: () => void;
}

export default function AddStudentsModal({
  open,
  onOpenChange,
  groupId,
  groupName,
  onSuccess,
}: AddStudentsModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      fetchStudentsWithoutGroup();
    } else {
      setSelectedStudents(new Set());
      setSearchTerm('');
    }
  }, [open]);

  const fetchStudentsWithoutGroup = async () => {
    try {
      setLoading(true);
      const response = await studentsApi.getNoGroup(); // ✅ maxsus endpoint
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Studentlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      fullName.includes(search) ||
      student.email?.toLowerCase().includes(search) ||
      student.phone_number.includes(search)
    );
  });

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const toggleAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const handleAddStudents = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Hech qanday student tanlanmagan');
      return;
    }

    try {
      setSubmitting(true);

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const studentIds = Array.from(selectedStudents).map((id) => Number(id));

      // ✅ to‘g‘ri nom: studentIds
      await groupStudentsApi.bulkAddStudents(groupId, {
        student_ids: studentIds,
        joined_date: today,
      });

      toast.success(`${selectedStudents.size} ta student guruhga qo'shildi`);
      setSelectedStudents(new Set());
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error adding students:', error);
      const errorMessage = error.response?.data?.message || 'Studentlarni qo\'shishda xatolik';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white rounded-xl shadow-2xl border-0 p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Guruhga student qo'shish
          </DialogTitle>
          <DialogDescription className="text-blue-100 text-base">
            Guruh: <span className="font-semibold text-white">{groupName}</span>
          </DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Student qidirish (ism, email, telefon)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-base"
            />
          </div>

          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                onCheckedChange={toggleAll}
                className="border-2 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">
                Hammasini tanlash ({filteredStudents.length})
              </span>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 text-sm">
              <Users className="h-3 w-3 mr-1 inline" />
              Tanlangan: {selectedStudents.size}
            </Badge>
          </div>

          <ScrollArea className="h-[400px] pr-4 -mr-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-base">Studentlar topilmadi</p>
                <p className="text-sm text-gray-400 mt-1">
                  Barcha studentlar allaqachon guruhlarga biriktirilgan
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                      selectedStudents.has(student.id)
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                    onClick={() => toggleStudent(student.id)}
                  >
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                      className="border-2 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />

                    <Avatar className="h-12 w-12 border-2 border-gray-200">
                      <AvatarImage src={student.photo || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-semibold">
                        {getInitials(student.first_name, student.last_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-base">
                        {student.first_name} {student.last_name}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        {student.email && (
                          <span className="truncate max-w-[200px]">{student.email}</span>
                        )}
                        <span>{student.phone_number}</span>
                        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-0 text-xs">
                          Yosh: {student.age}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="bg-gray-50 px-6 py-4 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-200 hover:bg-gray-100 text-gray-700 px-6"
          >
            Bekor qilish
          </Button>
          <Button
            onClick={handleAddStudents}
            disabled={selectedStudents.size === 0 || submitting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Qo'shilmoqda...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                {selectedStudents.size} ta student qo'shish
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}