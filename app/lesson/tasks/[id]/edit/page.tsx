// app/tasks/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '../../../../../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { tasksApi, Task } from '../../../../../api/tasksApi';
import { exercisesApi, Exercise } from '../../../../../api/exercisesApi';
import SummaryDPreviewModal from '../../../../../components/questionPrewiev/SummaryDPreviewModal';
import { ArrowLeft, Save, Eye, Trash2, Upload, X, ArrowUp, ArrowDown, Plus } from 'lucide-react';

export default function TaskEditPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch task and exercise
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const taskData = await tasksApi.getTaskById(parseInt(taskId));
        setTask(taskData);

        // Fetch exercise to get its type
        const exerciseData = await exercisesApi.getExerciseById(taskData.exercise_id.toString());
        setExercise(exerciseData);
      } catch (err: any) {
        setError(err.message || 'Maʼlumot yuklanmadi');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [taskId]);

  // If loading
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-8">
          <Skeleton className="h-10 w-32 mb-4" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  // If error and no task
  if (error && !task) {
    return (
      <Layout>
        <div className="container mx-auto p-8 text-center">
          <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
          <Button className="mt-4" onClick={() => router.push('/lesson/tasks')}>Ortga</Button>
        </div>
      </Layout>
    );
  }

  // Render based on exercise type
  const renderEditForm = () => {
    if (!task || !exercise) return null;

    switch (exercise.type) {
      case 'summary_c':
        return <SummaryCEditForm task={task} onSuccess={() => setSuccess(true)} onError={setError} saving={saving} setSaving={setSaving} />;
      // For summary_d and others, keep generic form
      default:
        return <GenericEditForm task={task} onSuccess={() => setSuccess(true)} onError={setError} saving={saving} setSaving={setSaving} />;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push(`/lesson/tasks/${taskId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Taskga qaytish
            </Button>
            <div className="flex items-center gap-2">
              {/* Preview only for summary_d for now */}
              {exercise?.type === 'summary_d' && (
                <Button variant="outline" onClick={() => setShowPreview(true)}>
                  <Eye className="h-4 w-4 mr-2" /> Oldindan ko‘rish
                </Button>
              )}
              <Button form="edit-form" type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </div>
          </div>

          {/* Success/Error messages */}
          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              Muvaffaqiyatli saqlandi
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Edit Form */}
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">
                Taskni tahrirlash {exercise && `(${exercise.type})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderEditForm()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Modal (only for summary_d) */}
      {showPreview && task && exercise?.type === 'summary_d' && (
        <SummaryDPreviewModal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          task={task}
        />
      )}
    </Layout>
  );
}

// ----------------------------------------------------------------------
// Generic Edit Form (for summary_d and others)
// ----------------------------------------------------------------------
function GenericEditForm({ task, onSuccess, onError, saving, setSaving }: any) {
  const router = useRouter();
  const [title, setTitle] = useState(task.title || '');
  const [questionText, setQuestionText] = useState(task.question_text || '');
  const [writingQ, setWritingQ] = useState(task.writing_q || '');
  const [correctAnswer, setCorrectAnswer] = useState(task.correct_answer || '');
  const [extraData, setExtraData] = useState(task.extra_data || '');
  const [description, setDescription] = useState(task.description || '');
  const [ordinaryNumber, setOrdinaryNumber] = useState<number | undefined>(task.ordinary_number);

  // Media files
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(task.photo || null);
  const [audioUrl, setAudioUrl] = useState<string | null>(task.audio || null);
  const [videoUrl, setVideoUrl] = useState<string | null>(task.video || null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(task.media || null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    onError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('question_text', questionText);
      formData.append('writing_q', writingQ);
      formData.append('correct_answer', correctAnswer);
      formData.append('extra_data', extraData);
      formData.append('description', description);
      if (ordinaryNumber !== undefined) formData.append('ordinary_number', String(ordinaryNumber));

      if (photoFile) formData.append('photo', photoFile);
      if (audioFile) formData.append('audio', audioFile);
      if (videoFile) formData.append('video', videoFile);
      if (mediaFile) formData.append('media', mediaFile);

      await tasksApi.updateTask(task.id, formData);
      onSuccess();
      // Refresh media URLs
      setPhotoUrl(photoFile ? null : photoUrl);
      setAudioUrl(audioFile ? null : audioUrl);
      setVideoUrl(videoFile ? null : videoUrl);
      setMediaUrl(mediaFile ? null : mediaUrl);
      setPhotoFile(null);
      setAudioFile(null);
      setVideoFile(null);
      setMediaFile(null);
    } catch (err: any) {
      onError(err.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMedia = (type: string) => {
    // In a real app, you'd call an API to delete the file
    if (type === 'photo') { setPhotoUrl(null); setPhotoFile(null); }
    if (type === 'audio') { setAudioUrl(null); setAudioFile(null); }
    if (type === 'video') { setVideoUrl(null); setVideoFile(null); }
    if (type === 'media') { setMediaUrl(null); setMediaFile(null); }
  };

  return (
    <form id="edit-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title">Sarlavha</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task sarlavhasi" />
        </div>
        <div>
          <Label htmlFor="ordinary_number">Tartib raqami</Label>
          <Input id="ordinary_number" type="number" value={ordinaryNumber || ''} onChange={(e) => setOrdinaryNumber(parseInt(e.target.value) || undefined)} />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Tavsif</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>

      <div>
        <Label htmlFor="question_text">Savol matni</Label>
        <Textarea id="question_text" value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={4} />
      </div>

      <div>
        <Label htmlFor="writing_q">Yozma savol</Label>
        <Textarea id="writing_q" value={writingQ} onChange={(e) => setWritingQ(e.target.value)} rows={4} />
      </div>

      <div>
        <Label htmlFor="correct_answer">To'g'ri javob</Label>
        <Textarea id="correct_answer" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} rows={4} />
        <p className="text-xs text-gray-500 mt-1">JSON formatida bo‘lishi mumkin (masalan: {"{\"0\":\"behind\"}"})</p>
      </div>

      <div>
        <Label htmlFor="extra_data">Qo'shimcha ma'lumot (extra_data)</Label>
        <Textarea id="extra_data" value={extraData} onChange={(e) => setExtraData(e.target.value)} rows={6} />
        <p className="text-xs text-gray-500 mt-1">JSON formatida, masalan: {"{\"words\":[\"behind\"],\"sentences\":[\"The lake...\"]}"}</p>
      </div>

      {/* Media fayllar */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Media fayllar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MediaUpload
            label="Rasm"
            accept="image/*"
            file={photoFile}
            setFile={setPhotoFile}
            existingUrl={photoUrl}
            onDelete={() => handleDeleteMedia('photo')}
          />
          <MediaUpload
            label="Audio"
            accept="audio/*"
            file={audioFile}
            setFile={setAudioFile}
            existingUrl={audioUrl}
            onDelete={() => handleDeleteMedia('audio')}
          />
          <MediaUpload
            label="Video"
            accept="video/*"
            file={videoFile}
            setFile={setVideoFile}
            existingUrl={videoUrl}
            onDelete={() => handleDeleteMedia('video')}
          />
          <MediaUpload
            label="Media (boshqa)"
            accept="*/*"
            file={mediaFile}
            setFile={setMediaFile}
            existingUrl={mediaUrl}
            onDelete={() => handleDeleteMedia('media')}
          />
        </div>
      </div>
    </form>
  );
}

// ----------------------------------------------------------------------
// Summary C Edit Form
// ----------------------------------------------------------------------
function SummaryCEditForm({ task, onSuccess, onError, saving, setSaving }: any) {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState(task.title || '');
  const [questionText, setQuestionText] = useState(task.question_text || 'Put the sentences in the correct order to build overviews.');
  const [ordinaryNumber, setOrdinaryNumber] = useState<number | undefined>(task.ordinary_number);
  const [description, setDescription] = useState(task.description || '');

  // Parts
  const [parts, setParts] = useState<string[]>(() => {
    try {
      if (task.extra_data) {
        const extra = typeof task.extra_data === 'string' ? JSON.parse(task.extra_data) : task.extra_data;
        return extra.parts || [];
      }
    } catch (e) {}
    return [];
  });

  // Media
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(task.photo || null);
  const [audioUrl, setAudioUrl] = useState<string | null>(task.audio || null);
  const [videoUrl, setVideoUrl] = useState<string | null>(task.video || null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(task.media || null);

  // Parts handlers
  const addPart = () => setParts([...parts, '']);
  const removePart = (index: number) => setParts(parts.filter((_, i) => i !== index));
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

  // Media handlers
  const handleDeleteMedia = (type: string) => {
    if (type === 'photo') { setPhotoUrl(null); setPhotoFile(null); }
    if (type === 'audio') { setAudioUrl(null); setAudioFile(null); }
    if (type === 'video') { setVideoUrl(null); setVideoFile(null); }
    if (type === 'media') { setMediaUrl(null); setMediaFile(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    onError(null);

    // Validation
    if (!title.trim()) {
      onError('Nomi majburiy');
      setSaving(false);
      return;
    }
    if (parts.length === 0) {
      onError('Kamida bitta qism qo‘shing');
      setSaving(false);
      return;
    }
    if (parts.some(p => !p.trim())) {
      onError('Barcha qismlar matni to‘ldirilgan bo‘lishi kerak');
      setSaving(false);
      return;
    }

    try {
      const extraData = JSON.stringify({ parts });
      const correctAnswer = JSON.stringify(parts.map((_, i) => i)); // to‘g‘ri tartib indekslari

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('question_text', questionText.trim());
      formData.append('ordinary_number', ordinaryNumber?.toString() || '');
      formData.append('description', description);
      formData.append('extra_data', extraData);
      formData.append('correct_answer', correctAnswer);

      if (photoFile) formData.append('photo', photoFile);
      if (audioFile) formData.append('audio', audioFile);
      if (videoFile) formData.append('video', videoFile);
      if (mediaFile) formData.append('media', mediaFile);

      await tasksApi.updateTask(task.id, formData);
      onSuccess();
      // Refresh media URLs
      setPhotoUrl(photoFile ? null : photoUrl);
      setAudioUrl(audioFile ? null : audioUrl);
      setVideoUrl(videoFile ? null : videoUrl);
      setMediaUrl(mediaFile ? null : mediaUrl);
      setPhotoFile(null);
      setAudioFile(null);
      setVideoFile(null);
      setMediaFile(null);
    } catch (err: any) {
      onError(err.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form id="edit-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Asosiy maʼlumotlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title">Sarlavha <span className="text-red-500">*</span></Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task sarlavhasi" />
        </div>
        <div>
          <Label htmlFor="ordinary_number">Tartib raqami</Label>
          <Input id="ordinary_number" type="number" value={ordinaryNumber || ''} onChange={(e) => setOrdinaryNumber(parseInt(e.target.value) || undefined)} />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Tavsif</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>

      <div>
        <Label htmlFor="questionText">Instruktsiya</Label>
        <Input id="questionText" value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
      </div>

      {/* Qismlar (Parts) */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-medium">Qismlar (to‘g‘ri tartibda joylashtiring)</Label>
          <Button type="button" onClick={addPart} size="sm" variant="outline" disabled={saving}>
            <Plus className="h-4 w-4 mr-1" /> Qism qo‘shish
          </Button>
        </div>

        {parts.length > 0 ? (
          parts.map((part, idx) => (
            <div key={idx} className="flex items-center gap-2 border rounded-lg p-3 bg-gray-50">
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => movePartUp(idx)}
                  disabled={idx === 0 || saving}
                  className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => movePartDown(idx)}
                  disabled={idx === parts.length - 1 || saving}
                  className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm font-medium text-gray-500 w-6">{idx + 1}.</span>
              <Input
                value={part}
                onChange={(e) => updatePart(idx, e.target.value)}
                placeholder="Qism matni"
                className="flex-1"
                disabled={saving}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removePart(idx)}
                disabled={saving}
                className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center py-4">Hali qism qo‘shilmagan</p>
        )}
      </div>

      {/* Media fayllar */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Media fayllar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MediaUpload
            label="Rasm"
            accept="image/*"
            file={photoFile}
            setFile={setPhotoFile}
            existingUrl={photoUrl}
            onDelete={() => handleDeleteMedia('photo')}
          />
          <MediaUpload
            label="Audio"
            accept="audio/*"
            file={audioFile}
            setFile={setAudioFile}
            existingUrl={audioUrl}
            onDelete={() => handleDeleteMedia('audio')}
          />
          <MediaUpload
            label="Video"
            accept="video/*"
            file={videoFile}
            setFile={setVideoFile}
            existingUrl={videoUrl}
            onDelete={() => handleDeleteMedia('video')}
          />
          <MediaUpload
            label="Media (boshqa)"
            accept="*/*"
            file={mediaFile}
            setFile={setMediaFile}
            existingUrl={mediaUrl}
            onDelete={() => handleDeleteMedia('media')}
          />
        </div>
      </div>
    </form>
  );
}

// ----------------------------------------------------------------------
// Media Upload Component
// ----------------------------------------------------------------------
const MediaUpload = ({ label, accept, file, setFile, existingUrl, onDelete }: any) => {
  const [preview, setPreview] = useState<string | null>(existingUrl);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(existingUrl);
    }
  }, [file, existingUrl]);

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <Label>{label}</Label>
      <div className="mt-2">
        {preview ? (
          <div className="relative group">
            {label === 'Rasm' ? (
              <img src={preview} alt="Preview" className="h-32 w-full object-cover rounded" />
            ) : label === 'Audio' ? (
              <audio controls src={preview} className="w-full h-12" />
            ) : label === 'Video' ? (
              <video controls src={preview} className="h-32 w-full object-cover rounded" />
            ) : (
              <div className="h-32 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-600">{file ? file.name : 'Media fayl'}</span>
              </div>
            )}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition"
              onClick={onDelete}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept={accept}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="flex-1"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Ikonka (agar kerak bo‘lsa)
const CheckCircle = (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;