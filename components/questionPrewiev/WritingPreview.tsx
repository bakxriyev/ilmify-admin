'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Task } from '../../api/tasksApi';

interface SummaryWritingPreviewModalProps {
  open: boolean;
  onClose: () => void;
  task: Task;
}

export default function SummaryWritingPreviewModal({
  open,
  onClose,
  task,
}: SummaryWritingPreviewModalProps) {
  const [studentAnswer, setStudentAnswer] = useState('');
  const [showModel, setShowModel] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleCheck = () => {
    setShowModel(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {task.title || 'Writing Preview'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {task.question_text || 'Write a summary of the text.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Media (rasm, audio, video, fayl) */}
          {task.photo && (
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Rasm:</p>
              <img
                src={`${API_BASE_URL}/uploads/tasks/${task.photo}`}
                alt="Task"
                className="max-h-64 rounded-lg object-contain mx-auto"
              />
            </div>
          )}

          {task.audio && (
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Audio:</p>
              <audio controls src={`${API_BASE_URL}/uploads/tasks/${task.audio}`} className="w-full" />
            </div>
          )}

          {task.video && (
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Video:</p>
              <video controls src={`${API_BASE_URL}/uploads/tasks/${task.video}`} className="max-h-64 rounded-lg" />
            </div>
          )}

          {task.media && (
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Media fayl:</p>
              <a
                href={`${API_BASE_URL}/uploads/tasks/${task.media}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {task.media}
              </a>
            </div>
          )}

          {/* Writing maydoni */}
          <div className="border rounded-lg p-4 space-y-4">
            <p className="text-sm font-medium text-gray-700">Sizning javobingiz:</p>
            <Textarea
              value={studentAnswer}
              onChange={(e) => setStudentAnswer(e.target.value)}
              placeholder="Bu yerga yozing..."
              rows={6}
              className="border-gray-300"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStudentAnswer('')}>
                Tozalash
              </Button>
              <Button onClick={handleCheck} className="bg-blue-600 hover:bg-blue-700 text-white">
                Tekshirish
              </Button>
            </div>
          </div>

          {/* Model javob (agar mavjud bo‘lsa va foydalanuvchi ko‘rsatmoqchi bo‘lsa) */}
          {showModel && task.correct_answer && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription>
                <p className="font-medium text-green-800 mb-1">Model javob:</p>
                <p className="text-gray-700 whitespace-pre-wrap">{task.correct_answer}</p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Yopish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}