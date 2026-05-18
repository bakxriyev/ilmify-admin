// app/lesson/units/[unitId]/exercises/[exerciseId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileText,
  Eye,
} from 'lucide-react';
import { tasksApi, Task } from '@/api/tasksApi';
import { exercisesApi, Exercise } from '@/api/exercisesApi';
import SummaryDModal from '../../../../../../../components/questionTypes/SummaryDModal';
import SummaryDPreviewModal from '../../../../../../../components/questionPrewiev/SummaryDPreviewMOdal';
import SummaryCModal from '../../../../../../../components/questionTypes/SummaryCModal';
import SummaryCEditModal from '../../../../../../../components/questionPrewiev/SummaryCEditModal'; // to‘g‘ri import
import SummaryChoicePreviewModal from '../../../../../../../components/questionPrewiev/SummaryChoicePreviewModal';
import SummaryCPreviewModal from '../../../../../../../components/questionPrewiev/SummaryCPreviewModal'
import SummaryChoiceEditModal from '../../../../../../../components/questionPrewiev/SummaryChoiceEditModal';
import SummaryChoiceModal from '../../../../../../../components/questionTypes/SummaryChoiceModal';
import SummaryIngModal from '../../../../../../../components/questionTypes/SummaryIng';
import SummaryIngPreviewModal from '../../../../../../../components/questionPrewiev/SummaryIngPreviewModal';
import SummaryNoModal from '../../../../../../../components/questionTypes/SummaryNoModal';
import SummaryNoPreviewModal from '../../../../../../../components/questionPrewiev/SummaryNoPreviewModal';
import SummaryWritingModal from '../../../../../../../components/questionTypes/Writing';
import SummaryWritingEditModal from '../../../../../../../components/questionPrewiev/WritingEditModal';
import SummaryWritingPreviewModal from '../../../../../../../components/questionPrewiev/WritingPreview';
export default function ExerciseTasksPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = parseInt(params.unitId as string);
  const exerciseId = parseInt(params.exerciseId as string);

  // States
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Load exercise data
  useEffect(() => {
    if (exerciseId) {
      exercisesApi.getExerciseById(exerciseId.toString())
        .then(ex => {
          console.log('📌 Exercise loaded:', ex);
          setExercise(ex);
        })
        .catch(err => {
          console.error('Failed to load exercise:', err);
          setExercise(null);
        });
    }
  }, [exerciseId]);

  // Load tasks
  const fetchTasks = async (page = currentPage) => {
    try {
      setLoading(true);
      const response = await tasksApi.getAllTasks(exerciseId, {
        page,
        limit,
        sort_by: 'ordinary_number',
        sort_order: 'ASC',
      });
      console.log('📋 Tasks loaded:', response.data);
      setTasks(response.data);
      setTotalTasks(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.page);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки заданий');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (exerciseId) fetchTasks(1);
  }, [exerciseId]);

  // Delete task
  const handleDelete = async () => {
    if (!selectedTask) return;
    try {
      setActionLoading(true);
      await tasksApi.deleteTask(selectedTask.id);
      setShowDeleteModal(false);
      setSelectedTask(null);
      fetchTasks(currentPage);
      setSuccess('Задание удалено');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Ошибка удаления');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    fetchTasks(page);
  };

  // Render create modal based on exercise type
  const renderCreateModal = () => {
    if (!exercise) return null;
    console.log('🛠 Create modal for type:', exercise.type);
    switch (exercise.type) {
      case 'summary_d':
        return (
          <SummaryDModal
            open={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            exerciseId={exerciseId}
            onSuccess={() => {
              fetchTasks(currentPage);
              setSuccess('Задание создано');
              setTimeout(() => setSuccess(null), 3000);
            }}
          />
        );
      case 'summary_c':
        return (
          <SummaryCModal
            open={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            exerciseId={exerciseId}
            onSuccess={() => {
              fetchTasks(currentPage);
              setSuccess('Задание создано');
              setTimeout(() => setSuccess(null), 3000);
            }}
          />
        );
        case 'summary_ing':
  return (
    <SummaryIngModal
      open={showCreateModal}
      onClose={() => setShowCreateModal(false)}
      exerciseId={exerciseId}
      onSuccess={() => {
        fetchTasks(currentPage);
        setSuccess('Задание создано');
        setTimeout(() => setSuccess(null), 3000);
      }}
    />
  );
      case 'summary_choice':
      return (
        <SummaryChoiceModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          exerciseId={exerciseId}
          onSuccess={() => {
            fetchTasks(currentPage);
            setSuccess('Задание создано');
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      );
      case 'summary_no':
  return (
    <SummaryNoModal
      open={showCreateModal}
      onClose={() => setShowCreateModal(false)}
      exerciseId={exerciseId}
      onSuccess={() => {
        fetchTasks(currentPage);
        setSuccess('Задание создано');
        setTimeout(() => setSuccess(null), 3000);
      }}
    />
  );
  case 'writing':
  return (
    <SummaryWritingModal
      open={showCreateModal}
      onClose={() => setShowCreateModal(false)}
      exerciseId={exerciseId}
      onSuccess={() => {
        fetchTasks(currentPage);
        setSuccess('Задание создано');
        setTimeout(() => setSuccess(null), 3000);
      }}
    />
  );
      default:
        return (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Неподдерживаемый тип</DialogTitle>
                <DialogDescription>
                  Для типа «{exercise.type}» модальное окно ещё не реализовано.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setShowCreateModal(false)}>Закрыть</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
    }
  };

  // Render edit modal based on exercise type
  const renderEditModal = () => {
    if (!exercise || !selectedTask) return null;
    console.log('✏️ Edit modal for type:', exercise.type, 'Task:', selectedTask);
    switch (exercise.type) {
      case 'summary_d':
        return (
          <SummaryDModal
            open={showEditModal}
            onClose={() => setShowEditModal(false)}
            exerciseId={exerciseId}
            task={selectedTask}
            onSuccess={() => {
              fetchTasks(currentPage);
              setSuccess('Задание обновлено');
              setTimeout(() => setSuccess(null), 3000);
            }}
          />
        );
      case 'summary_c':
        return (
          <SummaryCEditModal
            open={showEditModal}
            onClose={() => setShowEditModal(false)}
            exerciseId={exerciseId}
            task={selectedTask}
            onSuccess={() => {
              fetchTasks(currentPage);
              setSuccess('Task yangilandi');
              setTimeout(() => setSuccess(null), 3000);
            }}
          />
        );
         case 'summary_choice':
      return (
        <SummaryChoiceEditModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          exerciseId={exerciseId}
          task={selectedTask}
          onSuccess={() => {
            fetchTasks(currentPage);
            setSuccess('Task yangilandi');
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      );
      case 'summary_ing':
  return (
    <SummaryIngModal
      open={showEditModal}
      onClose={() => setShowEditModal(false)}
      exerciseId={exerciseId}
      task={selectedTask}
      onSuccess={() => {
        fetchTasks(currentPage);
        setSuccess('Task yangilandi');
        setTimeout(() => setSuccess(null), 3000);
      }}
    />
  );
  case 'summary_no':
  return (
    <SummaryNoModal
      open={showEditModal}
      onClose={() => setShowEditModal(false)}
      exerciseId={exerciseId}
      task={selectedTask}
      onSuccess={() => {
        fetchTasks(currentPage);
        setSuccess('Task yangilandi');
        setTimeout(() => setSuccess(null), 3000);
      }}
    />
  );
  case 'writing':
  return (
    <SummaryWritingEditModal
      open={showEditModal}
      onClose={() => setShowEditModal(false)}
      exerciseId={exerciseId}
      task={selectedTask}
      onSuccess={() => {
        fetchTasks(currentPage);
        setSuccess('Task yangilandi');
        setTimeout(() => setSuccess(null), 3000);
      }}
    />
  );
      default:
        return (
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Неподдерживаемый тип</DialogTitle>
                <DialogDescription>
                  Редактирование для типа «{exercise.type}» пока не поддерживается.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setShowEditModal(false)}>Закрыть</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
    }
  };

  // Render preview modal (only for summary_d, can be extended)
 const renderPreviewModal = () => {
  if (!selectedTask || !exercise) return null;
  
  console.log('Preview modal for type:', exercise.type);
  switch (exercise.type) {
    case 'summary_d':
      return (
        <SummaryDPreviewModal
          open={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          task={selectedTask}
        />
      );
    case 'summary_c':
      return (
        <SummaryCPreviewModal
          open={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          task={selectedTask}
        />
      );
       case 'summary_choice':
      return (
        <SummaryChoicePreviewModal
          open={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          task={selectedTask}
        />
      );
      case 'summary_ing':
  return (
    <SummaryIngPreviewModal
      open={showPreviewModal}
      onClose={() => setShowPreviewModal(false)}
      task={selectedTask}
    />
  );
  case 'summary_no':
  return (
    <SummaryNoPreviewModal
      open={showPreviewModal}
      onClose={() => setShowPreviewModal(false)}
      task={selectedTask}
    />
  );
  case 'writing':
  return (
    <SummaryWritingPreviewModal
      open={showPreviewModal}
      onClose={() => setShowPreviewModal(false)}
      task={selectedTask}
    />
  );
    default:
      // Agar boshqa turlar bo'lsa, oddiy dialog ochish mumkin
      return (
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Preview</DialogTitle>
              <DialogDescription>
                {selectedTask.title} - Oldindan ko‘rish
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-700">Bu tur uchun preview hali mavjud emas.</p>
            </div>
          </DialogContent>
        </Dialog>
      );
  }
};

  return (
    <Layout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/lesson/units" className="hover:text-blue-600">Unitlar</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/lesson/units/${unitId}/exercises`} className="hover:text-blue-600">
                Exerciselar
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-gray-900 font-medium">{exercise?.name || 'Exercise'}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              {exercise?.name || 'Exercise'} – Tasklar
            </h1>
            <p className="text-gray-600 mt-1">
              Jami: {totalTasks} ta task | Sahifa {currentPage} / {totalPages}
            </p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              setSelectedTask(null);
              setShowCreateModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Yangi Task
          </Button>
        </div>

        {/* Alerts */}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Tasklar ro‘yxati</CardTitle>
                <CardDescription>
                  Ushbu exercise uchun barcha topshiriqlar.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTasks(currentPage)}
                disabled={loading}
                className="border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Yangilash
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">#</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nomi</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Savol</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tartib</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Rasm</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: limit }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-3 px-4"><Skeleton className="h-4 w-8" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-40" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-12" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="py-3 px-4"><div className="flex justify-end gap-1"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></td>
                      </tr>
                    ))
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <FileText className="h-12 w-12 text-gray-400 mb-2" />
                          <p className="text-gray-600 mb-2">Bu exercise uchun hech qanday task yo‘q</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTask(null);
                              setShowCreateModal(true);
                            }}
                            className="border-gray-300"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Birinchi taskni qo‘shish
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task, index) => (
                      <tr
                        key={task.id}
                        className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                      
                      >
                        <td className="py-3 px-4 text-gray-600 font-medium">
                          {(currentPage - 1) * limit + index + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-blue-600 hover:text-blue-800">
                          {task.title || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                          {task.question_text || '-'}
                        </td>
                        <td className="py-3 px-4">{task.ordinary_number}</td>
                        <td className="py-3 px-4">
                          {task.photo ? (
                            <Badge variant="outline" className="text-xs bg-green-50">Rasm</Badge>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                                setShowPreviewModal(true);
                              }}
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                              title="Предпросмотр"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                                setShowEditModal(true);
                              }}
                              className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                              title="Tahrirlash"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                                setShowDeleteModal(true);
                              }}
                              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                              title="O‘chirish"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {tasks.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {(currentPage - 1) * limit + 1} dan {Math.min(currentPage * limit, totalTasks)} gacha, jami {totalTasks} task
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-gray-300"
                  >
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Oldingi
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`h-8 w-8 p-0 ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-gray-300"
                  >
                    Keyingi
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {renderCreateModal()}
      {renderEditModal()}
      {renderPreviewModal()}

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Taskni O'chirish</DialogTitle>
            <DialogDescription className="text-gray-600">
              <span className="text-red-600 font-semibold">Bu amalni bekor qilib bo'lmaydi.</span>
              <br />
              Rostdan ham <strong className="text-gray-900">{selectedTask?.title}</strong> nomli taskni o'chirmoqchimisiz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={actionLoading}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? (
                <><RefreshCw className="h-4 w-4 animate-spin mr-2" />O'chirilmoqda...</>
              ) : (
                'O\'chirish'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}