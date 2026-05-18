'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { tasksApi, Task } from '../../api/tasksApi';

interface SummaryChoiceModalProps {
  open: boolean;
  onClose: () => void;
  exerciseId: number;
  task?: Task | null;   // for edit (if we reuse, but here it's simple creation)
  onSuccess: () => void;
}

export default function SummaryChoiceModal({
  open,
  onClose,
  exerciseId,
  task,
  onSuccess,
}: SummaryChoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic fields
  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('Fill in the blanks using the given options.');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);

  // Sentences with blanks (each sentence has one blank represented by ___)
  const [sentences, setSentences] = useState<string[]>([]);

  // Options for each blank: index -> array of strings
  const [options, setOptions] = useState<Record<number, string[]>>({});

  // Correct answer for each blank: index -> string (must be one of the options)
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, string>>({});

  // For adding a new option to a specific sentence
  const [newOptionText, setNewOptionText] = useState<Record<number, string>>({});

  // Load task data when editing (if task is provided)
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setQuestionText(task.question_text || 'Fill in the blanks using the given options.');

      // Photo
      if (task.photo) {
        setExistingPhoto(task.photo);
        setPhotoPreview(null);
        setPhotoFile(null);
      } else {
        setExistingPhoto(null);
      }

      // Parse extra_data: { sentences, options }
      if (task.extra_data) {
        try {
          const extra = typeof task.extra_data === 'string' ? JSON.parse(task.extra_data) : task.extra_data;
          if (extra.sentences) setSentences(extra.sentences);
          if (extra.options) setOptions(extra.options);
        } catch (e) {
          console.error('Failed to parse extra_data', e);
          setSentences([]);
          setOptions({});
        }
      }

      // Parse correct_answer: { index: correct }
      if (task.correct_answer) {
        try {
          const ca = typeof task.correct_answer === 'string' ? JSON.parse(task.correct_answer) : task.correct_answer;
          setCorrectAnswers(ca || {});
        } catch (e) {
          console.error('Failed to parse correct_answer', e);
          setCorrectAnswers({});
        }
      }
    } else {
      // Reset for new task
      setTitle('');
      setQuestionText('Fill in the blanks using the given options.');
      setPhotoFile(null);
      setPhotoPreview(null);
      setExistingPhoto(null);
      setSentences([]);
      setOptions({});
      setCorrectAnswers({});
      setNewOptionText({});
    }
  }, [task]);

  // ---------- Photo handling ----------
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
      setExistingPhoto(null);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setExistingPhoto(null);
  };

  // ---------- Sentences management ----------
  const addSentence = () => {
    const newIndex = sentences.length;
    setSentences([...sentences, 'New sentence with ___']);
    // Initialize empty options and newOptionText for this index
    setOptions({ ...options, [newIndex]: [] });
    setNewOptionText({ ...newOptionText, [newIndex]: '' });
  };

  const updateSentence = (index: number, value: string) => {
    const newSentences = [...sentences];
    newSentences[index] = value;
    setSentences(newSentences);
  };

  const removeSentence = (index: number) => {
    const newSentences = sentences.filter((_, i) => i !== index);
    setSentences(newSentences);

    // Remove options, correctAnswer, newOptionText for this index and reindex subsequent ones
    const newOptions: Record<number, string[]> = {};
    const newCorrect: Record<number, string> = {};
    const newNewOptionText: Record<number, string> = {};

    Object.entries(options).forEach(([idx, opts]) => {
      const numIdx = parseInt(idx);
      if (numIdx < index) {
        newOptions[numIdx] = opts;
      } else if (numIdx > index) {
        newOptions[numIdx - 1] = opts;
      }
    });

    Object.entries(correctAnswers).forEach(([idx, ans]) => {
      const numIdx = parseInt(idx);
      if (numIdx < index) {
        newCorrect[numIdx] = ans;
      } else if (numIdx > index) {
        newCorrect[numIdx - 1] = ans;
      }
    });

    Object.entries(newOptionText).forEach(([idx, text]) => {
      const numIdx = parseInt(idx);
      if (numIdx < index) {
        newNewOptionText[numIdx] = text;
      } else if (numIdx > index) {
        newNewOptionText[numIdx - 1] = text;
      }
    });

    setOptions(newOptions);
    setCorrectAnswers(newCorrect);
    setNewOptionText(newNewOptionText);
  };

  // ---------- Options management for a specific blank ----------
  const addOption = (index: number) => {
    const text = newOptionText[index]?.trim();
    if (!text) return;
    const currentOptions = options[index] || [];
    setOptions({ ...options, [index]: [...currentOptions, text] });
    setNewOptionText({ ...newOptionText, [index]: '' });
  };

  const removeOption = (sentenceIndex: number, optionIndex: number) => {
    const currentOptions = options[sentenceIndex] || [];
    const optionToRemove = currentOptions[optionIndex];
    const newOpts = currentOptions.filter((_, i) => i !== optionIndex);
    setOptions({ ...options, [sentenceIndex]: newOpts });

    // If the removed option was the correct answer, clear it
    if (correctAnswers[sentenceIndex] === optionToRemove) {
      const newCorrect = { ...correctAnswers };
      delete newCorrect[sentenceIndex];
      setCorrectAnswers(newCorrect);
    }
  };

  // ---------- Validation and save ----------
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!title.trim()) throw new Error('Название задания обязательно');
      if (sentences.length === 0) throw new Error('Добавьте хотя бы одно предложение');

      // Validate each sentence has options and a correct answer selected
      for (let i = 0; i < sentences.length; i++) {
        const opts = options[i] || [];
        if (opts.length === 0) throw new Error(`Для предложения ${i + 1} добавьте хотя бы один вариант`);
        if (!correctAnswers[i]) throw new Error(`Для предложения ${i + 1} выберите правильный ответ`);
      }

      // Prepare JSON data
      const extraData = JSON.stringify({ sentences, options });
      const correctAnswerJson = JSON.stringify(correctAnswers);

      const formData = new FormData();
      formData.append('exercise_id', exerciseId.toString());
      formData.append('title', title);
      formData.append('question_text', questionText);
      formData.append('extra_data', extraData);
      formData.append('correct_answer', correctAnswerJson);
      if (photoFile) formData.append('photo', photoFile);

      if (task) {
        // Update
        await tasksApi.updateTask(task.id, {
          title,
          question_text: questionText,
          extra_data: extraData,
          correct_answer: correctAnswerJson,
          photo: photoFile || undefined,
        });
      } else {
        // Create
        await tasksApi.createTask({
          exercise_id: exerciseId,
          title,
          question_text: questionText,
          extra_data: extraData,
          correct_answer: correctAnswerJson,
          photo: photoFile || undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {task ? 'Редактировать задание' : 'Новое задание (Summary Choice)'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Заполните поля для задания с выбором из собственных вариантов для каждого пропуска.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-700">
              Название задания <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Fill in the blanks"
              disabled={loading}
              className="border-gray-300"
            />
          </div>

          {/* Question text */}
          <div className="space-y-2">
            <Label htmlFor="questionText" className="text-gray-700">Инструкция</Label>
            <Input
              id="questionText"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Fill in the blanks using the given options."
              disabled={loading}
              className="border-gray-300"
            />
          </div>

          {/* Photo */}
          <div className="space-y-2 border rounded-lg p-4">
            <Label className="text-gray-700">Изображение (необязательно)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={loading}
              className="border-gray-300"
            />
            {(photoPreview || existingPhoto) && (
              <div className="mt-2 relative inline-block">
                <img
                  src={photoPreview || existingPhoto || ''}
                  alt="Preview"
                  className="max-h-40 rounded border"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removePhoto}
                  className="absolute top-1 right-1 h-6 w-6 p-0 bg-white rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Sentences with options */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-gray-700 font-medium">Предложения с пропусками</Label>
              <Button type="button" onClick={addSentence} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" /> Добавить предложение
              </Button>
            </div>

            {sentences.map((sentence, idx) => (
              <div key={idx} className="border rounded-lg p-3 space-y-3 bg-gray-50">
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-gray-500 w-6 mt-2">{idx + 1}.</span>
                  <div className="flex-1">
                    <Input
                      value={sentence}
                      onChange={(e) => updateSentence(idx, e.target.value)}
                      placeholder="Предложение с ___"
                      className="border-gray-300"
                      disabled={loading}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSentence(idx)}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Options for this blank */}
                <div className="ml-8 space-y-2">
                  <Label className="text-sm text-gray-600">Варианты для этого пропуска:</Label>
                  <div className="flex flex-wrap gap-2">
                    {(options[idx] || []).map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center bg-white border rounded-full px-3 py-1 text-sm shadow-sm">
                        <span>{opt}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(idx, optIdx)}
                          className="h-5 w-5 p-0 ml-1 text-gray-500 hover:text-red-600"
                          disabled={loading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add new option */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newOptionText[idx] || ''}
                      onChange={(e) => setNewOptionText({ ...newOptionText, [idx]: e.target.value })}
                      placeholder="Новый вариант"
                      className="border-gray-300 flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && addOption(idx)}
                      disabled={loading}
                    />
                    <Button type="button" onClick={() => addOption(idx)} size="sm" variant="outline" disabled={loading || !newOptionText[idx]?.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Correct answer selector */}
                  <div className="mt-2">
                    <Select
                      value={correctAnswers[idx] || ''}
                      onValueChange={(val) => setCorrectAnswers({ ...correctAnswers, [idx]: val })}
                      disabled={loading || (options[idx]?.length || 0) === 0}
                    >
                      <SelectTrigger className="w-48 border-gray-300">
                        <SelectValue placeholder="Правильный ответ" />
                      </SelectTrigger>
                      <SelectContent>
                        {(options[idx] || []).map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            {sentences.length === 0 && (
              <p className="text-gray-400 text-center py-4">Нет предложений. Нажмите "Добавить предложение".</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Сохранение...
              </>
            ) : task ? 'Обновить' : 'Создать'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}