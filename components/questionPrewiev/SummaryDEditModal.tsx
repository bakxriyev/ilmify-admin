// components/questionPrewiev/SummaryDEditModal.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus, RefreshCw, AlertCircle, Camera, Music, Film, File, Upload, Save } from 'lucide-react';
import { Task } from '../../api/tasksApi'; // Task tipini import qilish

interface SummaryDEditModalProps {
  open: boolean;
  onClose: () => void;
  exerciseId: number;
  task?: Task | null;
  onSuccess: () => void;
}

export default function SummaryDEditModal({ open, onClose, exerciseId, task, onSuccess }: SummaryDEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // Form state
  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('Fill in the blanks using the given words.');
  const [ordinaryNumber, setOrdinaryNumber] = useState<number>(1);
  const [currentExerciseId, setCurrentExerciseId] = useState<number>(exerciseId);
  
  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [deletePhoto, setDeletePhoto] = useState(false);

  // Audio
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [existingAudio, setExistingAudio] = useState<string | null>(null);
  const [deleteAudio, setDeleteAudio] = useState(false);

  // Video
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
  const [deleteVideo, setDeleteVideo] = useState(false);

  // Media
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [existingMedia, setExistingMedia] = useState<string | null>(null);
  const [deleteMedia, setDeleteMedia] = useState(false);

  // Word bank
  const [words, setWords] = useState<string[]>([]);

  // Sentences
  const [sentences, setSentences] = useState<string[]>([]);

  // Correct answers
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, string>>({});

  // New word input
  const [newWord, setNewWord] = useState('');

  // File input refs
  const fileInputs = {
    photo: useRef<HTMLInputElement>(null),
    audio: useRef<HTMLInputElement>(null),
    video: useRef<HTMLInputElement>(null),
    media: useRef<HTMLInputElement>(null),
  };

  // Load task data when editing
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setQuestionText(task.question_text || 'Fill in the blanks using the given words.');
      setOrdinaryNumber(task.ordinary_number || 1);
      setCurrentExerciseId(task.exercise_id);

      // Photos
      if (task.photo) {
        setExistingPhoto(task.photo);
        setDeletePhoto(false);
      } else {
        setExistingPhoto(null);
      }
      setPhotoFile(null);
      setPhotoPreview(null);

      // Audio
      if (task.audio) {
        setExistingAudio(task.audio);
        setDeleteAudio(false);
      } else {
        setExistingAudio(null);
      }
      setAudioFile(null);
      setAudioPreview(null);

      // Video
      if (task.video) {
        setExistingVideo(task.video);
        setDeleteVideo(false);
      } else {
        setExistingVideo(null);
      }
      setVideoFile(null);
      setVideoPreview(null);

      // Media
      if (task.media) {
        setExistingMedia(task.media);
        setDeleteMedia(false);
      } else {
        setExistingMedia(null);
      }
      setMediaFile(null);

      // Parse extra_data
      if (task.extra_data) {
        try {
          let extra = task.extra_data;
          // Handle double JSON stringification
          if (typeof extra === 'string') {
            extra = JSON.parse(extra);
          }
          if (typeof extra === 'string') {
            extra = JSON.parse(extra);
          }
          
          if (extra.words && Array.isArray(extra.words)) {
            setWords(extra.words);
          } else {
            setWords([]);
          }
          
          if (extra.sentences && Array.isArray(extra.sentences)) {
            setSentences(extra.sentences);
          } else {
            setSentences([]);
          }
        } catch (e) {
          console.error('Failed to parse extra_data', e);
          setWords([]);
          setSentences([]);
        }
      } else {
        setWords([]);
        setSentences([]);
      }

      // Parse correct_answer
      if (task.correct_answer) {
        try {
          let ca = task.correct_answer;
          if (typeof ca === 'string') {
            ca = JSON.parse(ca);
          }
          setCorrectAnswers(ca || {});
        } catch (e) {
          console.error('Failed to parse correct_answer', e);
          setCorrectAnswers({});
        }
      } else {
        setCorrectAnswers({});
      }
    } else {
      // Reset for new task
      resetForm();
    }
  }, [task]);

  // Reset form to defaults
  const resetForm = () => {
    setTitle('');
    setQuestionText('Fill in the blanks using the given words.');
    setOrdinaryNumber(1);
    setCurrentExerciseId(exerciseId);
    
    setPhotoFile(null);
    setPhotoPreview(null);
    setExistingPhoto(null);
    setDeletePhoto(false);
    
    setAudioFile(null);
    setAudioPreview(null);
    setExistingAudio(null);
    setDeleteAudio(false);
    
    setVideoFile(null);
    setVideoPreview(null);
    setExistingVideo(null);
    setDeleteVideo(false);
    
    setMediaFile(null);
    setExistingMedia(null);
    setDeleteMedia(false);
    
    setWords([]);
    setSentences([]);
    setCorrectAnswers({});
    setNewWord('');
  };

  // Handle close with reset
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Handle file changes
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
      setExistingPhoto(null);
      setDeletePhoto(false);
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioPreview(url);
      setExistingAudio(null);
      setDeleteAudio(false);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      setExistingVideo(null);
      setDeleteVideo(false);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      setExistingMedia(null);
      setDeleteMedia(false);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (existingPhoto) {
      setDeletePhoto(true);
    }
    setExistingPhoto(null);
    if (fileInputs.photo.current) fileInputs.photo.current.value = '';
  };

  const removeAudio = () => {
    setAudioFile(null);
    setAudioPreview(null);
    if (existingAudio) {
      setDeleteAudio(true);
    }
    setExistingAudio(null);
    if (fileInputs.audio.current) fileInputs.audio.current.value = '';
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    if (existingVideo) {
      setDeleteVideo(true);
    }
    setExistingVideo(null);
    if (fileInputs.video.current) fileInputs.video.current.value = '';
  };

  const removeMedia = () => {
    setMediaFile(null);
    if (existingMedia) {
      setDeleteMedia(true);
    }
    setExistingMedia(null);
    if (fileInputs.media.current) fileInputs.media.current.value = '';
  };

  // Word management
  const addWord = () => {
    if (newWord.trim()) {
      setWords([...words, newWord.trim()]);
      setNewWord('');
    }
  };

  const removeWord = (index: number) => {
    const wordToRemove = words[index];
    const newWords = words.filter((_, i) => i !== index);
    setWords(newWords);

    // Remove from correctAnswers if used
    const updatedCA = { ...correctAnswers };
    Object.keys(updatedCA).forEach(key => {
      if (updatedCA[parseInt(key)] === wordToRemove) {
        delete updatedCA[parseInt(key)];
      }
    });
    setCorrectAnswers(updatedCA);
  };

  // Sentence management
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

    // Reindex correctAnswers
    const updatedCA: Record<number, string> = {};
    Object.entries(correctAnswers).forEach(([idx, word]) => {
      const numIdx = parseInt(idx);
      if (numIdx < index) {
        updatedCA[numIdx] = word;
      } else if (numIdx > index) {
        updatedCA[numIdx - 1] = word;
      }
    });
    setCorrectAnswers(updatedCA);
  };

  // Saqlash funksiyasi (to‘g‘ridan-to‘g‘ri fetch bilan)
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // --- VALIDATSIYA ---
      if (!title.trim()) {
        throw new Error('Nomi majburiy');
      }
      if (words.length === 0) {
        throw new Error('Kamida bitta so‘z qo‘shing');
      }
      if (sentences.length === 0) {
        throw new Error('Kamida bitta gap qo‘shing');
      }
      const missingAnswers = sentences.some((_, idx) => !correctAnswers[idx]);
      if (missingAnswers) {
        throw new Error('Har bir gap uchun to‘g‘ri javob tanlangan bo‘lishi kerak');
      }

      // --- JSON MA'LUMOTLARNI TAYYORLASH ---
      const extraData = JSON.stringify({ words, sentences });
      const correctAnswerJson = JSON.stringify(correctAnswers);

      // --- FORM DATA YARATISH ---
      const formData = new FormData();

      // Asosiy maydonlar (Swagger'dagi kabi)
      formData.append('exercise_id', currentExerciseId.toString());
      formData.append('title', title.trim());
      formData.append('question_text', questionText.trim() || 'Fill in the blanks using the given words.');
      formData.append('ordinary_number', ordinaryNumber.toString());
      formData.append('extra_data', extraData);
      formData.append('correct_answer', correctAnswerJson);

      // Agar mavjud bo‘lsa description (task dan)
      if (task?.description) {
        formData.append('description', task.description);
      }

      // --- MEDIA FAYLLAR VA DELETE FLAGLAR ---
      // Rasm
      if (photoFile) {
        formData.append('photo', photoFile);
      } else if (deletePhoto && existingPhoto) {
        formData.append('delete_photo', 'true');
      }

      // Audio
      if (audioFile) {
        formData.append('audio', audioFile);
      } else if (deleteAudio && existingAudio) {
        formData.append('delete_audio', 'true');
      }

      // Video
      if (videoFile) {
        formData.append('video', videoFile);
      } else if (deleteVideo && existingVideo) {
        formData.append('delete_video', 'true');
      }

      // Media (boshqa fayl)
      if (mediaFile) {
        formData.append('media', mediaFile);
      } else if (deleteMedia && existingMedia) {
        formData.append('delete_media', 'true');
      }

      // DEBUG: FormData tarkibini konsolga chiqarish (xavfsiz usul, instanceof ishlatilmagan)
      console.log('📦 FormData yuborilmoqda:');
      for (let pair of formData.entries()) {
        // Fayl ekanligini tekshirish: obyekt va name hamda size xususiyatlariga ega
        if (pair[1] && typeof pair[1] === 'object' && 'name' in pair[1] && 'size' in pair[1]) {
          console.log(pair[0], `File: ${pair[1].name} (${pair[1].type})`);
        } else {
          console.log(pair[0], pair[1]);
        }
      }

      // --- API GA SO‘ROV YUBORISH (to‘g‘ridan-to‘g‘ri fetch) ---
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const url = task 
        ? `${API_BASE_URL}/tasks/${task.id}`   // PATCH (yangilash)
        : `${API_BASE_URL}/tasks`;              // POST (yaratish)

      const method = task ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
        // HEADER qo‘shilmaydi – brauzer avtomatik multipart/form-data chegarasini qo‘yadi
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ Server javobi:', errorData);
        throw new Error(errorData.message || 'So‘rov amalga oshmadi');
      }

      const result = await res.json();
      console.log('✅ Muvaffaqiyatli:', result);

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('❌ Xatolik:', err);
      setError(err.message || 'Saqlashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-5xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {task ? 'Tahrirlash: Summary D' : 'Yangi task: Summary D'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {task ? 'Task ma\'lumotlarini yangilang' : 'Yangi task uchun ma\'lumotlarni kiriting'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100/50 p-1">
            <TabsTrigger value="basic" className="data-[state=active]:bg-white">
              Asosiy
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-white">
              Kontent
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-white">
              Media
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-700">
                  Nomi <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task nomi"
                  disabled={loading}
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exercise_id" className="text-gray-700">Exercise ID</Label>
                <Input
                  id="exercise_id"
                  type="number"
                  value={currentExerciseId}
                  onChange={(e) => setCurrentExerciseId(parseInt(e.target.value) || exerciseId)}
                  disabled={loading}
                  className="border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ordinary_number" className="text-gray-700">Tartib raqami</Label>
                <Input
                  id="ordinary_number"
                  type="number"
                  value={ordinaryNumber}
                  onChange={(e) => setOrdinaryNumber(parseInt(e.target.value) || 1)}
                  disabled={loading}
                  min="1"
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="questionText" className="text-gray-700">Instruktsiya</Label>
                <Input
                  id="questionText"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Fill in the blanks using the given words."
                  disabled={loading}
                  className="border-gray-300"
                />
              </div>
            </div>

            {/* Word Bank */}
            <div className="border rounded-lg p-4 space-y-3">
              <Label className="text-gray-700 font-medium">So'zlar banki</Label>
              <div className="flex flex-wrap gap-2 min-h-[40px] bg-gray-50 p-2 rounded">
                {words.length > 0 ? (
                  words.map((word, idx) => (
                    <div key={idx} className="flex items-center bg-white border rounded-full px-3 py-1 text-sm shadow-sm">
                      <span>{word}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWord(idx)}
                        className="h-5 w-5 p-0 ml-1 text-gray-500 hover:text-red-600"
                        disabled={loading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">Hali so'z qo'shilmagan</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Yangi so'z"
                  className="border-gray-300 flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && addWord()}
                  disabled={loading}
                />
                <Button type="button" onClick={addWord} size="sm" variant="outline" disabled={loading || !newWord.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4 py-4">
            {/* Sentences */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700 font-medium">Gaplar</Label>
                <Button type="button" onClick={addSentence} size="sm" variant="outline" disabled={loading}>
                  <Plus className="h-4 w-4 mr-1" /> Gap qo'shish
                </Button>
              </div>

              {sentences.length > 0 ? (
                sentences.map((sentence, idx) => (
                  <div key={idx} className="flex items-start gap-2 border-b pb-3 last:border-0">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500 w-6">{idx + 1}.</span>
                        <Input
                          value={sentence}
                          onChange={(e) => updateSentence(idx, e.target.value)}
                          placeholder="Gap matni"
                          className="border-gray-300 flex-1"
                          disabled={loading}
                        />
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
                      <div className="ml-8">
                        <Select
                          value={correctAnswers[idx] || ''}
                          onValueChange={(val) => setCorrectAnswers({ ...correctAnswers, [idx]: val })}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-48 border-gray-300">
                            <SelectValue placeholder="To'g'ri so'z" />
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
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">Hali gap qo'shilmagan</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="media" className="space-y-4 py-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Photo */}
                <div className="space-y-2">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <Camera className="h-4 w-4 text-blue-500" />
                    Rasm
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputs.photo.current?.click()}
                      className="w-full border-gray-300 hover:bg-blue-50"
                      disabled={loading}
                      type="button"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {existingPhoto || photoFile ? 'Yangilash' : 'Yuklash'}
                    </Button>
                    {(photoPreview || existingPhoto) && (
                      <Button variant="ghost" size="sm" onClick={removePhoto} className="h-8 w-8 p-0 hover:bg-red-100" disabled={loading} type="button">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputs.photo}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {(photoPreview || existingPhoto) && (
                    <div className="mt-2 relative">
                      <img
                        src={photoPreview || (existingPhoto ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/uploads/tasks/${existingPhoto}` : '')}
                        alt="Preview"
                        className="max-h-32 rounded border object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Audio */}
                <div className="space-y-2">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <Music className="h-4 w-4 text-green-500" />
                    Audio
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputs.audio.current?.click()}
                      className="w-full border-gray-300 hover:bg-green-50"
                      disabled={loading}
                      type="button"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {existingAudio || audioFile ? 'Yangilash' : 'Yuklash'}
                    </Button>
                    {(audioPreview || existingAudio) && (
                      <Button variant="ghost" size="sm" onClick={removeAudio} className="h-8 w-8 p-0 hover:bg-red-100" disabled={loading} type="button">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputs.audio}
                    onChange={handleAudioChange}
                    accept="audio/*"
                    className="hidden"
                  />
                  {(audioPreview || existingAudio) && (
                    <div className="mt-2">
                      <audio 
                        controls 
                        src={audioPreview || (existingAudio ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/uploads/tasks/${existingAudio}` : '')} 
                        className="w-full" 
                      />
                    </div>
                  )}
                </div>

                {/* Video */}
                <div className="space-y-2">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <Film className="h-4 w-4 text-purple-500" />
                    Video
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputs.video.current?.click()}
                      className="w-full border-gray-300 hover:bg-purple-50"
                      disabled={loading}
                      type="button"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {existingVideo || videoFile ? 'Yangilash' : 'Yuklash'}
                    </Button>
                    {(videoPreview || existingVideo) && (
                      <Button variant="ghost" size="sm" onClick={removeVideo} className="h-8 w-8 p-0 hover:bg-red-100" disabled={loading} type="button">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputs.video}
                    onChange={handleVideoChange}
                    accept="video/*"
                    className="hidden"
                  />
                  {(videoPreview || existingVideo) && (
                    <div className="mt-2">
                      <video 
                        controls 
                        src={videoPreview || (existingVideo ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/uploads/tasks/${existingVideo}` : '')} 
                        className="max-h-32 rounded border" 
                      />
                    </div>
                  )}
                </div>

                {/* Media */}
                <div className="space-y-2">
                  <Label className="text-gray-700 flex items-center gap-2">
                    <File className="h-4 w-4 text-gray-500" />
                    Boshqa fayl
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputs.media.current?.click()}
                      className="w-full border-gray-300 hover:bg-gray-50"
                      disabled={loading}
                      type="button"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {existingMedia || mediaFile ? 'Yangilash' : 'Yuklash'}
                    </Button>
                    {(mediaFile || existingMedia) && (
                      <Button variant="ghost" size="sm" onClick={removeMedia} className="h-8 w-8 p-0 hover:bg-red-100" disabled={loading} type="button">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputs.media}
                    onChange={handleMediaChange}
                    accept="*/*"
                    className="hidden"
                  />
                  {(mediaFile || existingMedia) && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border text-sm">
                      {mediaFile ? mediaFile.name : existingMedia}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Bekor qilish
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Saqlanmoqda...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {task ? 'Yangilash' : 'Yaratish'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}