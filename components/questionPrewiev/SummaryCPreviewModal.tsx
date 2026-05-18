// components/questionPrewiev/SummaryCPreviewModal.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowUp, ArrowDown, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Task } from '../../api/tasksApi';

interface SummaryCPreviewModalProps {
  open: boolean;
  onClose: () => void;
  task: Task;
}

export default function SummaryCPreviewModal({ open, onClose, task }: SummaryCPreviewModalProps) {
  const [parts, setParts] = useState<string[]>([]);
  const [correctOrder, setCorrectOrder] = useState<number[]>([]);
  const [userOrder, setUserOrder] = useState<number[]>([]);
  const [checkResult, setCheckResult] = useState<boolean[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Parse task data
  useEffect(() => {
    if (!task) return;

    // Parse extra_data (parts)
    try {
      let extra = task.extra_data;
      if (typeof extra === 'string') {
        extra = JSON.parse(extra);
      }
      if (typeof extra === 'string') {
        extra = JSON.parse(extra);
      }
      if (extra?.parts && Array.isArray(extra.parts)) {
        setParts(extra.parts);
      } else {
        setParts([]);
      }
    } catch (e) {
      console.error('Failed to parse extra_data', e);
      setParts([]);
    }

    // Parse correct_answer (array of indices)
    try {
      let ca = task.correct_answer;
      if (typeof ca === 'string') {
        ca = JSON.parse(ca);
      }
      if (Array.isArray(ca)) {
        setCorrectOrder(ca);
      } else {
        setCorrectOrder([]);
      }
    } catch (e) {
      console.error('Failed to parse correct_answer', e);
      setCorrectOrder([]);
    }
  }, [task]);

  // Shuffle parts initially
  useEffect(() => {
    if (parts.length > 0) {
      const indices = Array.from({ length: parts.length }, (_, i) => i);
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setUserOrder(indices);
      setCheckResult(null);
      setMessage(null);
    }
  }, [parts]);

  // Move item up
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...userOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setUserOrder(newOrder);
    setCheckResult(null);
    setMessage(null);
  };

  // Move item down
  const moveDown = (index: number) => {
    if (index === userOrder.length - 1) return;
    const newOrder = [...userOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setUserOrder(newOrder);
    setCheckResult(null);
    setMessage(null);
  };

  // Check answer
  const handleCheck = () => {
    if (!correctOrder.length || !userOrder.length) return;
    const result = userOrder.map((partIdx, pos) => partIdx === correctOrder[pos]);
    setCheckResult(result);
    if (result.every(Boolean)) {
      setMessage("✅ To'g'ri! Siz qismlarni to'g'ri tartibladingiz.");
    } else {
      setMessage("❌ Xato. Qaytadan urinib ko'ring.");
    }
  };

  // Reset to random shuffle
  const handleShuffle = () => {
    const indices = Array.from({ length: parts.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setUserOrder(indices);
    setCheckResult(null);
    setMessage(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {task.title || 'Summary C Preview'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {task.question_text || 'Put the sentences in the correct order.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Media: Photo */}
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

          {/* Audio */}
          {task.audio && (
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Audio:</p>
              <audio controls src={`${API_BASE_URL}/uploads/tasks/${task.audio}`} className="w-full" />
            </div>
          )}

          {/* Video */}
          {task.video && (
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Video:</p>
              <video controls src={`${API_BASE_URL}/uploads/tasks/${task.video}`} className="max-h-64 rounded-lg" />
            </div>
          )}

          {/* Other media */}
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

          {/* Interactive Parts */}
          {parts.length > 0 ? (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Qismlarni to'g'ri tartibga keltiring:</p>
                <Button variant="outline" size="sm" onClick={handleShuffle} className="h-8">
                  <RefreshCw className="h-3 w-3 mr-1" /> Aralashtirish
                </Button>
              </div>

              <div className="space-y-2">
                {userOrder.map((partIdx, index) => {
                  const partText = parts[partIdx];
                  const isCorrect = checkResult ? checkResult[index] : null;
                  return (
                    <div
                      key={partIdx}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isCorrect === true ? 'bg-green-50 border-green-200' : isCorrect === false ? 'bg-red-50 border-red-200' : 'bg-gray-50'
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                      <span className={`flex-1 text-gray-800 ${isCorrect === false ? 'line-through text-red-500' : ''}`}>
                        {partText}
                      </span>
                      {isCorrect === true && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {isCorrect === false && <XCircle className="h-5 w-5 text-red-500" />}
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveDown(index)}
                          disabled={index === userOrder.length - 1}
                          className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleCheck} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Tekshirish
                </Button>
              </div>

              {message && (
                <Alert className={message.includes('✅') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Qismlar mavjud emas</p>
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