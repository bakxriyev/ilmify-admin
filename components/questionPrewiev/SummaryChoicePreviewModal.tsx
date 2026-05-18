'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Task } from '../../api/tasksApi';
import React from 'react';

interface SummaryChoicePreviewModalProps {
  open: boolean;
  onClose: () => void;
  task: Task;
}

export default function SummaryChoicePreviewModal({
  open,
  onClose,
  task,
}: SummaryChoicePreviewModalProps) {
  // ---------- Memoised parsed data ----------
  const extraData = useMemo(() => {
    try {
      const parsed = typeof task.extra_data === 'string' ? JSON.parse(task.extra_data) : task.extra_data;
      return {
        sentences: parsed.sentences || [],
        options: parsed.options || {},
      };
    } catch {
      return { sentences: [], options: {} };
    }
  }, [task.extra_data]);

  const correctAnswers = useMemo(() => {
    try {
      return typeof task.correct_answer === 'string'
        ? JSON.parse(task.correct_answer)
        : task.correct_answer || {};
    } catch {
      return {};
    }
  }, [task.correct_answer]);

  const totalBlanks = extraData.sentences.length;

  // ---------- State ----------
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [activeBlank, setActiveBlank] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<Record<number, string[]>>({});

  // ---------- Helper: shuffle array ----------
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // ---------- Initialise: shuffle options and set first blank active ----------
  useEffect(() => {
    if (!open) return;

    // Shuffle options for each blank
    const shuffled: Record<number, string[]> = {};
    Object.keys(extraData.options).forEach((key) => {
      const idx = Number(key);
      shuffled[idx] = shuffleArray(extraData.options[idx] || []);
    });
    setShuffledOptions(shuffled);

    // Reset state for new task
    setUserAnswers({});
    setChecked(false);
    setResults([]);
    setActiveBlank(extraData.sentences.length > 0 ? 0 : null);
  }, [open, extraData.sentences, extraData.options]);

  // ---------- Helper: find next empty blank ----------
  const findNextEmpty = (current: number): number | null => {
    for (let i = current + 1; i < totalBlanks; i++) {
      if (!userAnswers[i]) return i;
    }
    for (let i = 0; i < current; i++) {
      if (!userAnswers[i]) return i;
    }
    return null;
  };

  // ---------- Handlers ----------
  const handleBlankClick = (blankIndex: number) => {
    if (checked) return;
    if (userAnswers[blankIndex]) {
      // Clear this blank
      const newAnswers = { ...userAnswers };
      delete newAnswers[blankIndex];
      setUserAnswers(newAnswers);
      setActiveBlank(blankIndex);
    } else {
      setActiveBlank(blankIndex);
    }
  };

  const handleOptionClick = (option: string) => {
    if (checked || activeBlank === null) return;

    const newAnswers = { ...userAnswers, [activeBlank]: option };
    setUserAnswers(newAnswers);

    const nextBlank = findNextEmpty(activeBlank);
    setActiveBlank(nextBlank);
  };

  const allFilled = extraData.sentences.every((_: unknown, idx: number) => userAnswers[idx]?.trim());

  const handleCheck = () => {
    if (!allFilled || checked) return;

    const newResults = extraData.sentences.map(
      (_: unknown, idx: number) => userAnswers[idx] === correctAnswers[idx]
    );
    setResults(newResults);
    setChecked(true);
  };

  // ---------- Media URL helper ----------
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
            {task.question_text || 'Fill in the blanks using the given options.'}
          </DialogDescription>
        </DialogHeader>

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

          {/* Sentences with blanks */}
          <div className="space-y-4">
            {extraData.sentences.map((sentence, idx) => {
              const parts = sentence.split('___');
              const isActive = activeBlank === idx;
              const answer = userAnswers[idx];
              const isCorrectAnswer = checked ? results[idx] : null;

              return (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-base text-gray-800 flex-1 leading-relaxed">
                    {parts.map((part, i) => (
                      <React.Fragment key={i}>
                        {part}
                        {i < parts.length - 1 && (
                          <button
                            onClick={() => handleBlankClick(idx)}
                            disabled={checked}
                            className={`
                              mx-1 px-3 py-1 rounded-lg border-2 font-medium transition
                              min-w-[70px] text-center
                              ${
                                checked
                                  ? isCorrectAnswer
                                    ? 'border-green-500 bg-green-500 text-white'
                                    : 'border-red-500 bg-red-500 text-white'
                                  : isActive
                                  ? 'border-blue-500 bg-blue-100 text-blue-800'
                                  : answer
                                  ? 'border-gray-400 bg-white text-gray-800 cursor-pointer hover:border-blue-400'
                                  : 'border-dashed border-gray-300 bg-gray-50 text-gray-500 cursor-pointer hover:border-blue-400'
                              }
                            `}
                          >
                            {answer || '_____'}
                          </button>
                        )}
                      </React.Fragment>
                    ))}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom bar – options and check (only when not checked) */}
          {!checked && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between gap-4">
                {/* Left side: options (centered) or hint */}
                <div className="flex-1 flex justify-center">
                  {activeBlank !== null ? (
                    <div className="flex flex-wrap gap-3 justify-center">
                      {(shuffledOptions[activeBlank] || []).map((opt) => {
                        const isSelected = userAnswers[activeBlank] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleOptionClick(opt)}
                            className={`
                              px-5 py-2.5 rounded-full border-2 text-sm font-medium transition
                              ${
                                isSelected
                                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-700 hover:shadow'
                              }
                            `}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic text-center">
                      {allFilled
                        ? 'All blanks filled! Ready to check.'
                        : 'Click a blank to see its options.'}
                    </p>
                  )}
                </div>

                {/* Right side: check button (only when all filled) */}
                {allFilled && (
                  <button
                    onClick={handleCheck}
                    className="px-6 py-2 text-base font-bold bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition flex-shrink-0"
                  >
                    CHECK
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Result summary after check */}
          {checked && (
            <div className="text-center text-base font-semibold pt-2">
              You got {results.filter(Boolean).length} out of {totalBlanks} correct.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}