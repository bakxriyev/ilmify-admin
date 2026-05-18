'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { tasksApi, Task } from '../../api/tasksApi.ts';

interface SummaryDModalProps {
  open: boolean;
  onClose: () => void;
  exerciseId: number;
  task?: Task | null;   
  onSuccess: () => void;
}

export default function SummaryDModal({ open, onClose, exerciseId, task, onSuccess }: SummaryDModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('Fill in the blanks using the given words.');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);

  // Word bank (как массив строк)
  const [words, setWords] = useState<string[]>(['between', 'next to', 'near', 'in front of', 'behind']);

  // Предложения с пропусками
  const [sentences, setSentences] = useState<string[]>([
    'The lake is located ___ Area A and Area D.',
    'Area C is ___ the West Entrance.',
    'Area B is ___ the housing for the elderly.',
    'Area F is ___ the trees.',
    'The trees are ___ Area H.',
  ]);

  // Правильные ответы: индекс предложения → слово
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, string>>({});

  // Вспомогательное поле для ввода нового слова
  const [newWord, setNewWord] = useState('');

  // ---------- При редактировании заполняем форму из task ----------
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setQuestionText(task.question_text || '');

      // Фото
      if (task.photo) {
        setExistingPhoto(task.photo);
        setPhotoPreview(null);
        setPhotoFile(null);
      } else {
        setExistingPhoto(null);
      }

      // extra_data: { words, sentences }
      if (task.extra_data) {
        try {
          const extra = typeof task.extra_data === 'string' ? JSON.parse(task.extra_data) : task.extra_data;
          if (extra.words) setWords(extra.words);
          if (extra.sentences) setSentences(extra.sentences);
        } catch (e) {
          console.error('Failed to parse extra_data', e);
        }
      }

      // correct_answer: { index: word }
      if (task.correct_answer) {
        try {
          const ca = typeof task.correct_answer === 'string' ? JSON.parse(task.correct_answer) : task.correct_answer;
          setCorrectAnswers(ca || {});
        } catch (e) {
          console.error('Failed to parse correct_answer', e);
        }
      }
    } else {
      // Сброс для нового задания
      setTitle('');
      setQuestionText('Fill in the blanks using the given words.');
      setPhotoFile(null);
      setPhotoPreview(null);
      setExistingPhoto(null);
      setWords(['between', 'next to', 'near', 'in front of', 'behind']);
      setSentences([
        'The lake is located ___ Area A and Area D.',
        'Area C is ___ the West Entrance.',
        'Area B is ___ the housing for the elderly.',
        'Area F is ___ the trees.',
        'The trees are ___ Area H.',
      ]);
      setCorrectAnswers({});
      setNewWord('');
    }
  }, [task]);

  // ---------- Обработчики фото ----------
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

  // ---------- Работа со словами ----------
  const addWord = () => {
    if (newWord.trim()) {
      setWords([...words, newWord.trim()]);
      setNewWord('');
    }
  };

  const removeWord = (index: number) => {
    const newWords = words.filter((_, i) => i !== index);
    setWords(newWords);
    // Удаляем это слово из correctAnswers, если оно там было
    const updatedCA = { ...correctAnswers };
    Object.keys(updatedCA).forEach(key => {
      if (updatedCA[parseInt(key)] === words[index]) {
        delete updatedCA[parseInt(key)];
      }
    });
    setCorrectAnswers(updatedCA);
  };

  // ---------- Работа с предложениями ----------
  const updateSentence = (index: number, value: string) => {
    const newSentences = [...sentences];
    newSentences[index] = value;
    setSentences(newSentences);
  };

  const addSentence = () => {
    setSentences([...sentences, 'New sentence with ___']);
  };

  const removeSentence = (index: number) => {
    const newSentences = sentences.filter((_, i) => i !== index);
    setSentences(newSentences);
    // Удаляем правильный ответ для этого индекса
    const updatedCA = { ...correctAnswers };
    delete updatedCA[index];
    // Сдвигаем индексы у последующих ответов
    const reindexedCA: Record<number, string> = {};
    Object.entries(updatedCA).forEach(([idx, word]) => {
      const numIdx = parseInt(idx);
      if (numIdx > index) {
        reindexedCA[numIdx - 1] = word;
      } else {
        reindexedCA[numIdx] = word;
      }
    });
    setCorrectAnswers(reindexedCA);
  };

  // ---------- Валидация и сохранение ----------
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Проверки
      if (!title.trim()) throw new Error('Название задания обязательно');
      if (words.length === 0) throw new Error('Добавьте хотя бы одно слово');
      if (sentences.length === 0) throw new Error('Добавьте хотя бы одно предложение');

      // Подготовка JSON полей
      const extraData = JSON.stringify({ words, sentences });
      const correctAnswer = JSON.stringify(correctAnswers);

      // FormData для отправки на бэкенд
      const formData = new FormData();
      formData.append('exercise_id', exerciseId.toString());
      formData.append('title', title);
      formData.append('question_text', questionText);
      formData.append('extra_data', extraData);
      formData.append('correct_answer', correctAnswer);
      if (photoFile) formData.append('photo', photoFile);

      if (task) {
        // Редактирование
        await tasksApi.updateTask(task.id, {
          title,
          question_text: questionText,
          extra_data: extraData,
          correct_answer: correctAnswer,
          photo: photoFile || undefined,
        });
      } else {
        // Создание
        await tasksApi.createTask({
          exercise_id: exerciseId,
          title,
          question_text: questionText,
          extra_data: extraData,
          correct_answer: correctAnswer,
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
            {task ? 'Редактировать задание' : 'Новое задание (Summary D)'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Заполните поля для задания с выбором слов из банка.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 py-4">
          {/* Название */}
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

          {/* Инструкция (question_text) */}
          <div className="space-y-2">
            <Label htmlFor="questionText" className="text-gray-700">Инструкция</Label>
            <Input
              id="questionText"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Fill in the blanks using the given words."
              disabled={loading}
              className="border-gray-300"
            />
          </div>

          {/* Фото */}
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

          {/* Банк слов */}
          <div className="border rounded-lg p-4 space-y-3">
            <Label className="text-gray-700 font-medium">Банк слов</Label>
            <div className="flex flex-wrap gap-2">
              {words.map((word, idx) => (
                <div key={idx} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                  <span>{word}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWord(idx)}
                    className="h-5 w-5 p-0 ml-1 text-gray-500 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Новое слово"
                className="border-gray-300 flex-1"
                onKeyDown={(e) => e.key === 'Enter' && addWord()}
              />
              <Button type="button" onClick={addWord} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Предложения */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-gray-700 font-medium">Предложения с пропусками</Label>
              <Button type="button" onClick={addSentence} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" /> Добавить предложение
              </Button>
            </div>

            {sentences.map((sentence, idx) => (
              <div key={idx} className="flex items-start gap-2 border-b pb-3 last:border-0">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 w-6">{idx + 1}.</span>
                    <Input
                      value={sentence}
                      onChange={(e) => updateSentence(idx, e.target.value)}
                      placeholder="Предложение с ___"
                      className="border-gray-300 flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSentence(idx)}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="ml-8">
                    <Select
                      value={correctAnswers[idx] || ''}
                      onValueChange={(val) => setCorrectAnswers({ ...correctAnswers, [idx]: val })}
                    >
                      <SelectTrigger className="w-48 border-gray-300">
                        <SelectValue placeholder="Правильное слово" />
                      </SelectTrigger>
                      <SelectContent>
                        {words.map((word) => (
                          <SelectItem key={word} value={word}>
                            {word}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
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