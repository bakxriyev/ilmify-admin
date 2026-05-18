// app/lesson/tasks/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '../../../../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { tasksApi, Task } from '../../../../api/tasksApi';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import SummaryDPreviewModal from '../../../../components/questionPrewiev/SummaryDPreviewMOdal';
import SummaryDEditModal from '../../../../components/questionPrewiev/SummaryDEditModal';

// Icons
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Star,
  Check,
  Link as LinkIcon,
  Printer,
  ChevronLeft,
  FileText,
  Calendar,
  Clock,
  Layers,
  Hash,
  Info,
  Zap,
  BarChart,
  Image,
  Headphones,
  Video,
  File,
  AlertTriangle,
  MessageSquare,
  HelpCircle,
  PenTool,
  CheckCircle,
  Download,
  X,
  Copy,
  Music,
  Film,
  Camera,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const data = await tasksApi.getTaskById(parseInt(taskId), 'exercise,student_answers');
      setTask(data);
      const bookmarks = JSON.parse(localStorage.getItem('task_bookmarks') || '[]');
      setBookmarked(bookmarks.includes(parseInt(taskId)));
    } catch (err: any) {
      setError(err.message || 'Task yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await tasksApi.deleteTask(parseInt(taskId));
      router.push('/lesson/tasks');
    } catch (err: any) {
      setError(err.message || 'O\'chirishda xatolik');
    }
  };

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('task_bookmarks') || '[]');
    const idNum = parseInt(taskId);
    if (bookmarked) {
      localStorage.setItem('task_bookmarks', JSON.stringify(bookmarks.filter((id: number) => id !== idNum)));
    } else {
      bookmarks.push(idNum);
      localStorage.setItem('task_bookmarks', JSON.stringify(bookmarks));
    }
    setBookmarked(!bookmarked);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd MMMM yyyy, HH:mm', { locale: uz });
    } catch {
      return date;
    }
  };

  const getMediaUrl = (path: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/uploads/tasks/${path}`;
  };

  const renderSummaryDPreview = () => {
    if (!task?.extra_data || !task?.correct_answer) return null;
    try {
      const extraRaw = typeof task.extra_data === 'string' ? task.extra_data : JSON.stringify(task.extra_data);
      let extraParsed = JSON.parse(extraRaw);
      if (typeof extraParsed === 'string') extraParsed = JSON.parse(extraParsed);
      const sentences: string[] = extraParsed.sentences || [];
      const correctRaw = typeof task.correct_answer === 'string' ? task.correct_answer : JSON.stringify(task.correct_answer);
      const correct = JSON.parse(correctRaw) as Record<number, string>;

      return (
        <div className="space-y-3 mt-4">
          <h4 className="font-medium text-gray-700">To‘ldirilgan javoblar:</h4>
          {sentences.map((sentence, idx) => {
            const parts = sentence.split('___');
            return (
              <div key={idx} className="flex items-center gap-2 text-gray-800">
                <span className="font-mono text-sm text-gray-500">{idx + 1}.</span>
                <div className="flex flex-wrap items-center gap-1">
                  {parts.map((part, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {part}
                      {i < parts.length - 1 && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded border border-green-300 font-medium">
                          {correct[idx] || '___'}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    } catch (e) {
      return null;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
          <Skeleton className="h-10 w-32 mb-4" />
          <Skeleton className="h-64 w-full rounded-2xl mb-4" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (error || !task) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Task topilmadi</h2>
              <p className="text-gray-600 mb-6">{error || 'Task mavjud emas'}</p>
              <Button onClick={() => router.push('/lesson/tasks')}>Ortga</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push('/lesson/tasks')} className="hover:bg-white/50">
              <ChevronLeft className="h-4 w-4 mr-2" /> Tasklar ro'yxati
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowPreviewModal(true)}>
                <Eye className="h-4 w-4 mr-2" /> Ko‘rish
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleBookmark} className={bookmarked ? 'text-yellow-600' : ''}>
                <Star className={`h-4 w-4 mr-2 ${bookmarked ? 'fill-yellow-600' : ''}`} />
                {bookmarked ? 'Saqlangan' : 'Saqlash'}
              </Button>
              <Button variant="ghost" size="sm" onClick={copyLink}>
                {copied ? <><Check className="h-4 w-4 mr-2 text-green-600" /> Nusxalandi</> : <><LinkIcon className="h-4 w-4 mr-2" /> Havola</>}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" /> Chop etish
              </Button>
            </div>
          </div>

          {/* Header Card */}
          <Card className="border-none shadow-xl overflow-hidden mb-6">
            <div className="relative h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute -bottom-12 left-8 flex items-end gap-6">
                <div className="w-24 h-24 rounded-2xl bg-white shadow-2xl flex items-center justify-center">
                  <FileText className="h-12 w-12 text-blue-600" />
                </div>
                <div className="pb-4">
                  <h1 className="text-3xl font-bold text-white mb-2">{task.title || `Task #${task.id}`}</h1>
                  <div className="flex items-center gap-3 text-white/90">
                    <Badge className="bg-white/20 text-white">ID: {task.id}</Badge>
                    <Badge className="bg-white/20 text-white">Exercise: {task.exercise_id}</Badge>
                    <Badge className="bg-white/20 text-white">#{task.ordinary_number}</Badge>
                  </div>
                </div>
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <Button size="sm" onClick={() => setShowEditModal(true)} className="bg-white/20 hover:bg-white/30 text-white">
                  <Edit className="h-4 w-4 mr-2" /> Tahrirlash
                </Button>
                <Button size="sm" onClick={() => setShowDeleteModal(true)} className="bg-white/20 hover:bg-white/30 text-white">
                  <Trash2 className="h-4 w-4 mr-2" /> O'chirish
                </Button>
              </div>
            </div>
            <CardContent className="pt-16 pb-6 px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <InfoItem icon={<Calendar className="h-5 w-5 text-blue-600" />} label="Yaratilgan" value={formatDate(task.created_at)} />
                <InfoItem icon={<Clock className="h-5 w-5 text-green-600" />} label="Yangilangan" value={formatDate(task.updated_at)} />
                <InfoItem icon={<Layers className="h-5 w-5 text-purple-600" />} label="Exercise ID" value={task.exercise_id} />
                <InfoItem icon={<Hash className="h-5 w-5 text-orange-600" />} label="Tartib raqami" value={`#${task.ordinary_number}`} />
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-xl">
                <CardHeader className="border-b pb-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4 bg-gray-100/50">
                      <TabsTrigger value="overview"><Eye className="h-4 w-4 mr-2" /> Umumiy</TabsTrigger>
                      <TabsTrigger value="content"><FileText className="h-4 w-4 mr-2" /> Kontent</TabsTrigger>
                      <TabsTrigger value="media"><Image className="h-4 w-4 mr-2" /> Media</TabsTrigger>
                      <TabsTrigger value="answers"><MessageSquare className="h-4 w-4 mr-2" /> Javoblar</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent className="p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {task.description && <InfoBlock title="Tavsif">{task.description}</InfoBlock>}
                      {task.question_text && <InfoBlock title="Savol matni" icon={<HelpCircle className="h-4 w-4 text-blue-600" />}>{task.question_text}</InfoBlock>}
                      {task.writing_q && <InfoBlock title="Yozma savol" icon={<PenTool className="h-4 w-4 text-purple-600" />}>{task.writing_q}</InfoBlock>}
                      {task.correct_answer && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" /> To'g'ri javob
                          </h3>
                          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                            {renderSummaryDPreview() || (
                              <pre className="whitespace-pre-wrap text-green-800">{task.correct_answer}</pre>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === 'content' && <ContentTab task={task} />}
                  {activeTab === 'media' && <MediaTab task={task} getMediaUrl={getMediaUrl} />}
                  {activeTab === 'answers' && <AnswersTab />}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <InfoCard task={task} />
              <ActionsCard onEdit={() => setShowEditModal(true)} onDelete={() => setShowDeleteModal(true)} />
              <StatsCard />
            </div>
          </div>

          {/* Related Tasks */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              Shu exercise'dagi boshqa tasklar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-none shadow-md hover:shadow-xl transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          Task #{task.id + i}
                        </h3>
                        <p className="text-xs text-gray-500">Exercise #{task.exercise_id}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <SummaryDPreviewModal
          open={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          task={task}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <SummaryDEditModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          exerciseId={task.exercise_id}
          task={task}
          onSuccess={() => {
            setShowEditModal(false);
            fetchTask();
          }}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteModal task={task} onClose={() => setShowDeleteModal(false)} onDelete={handleDelete} />
      )}
    </Layout>
  );
}

// Helper Components
const InfoItem = ({ icon, label, value }: any) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">{icon}</div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  </div>
);

const InfoBlock = ({ title, icon, children }: any) => (
  <div>
    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">{icon} {title}</h3>
    <div className="p-4 bg-gray-50 rounded-xl border whitespace-pre-wrap">{children}</div>
  </div>
);

const ContentTab = ({ task }: { task: Task }) => (
  <div className="space-y-4">
    {task.title && (
      <div>
        <h3 className="text-sm font-medium text-gray-500">Sarlavha</h3>
        <p className="text-xl font-semibold">{task.title}</p>
      </div>
    )}
    {task.question_text && (
      <div>
        <h3 className="text-sm font-medium text-gray-500">Savol matni</h3>
        <p className="whitespace-pre-wrap">{task.question_text}</p>
      </div>
    )}
    {task.writing_q && (
      <div>
        <h3 className="text-sm font-medium text-gray-500">Yozma savol</h3>
        <p className="whitespace-pre-wrap">{task.writing_q}</p>
      </div>
    )}
    {task.extra_data && (
      <div>
        <h3 className="text-sm font-medium text-gray-500">Qo'shimcha ma'lumot</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
          {(() => {
            try {
              return JSON.stringify(JSON.parse(task.extra_data), null, 2);
            } catch {
              return task.extra_data;
            }
          })()}
        </pre>
      </div>
    )}
  </div>
);

const MediaTab = ({ task, getMediaUrl }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {task.photo && <MediaItem url={getMediaUrl(task.photo)} type="Rasm" bg="bg-blue-600" icon={<Image className="h-12 w-12" />} />}
    {task.audio && <MediaItem url={getMediaUrl(task.audio)} type="Audio" bg="bg-green-600" icon={<Headphones className="h-12 w-12" />} isAudio />}
    {task.video && <MediaItem url={getMediaUrl(task.video)} type="Video" bg="bg-purple-600" icon={<Video className="h-12 w-12" />} isVideo />}
    {task.media && !task.photo && !task.audio && !task.video && (
      <MediaItem url={getMediaUrl(task.media)} type="Media" bg="bg-gray-600" icon={<File className="h-12 w-12" />} />
    )}
    {!task.photo && !task.audio && !task.video && !task.media && (
      <p className="text-center col-span-2 py-12 text-gray-500">Media fayllar mavjud emas</p>
    )}
  </div>
);

const MediaItem = ({ url, type, bg, icon, isAudio, isVideo }: any) => (
  <div className="group relative aspect-video rounded-xl overflow-hidden bg-gray-100">
    {isVideo ? (
      <video controls src={url} className="w-full h-full object-cover" />
    ) : isAudio ? (
      <div className={`w-full h-full ${bg} flex items-center justify-center text-white`}>
        <div className="text-center">
          {icon}
          <p className="text-sm">{type}</p>
        </div>
        <audio controls src={url} className="absolute bottom-2 left-2 right-2 w-[calc(100%-1rem)]" />
      </div>
    ) : (
      <img src={url} alt={type} className="w-full h-full object-cover" />
    )}
    <Badge className="absolute top-2 left-2">{type}</Badge>
    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
      <Button size="sm" variant="ghost" className="text-white" onClick={() => window.open(url, '_blank')}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" className="text-white" onClick={() => { const a = document.createElement('a'); a.href = url; a.download = ''; a.click(); }}>
        <Download className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

const AnswersTab = () => (
  <div className="text-center py-12">
    <MessageSquare className="h-12 w-12 mx-auto text-purple-600 mb-4" />
    <h3 className="text-lg font-medium">Javoblar statistikasi</h3>
    <p className="text-gray-500 mb-6">Bu task uchun o'quvchilarning javoblari</p>
    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
      <StatCard value="0" label="To'g'ri" bg="from-green-50 to-emerald-50" text="text-green-600" />
      <StatCard value="0" label="Noto'g'ri" bg="from-red-50 to-rose-50" text="text-red-600" />
      <StatCard value="0" label="Jami" bg="from-blue-50 to-indigo-50" text="text-blue-600" />
    </div>
  </div>
);

const StatCard = ({ value, label, bg, text }: any) => (
  <Card className={`border-none shadow-md bg-gradient-to-br ${bg}`}>
    <CardContent className="p-4 text-center">
      <p className={`text-2xl font-bold ${text}`}>{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </CardContent>
  </Card>
);

const InfoCard = ({ task }: { task: Task }) => (
  <Card className="border-none shadow-xl">
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <Info className="h-5 w-5 text-blue-600" /> Ma'lumot
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <Row label="Task ID" value={task.id} />
      <Row label="Exercise ID" value={<Badge className="bg-blue-100 text-blue-800">{task.exercise_id}</Badge>} />
      <Row label="Tartib raqami" value={`#${task.ordinary_number}`} />
      <Row label="Media fayllar" value={<MediaIcons task={task} />} />
      <Row label="Savol bor" value={<Badge className={task.question_text ? 'bg-green-100 text-green-800' : 'bg-gray-100'}>{task.question_text ? 'Ha' : 'Yo\'q'}</Badge>} />
      <Row label="To'g'ri javob" value={<Badge className={task.correct_answer ? 'bg-green-100 text-green-800' : 'bg-gray-100'}>{task.correct_answer ? 'Bor' : 'Yo\'q'}</Badge>} />
    </CardContent>
  </Card>
);

const Row = ({ label, value }: any) => (
  <div className="flex justify-between py-2 border-b border-gray-100">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const MediaIcons = ({ task }: any) => (
  <div className="flex gap-1">
    {task.photo && <Image className="h-4 w-4 text-blue-500" />}
    {task.audio && <Headphones className="h-4 w-4 text-green-500" />}
    {task.video && <Video className="h-4 w-4 text-purple-500" />}
    {task.media && <File className="h-4 w-4 text-gray-500" />}
    {!task.photo && !task.audio && !task.video && !task.media && '—'}
  </div>
);

const ActionsCard = ({ onEdit, onDelete }: any) => (
  <Card className="border-none shadow-xl">
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <Zap className="h-5 w-5 text-yellow-600" /> Tezkor amallar
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <ActionButton onClick={onEdit} icon={<Edit className="h-4 w-4 mr-2" />} label="Tahrirlash" />
      <ActionButton onClick={() => {}} icon={<Copy className="h-4 w-4 mr-2" />} label="Nusxalash" />
      <ActionButton onClick={() => window.open(`/tasks?exercise_id=${task.exercise_id}`, '_blank')} icon={<Layers className="h-4 w-4 mr-2" />} label="Exercise tasklari" />
      <ActionButton onClick={onDelete} icon={<Trash2 className="h-4 w-4 mr-2" />} label="O'chirish" className="hover:bg-red-50 hover:text-red-600" />
    </CardContent>
  </Card>
);

const ActionButton = ({ onClick, icon, label, className = '' }: any) => (
  <Button variant="outline" className={`w-full justify-start border-gray-200 hover:bg-blue-50 hover:text-blue-600 ${className}`} onClick={onClick}>
    {icon} {label}
  </Button>
);

const StatsCard = () => (
  <Card className="border-none shadow-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <BarChart className="h-5 w-5" /> Statistika
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <StatLine label="Ko'rilgan" value="1,234" />
      <StatLine label="Bajarilgan" value="856" />
      <StatLine label="Muvaffaqiyat" value="69%" />
      <div className="pt-4 border-t border-white/20 flex justify-between">
        <span>Reyting</span>
        <Rating value={4} />
      </div>
    </CardContent>
  </Card>
);

const StatLine = ({ label, value }: any) => (
  <div>
    <p className="text-blue-100 text-sm">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const Rating = ({ value }: any) => (
  <div className="flex gap-1">
    {Array(5).fill(0).map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < value ? 'fill-yellow-400 text-yellow-400' : 'text-white/40'}`} />
    ))}
  </div>
);

const DeleteModal = ({ task, onClose, onDelete }: any) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <Card className="max-w-md w-full">
      <CardContent className="pt-6 text-center">
        <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Taskni o'chirish</h3>
        <p className="text-gray-600 mb-6">
          Rostdan ham <span className="font-semibold">{task.title || `Task #${task.id}`}</span> ni o'chirmoqchimisiz?
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onDelete}>
            O'chirish
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);