'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Task } from '../../api/tasksApi';
import AnswerFeedback from '@/components/RightAnswer'; // adjust path

interface SummaryNoPreviewModalProps {
  open: boolean;
  onClose: () => void;
  task: Task;
}

export default function SummaryNoPreviewModal({
  open,
  onClose,
  task,
}: SummaryNoPreviewModalProps) {
  // Parse extra_data
  const { sentence, options } = useMemo(() => {
    try {
      const parsed = typeof task.extra_data === 'string' ? JSON.parse(task.extra_data) : task.extra_data;
      return {
        sentence: parsed.sentence || '',
        options: parsed.options || [],
      };
    } catch {
      return { sentence: '', options: [] };
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

  const [selectedOption, setSelectedOption] = useState('');
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setSelectedOption('');
      setChecked(false);
      setIsCorrect(false);
      setShowFeedback(false);
    }
  }, [open, task.id]);

  const handleCheck = () => {
    if (!selectedOption || checked) return;
    const correct = selectedOption === correctAnswer;
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
            {task.question_text || ''}
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

          {/* Sentence */}
          {sentence && (
            <div className="text-gray-800 text-base bg-gray-50 p-4 rounded-lg border">
              {sentence}
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Select one:</p>
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption} disabled={checked}>
              {options.map((opt: string, idx: number) => (
                <div key={idx} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt} id={`opt-${idx}`} />
                  <Label htmlFor={`opt-${idx}`} className="text-gray-800">
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Check button */}
          {!checked && (
            <div className="flex justify-center">
              <Button
                onClick={handleCheck}
                disabled={!selectedOption}
                className="px-8 py-2 text-base font-bold bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md disabled:bg-gray-300"
              >
                CHECK
              </Button>
            </div>
          )}

          {/* Result summary */}
          {checked && (
            <div className="text-center text-base font-semibold">
              {isCorrect ? 'Correct!' : 'Wrong answer.'}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}