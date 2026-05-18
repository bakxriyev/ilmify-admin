// components/questionTypes/SummaryCModal.tsx
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  X,
  Plus,
  RefreshCw,
  AlertCircle,
  Camera,
  Music,
  Film,
  File,
  Upload,
  Save,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Task } from '../../api/tasksApi.ts';

interface SummaryCModalProps {
  open: boolean;
  onClose: () => void;
  exerciseId: number;
  task?: Task | null;
  onSuccess: () => void;
}

export default function SummaryCModal({ open, onClose, exerciseId, task, onSuccess }: SummaryCModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // Form state
  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('Put the sentences in the correct order to build overviews.');
  const [ordinaryNumber, setOrdinaryNumber] = useState<number>(1);
  const [currentExerciseId, setCurrentExerciseId] = useState<number>(exerciseId);
  
  // Media
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [deletePhoto, setDeletePhoto] = useState(false);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [existingAudio, setExistingAudio] = useState<string | null>(null);
  const [deleteAudio, setDeleteAudio] = useState(false);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
  const [deleteVideo, setDeleteVideo] = useState(false);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [existingMedia, setExistingMedia] = useState<string | null>(null);
  const [deleteMedia, setDeleteMedia] = useState(false);

  // Parts (sentences or fragments)
  const [parts, setParts] = useState<string[]>([]);

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
      setQuestionText(task.question_text || 'Put the sentences in the correct order to build overviews.');
      setOrdinaryNumber(task.ordinary_number || 1);
      setCurrentExerciseId(task.exercise_id);

      // Media
      setExistingPhoto(task.photo || null);
      setPhotoFile(null);
      setPhotoPreview(null);
      setDeletePhoto(false);

      setExistingAudio(task.audio || null);
      setAudioFile(null);
      setAudioPreview(null);
      setDeleteAudio(false);

      setExistingVideo(task.video || null);
      setVideoFile(null);
      setVideoPreview(null);
      setDeleteVideo(false);

      setExistingMedia(task.media || null);
      setMediaFile(null);
      setDeleteMedia(false);

      // Parse extra_data (parts)
      if (task.extra_data) {
        try {
          let extra = task.extra_data;
          if (typeof extra === 'string') {
            extra = JSON.parse(extra);
          }
          if (typeof extra === 'string') {
            extra = JSON.parse(extra);
          }
          if (extra.parts && Array.isArray(extra.parts)) {
            setParts(extra.parts);
          } else {
            setParts([]);
          }
        } catch (e) {
          console.error('Failed to parse extra_data', e);
          setParts([]);
        }
      } else {
        setParts([]);
      }
    } else {
      // Reset for new task
      resetForm();
    }
  }, [task]);

  // Reset form
  const resetForm = () => {
    setTitle('');
    setQuestionText('Put the sentences in the correct order to build overviews.');
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
    
    setParts([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // File handlers (same as before)
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

  // Parts management
  const addPart = () => {
    setParts([...parts, '']);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, value: string) => {
    const newParts = [...parts];
    newParts[index] = value;
    setParts(newParts);
  };

  const movePartUp = (index: number) => {
    if (index === 0) return;
    const newParts = [...parts];
    [newParts[index - 1], newParts[index]] = [newParts[index], newParts[index - 1]];
    setParts(newParts);
  };

  const movePartDown = (index: number) => {
    if (index === parts.length - 1) return;
    const newParts = [...parts];
    [newParts[index], newParts[index + 1]] = [newParts[index + 1], newParts[index]];
    setParts(newParts);
  };

  // Save handler (direct fetch)
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (!title.trim()) {
        throw new Error('Nomi majburiy');
      }
      if (parts.length === 0) {
        throw new Error('Kamida bitta qism qo‘shing');
      }
      if (parts.some(p => !p.trim())) {
        throw new Error('Barcha qismlar matni to‘ldirilgan bo‘lishi kerak');
      }

      // Prepare JSON data
      const extraData = JSON.stringify({ parts });
      // Correct answer is the order of indices (since parts are stored in correct order)
      const correctAnswerJson = JSON.stringify(parts.map((_, i) => i));

      // FormData
      const formData = new FormData();
      formData.append('exercise_id', currentExerciseId.toString());
      formData.append('title', title.trim());
      formData.append('question_text', questionText.trim() || 'Put the sentences in the correct order to build overviews.');
      formData.append('ordinary_number', ordinaryNumber.toString());
      formData.append('extra_data', extraData);
      formData.append('correct_answer', correctAnswerJson);

      if (task?.description) {
        formData.append('description', task.description);
      }

      // Media files
      if (photoFile) {
        formData.append('photo', photoFile);
      } else if (deletePhoto && existingPhoto) {
        formData.append('delete_photo', 'true');
      }

      if (audioFile) {
        formData.append('audio', audioFile);
      } else if (deleteAudio && existingAudio) {
        formData.append('delete_audio', 'true');
      }

      if (videoFile) {
        formData.append('video', videoFile);
      } else if (deleteVideo && existingVideo) {
        formData.append('delete_video', 'true');
      }

      if (mediaFile) {
        formData.append('media', mediaFile);
      } else if (deleteMedia && existingMedia) {
        formData.append('delete_media', 'true');
      }

      // Debug
      console.log('📦 SummaryC FormData:');
      for (let pair of formData.entries()) {
        if (pair[1] && typeof pair[1] === 'object' && 'name' in pair[1]) {
          console.log(pair[0], `File: ${pair[1].name}`);
        } else {
          console.log(pair[0], pair[1]);
        }
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const url = task ? `${API_BASE_URL}/tasks/${task.id}` : `${API_BASE_URL}/tasks`;
      const method = task ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'So‘rov amalga oshmadi');
      }

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
            {task ? 'Tahrirlash: Summary C' : 'Yangi task: Summary C'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {task ? 'Task maʼlumotlarini yangilang' : 'Yangi task uchun maʼlumotlarni kiriting'}
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
            <TabsTrigger value="parts" className="data-[state=active]:bg-white">
              Qismlar
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
                  placeholder="Put the sentences in the correct order..."
                  disabled={loading}
                  className="border-gray-300"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parts" className="space-y-4 py-4">
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700 font-medium">Qismlar (to‘g‘ri tartibda joylashtiring)</Label>
                <Button type="button" onClick={addPart} size="sm" variant="outline" disabled={loading}>
                  <Plus className="h-4 w-4 mr-1" /> Qism qo‘shish
                </Button>
              </div>

              {parts.length > 0 ? (
                parts.map((part, idx) => (
                  <div key={idx} className="flex items-center gap-2 border rounded-lg p-3 bg-gray-50">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => movePartUp(idx)}
                        disabled={idx === 0 || loading}
                        className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => movePartDown(idx)}
                        disabled={idx === parts.length - 1 || loading}
                        className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-sm font-medium text-gray-500 w-8">{idx + 1}.</span>
                    <Input
                      value={part}
                      onChange={(e) => updatePart(idx, e.target.value)}
                      placeholder="Qism matni"
                      className="border-gray-300 flex-1"
                      disabled={loading}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePart(idx)}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">Hali qism qo‘shilmagan</p>
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