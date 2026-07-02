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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, X, Users, Loader2, Plus, ChevronDown } from 'lucide-react';
import { studentsApi, type Student } from '../api/studentApi';
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
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);

  // Create student form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [creatingStudent, setCreatingStudent] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAllStudents();
    } else {
      setSelectedStudents(new Set());
      setSearchTerm('');
      setJoinDate(new Date().toISOString().split('T')[0]);
      setShowCreateForm(false);
      setNewFirstName('');
      setNewLastName('');
      setNewPhone('');
      setNewPassword('123456');
    }
  }, [open]);

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsApi.getAll({ limit: 10000 });
      setStudents(response.data);
    } catch (error) {
      toast.error('Studentlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const normalizeText = (text: string) => {
    return text.toLowerCase().replace(/[''`´"]/g, '').trim();
  };

  const filteredStudents = students.filter((student) => {
    if (!searchTerm.trim()) return true;

    const search = normalizeText(searchTerm);
    const firstName = normalizeText(student.first_name || '');
    const lastName = normalizeText(student.last_name || '');
    const fullName = `${firstName} ${lastName}`;
    const reversedName = `${lastName} ${firstName}`;
    const email = (student.email || '').toLowerCase();
    const phone = (student.phone_number || '').replace(/\D/g, '');

    const searchDigits = search.replace(/\D/g, '');
    const searchWords = search.split(/\s+/).filter(Boolean);

    if (fullName.includes(search) || reversedName.includes(search)) return true;

    if (searchWords.length >= 2) {
      const allWordsMatch = searchWords.every(word =>
        firstName.includes(word) || lastName.includes(word)
      );
      if (allWordsMatch) return true;

      const firstWordFirst = searchWords[0];
      const restWords = searchWords.slice(1).join(' ');
      if (
        (firstName.startsWith(firstWordFirst) && lastName.includes(restWords)) ||
        (lastName.startsWith(firstWordFirst) && firstName.includes(restWords))
      ) return true;
    }

    if (searchWords.length === 1) {
      const word = searchWords[0];
      if (firstName.startsWith(word) || lastName.startsWith(word)) return true;
      if (firstName.includes(word) || lastName.includes(word)) return true;
    }

    if (searchDigits && phone.includes(searchDigits)) return true;
    if (email.includes(search)) return true;

    return false;
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
      const studentIds = Array.from(selectedStudents).map((id) => Number(id));
      await groupStudentsApi.bulkAddStudents(groupId, {
        student_ids: studentIds,
        joined_date: joinDate,
      });
      toast.success(`${selectedStudents.size} ta student guruhga qo'shildi`);
      setSelectedStudents(new Set());
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Studentlarni qo\'shishda xatolik';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newFirstName.trim() || !newLastName.trim()) {
      toast.error('Ism va familiya majburiy');
      return;
    }
    try {
      setCreatingStudent(true);
      const newStudent = await studentsApi.create({
        first_name: newFirstName.trim(),
        last_name: newLastName.trim(),
        phone_number: newPhone.trim() || undefined,
        password: newPassword,
        age: 0,
      });
      const studentId = newStudent.id;
      await groupStudentsApi.bulkAddStudents(groupId, {
        student_ids: [Number(studentId)],
        joined_date: joinDate,
      });
      toast.success(`${newFirstName} ${newLastName} yaratildi va guruhga qo'shildi`);
      setShowCreateForm(false);
      setNewFirstName('');
      setNewLastName('');
      setNewPhone('');
      setNewPassword('123456');
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Xatolik';
      toast.error(msg);
    } finally {
      setCreatingStudent(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white rounded-xl shadow-2xl border-0 p-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Guruhga studentlarni qo'shish
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

        <div className="p-6 overflow-y-auto">
          {/* Create Student Toggle */}
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full flex items-center justify-between p-3 mb-4 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 transition-all"
          >
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-700">Yangi student yaratish va guruhga qo'shish</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-blue-500 transition-transform ${showCreateForm ? 'rotate-180' : ''}`} />
          </button>

          {showCreateForm && (
            <div className="p-4 mb-4 rounded-xl border border-blue-200 bg-blue-50/80 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm text-gray-700">Ism *</Label>
                  <Input
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="Ism"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Familiya *</Label>
                  <Input
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Familiya"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm text-gray-700">Telefon</Label>
                  <Input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+998901234567"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Parol</Label>
                  <Input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="123456"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Bekor qilish
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateAndAdd}
                  disabled={creatingStudent || !newFirstName.trim() || !newLastName.trim()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  {creatingStudent ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-1" />Yaratilmoqda...</>
                  ) : (
                    <><UserPlus className="h-4 w-4 mr-1" />Yaratish va qo'shish</>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Ism, familiya, email yoki telefon..."
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
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-500">Qo'shilgan sana:</span>
                <Input type="date" value={joinDate} onChange={e => setJoinDate(e.target.value)} className="w-40 h-8 text-sm" />
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 text-sm">
              <Users className="h-3 w-3 mr-1 inline" />
              Tanlangan: {selectedStudents.size}
            </Badge>
          </div>

          <ScrollArea className="h-[350px] pr-4 -mr-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-base">Studentlar topilmadi</p>
                <p className="text-sm text-gray-400 mt-1">
                  Qidiruv bo'yicha hech narsa topilmadi
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
                        <span>{student.phone_number || 'Kiritilmagan'}</span>
                      </div>
                      {student.group_students && student.group_students.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {student.group_students
                            .filter(gs => !gs.left_date)
                            .map(gs => (
                              <span
                                key={gs.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                              >
                                {gs.group?.name || 'Noma\'lum guruh'}
                              </span>
                            ))}
                        </div>
                      )}
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
