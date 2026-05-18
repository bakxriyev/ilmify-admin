'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Task } from '../../api/tasksApi';
import AnswerFeedback from '@/components/RightAnswer'; // adjust path

interface SummaryIngPreviewModalProps {
  open: boolean;
  onClose: () => void;
  task: Task;
}

export default function SummaryIngPreviewModal({
  open,
  onClose,
  task,
}: SummaryIngPreviewModalProps) {
  // Parse extra_data
  const sentences = useMemo(() => {
    try {
      const parsed = typeof task.extra_data === 'string' ? JSON.parse(task.extra_data) : task.extra_data;
      return parsed.sentences || [];
    } catch {
      return [];
    }
  }, [task.extra_data]);

  const correctAnswer = useMemo(() => {
    try {
      const ca = task.correct_answer;
      if (typeof ca === 'string') {
        try {
          const parsed = JSON.parse(ca);
          return typeof parsed === 'string' ? parsed : '';
        } catch {
          return ca;
        }
      }
      return '';
    } catch {
      return '';
    }
  }, [task.correct_answer]);

  const [userAnswer, setUserAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Reset when modal opens with new task
  useEffect(() => {
    if (open) {
      setUserAnswer('');
      setChecked(false);
      setIsCorrect(false);
      setShowFeedback(false);
    }
  }, [open, task.id]);

  const handleCheck = () => {
    if (!userAnswer.trim() || checked) return;
    const correct = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    setIsCorrect(correct);
    setChecked(true);
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);
    onClose();
  };

  const getMediaUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return `${base}/uploads/tasks/${path}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {task.title || 'Task Preview'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {task.question_text || 'Combine the sentences using V-ing.'}
          </DialogDescription>
        </DialogHeader>

        <AnswerFeedback show={showFeedback} isCorrect={isCorrect} onNext={handleNext} />

        <div className="py-4 space-y-6">
          {/* Media */}
          {task.photo && (
            <div className="flex justify-center">
              <img
                src={getMediaUrl(task.photo)}
                alt="Task"
                className="max-h-48 rounded-lg shadow-md object-contain"
              />
            </div>
          )}
          {task.audio && (
            <audio controls src={getMediaUrl(task.audio)} className="w-full max-w-md mx-auto" />
          )}
          {task.video && (
            <video controls src={getMediaUrl(task.video)} className="max-h-48 w-full max-w-md mx-auto" />
          )}
          {task.media && (
            <div className="p-3 bg-gray-100 rounded text-sm">
              📎{' '}
              <a
                href={getMediaUrl(task.media)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {task.media}
              </a>
            </div>
          )}

          {/* Sentences to combine */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Combine the following sentences:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-800">
              {sentences.map((s: string, idx: number) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>

          {/* Answer input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Your answer:</label>
            <Textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your combined sentence here..."
              rows={4}
              disabled={checked}
              className={`border-2 ${
                checked
                  ? isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
          </div>

          {/* Check button */}
          {!checked && (
            <div className="flex justify-center">
              <Button
                onClick={handleCheck}
                disabled={!userAnswer.trim()}
                className="px-8 py-2 text-base font-bold bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md disabled:bg-gray-300"
              >
                CHECK
              </Button>
            </div>
          )}

          {/* Result summary */}
          {checked && (
            <div className="text-center text-base font-semibold">
              {isCorrect ? 'Correct!' : 'Wrong answer. Try again?'}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}