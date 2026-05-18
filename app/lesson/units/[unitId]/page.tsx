'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, Layers, FileText, Edit, Hash, Calendar, BrainCircuit, Mic, Pencil, Headphones, HelpCircle, Languages, GraduationCap, ListChecks, Users } from 'lucide-react';
import { unitsApi, Unit, UnitStatistics } from '../../../../api/unitsApi';
import { levelsApi, Level } from '../../../../api/levelsApi';

// Exercise type mapping for consistent display
const exerciseTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  reading: { label: 'Reading', icon: BookOpen, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  gap_fill: { label: 'Gap Fill', icon: FileText, color: 'bg-amber-100 text-amber-800 border-amber-200' },
  speaking: { label: 'Speaking', icon: Mic, color: 'bg-green-100 text-green-800 border-green-200' },
  writing: { label: 'Writing', icon: Pencil, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  listening: { label: 'Listening', icon: Headphones, color: 'bg-pink-100 text-pink-800 border-pink-200' },
  test: { label: 'Test', icon: HelpCircle, color: 'bg-red-100 text-red-800 border-red-200' },
  vocabulary: { label: 'Vocabulary', icon: Languages, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  grammar: { label: 'Grammar', icon: GraduationCap, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  summary_c: { label: 'Summary C', icon: ListChecks, color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  summary_d: { label: 'Summary D', icon: ListChecks, color: 'bg-teal-100 text-teal-800 border-teal-200' },
};

export default function UnitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const unitId = parseInt(params.unitId as string);

  const [unit, setUnit] = useState<Unit | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [statistics, setStatistics] = useState<UnitStatistics | null>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!unitId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const unitData = await unitsApi.getById(unitId);
        setUnit(unitData);

        if (unitData.level_id) {
          const levelData = await levelsApi.getById(String(unitData.level_id));
          setLevel(levelData);
        }

        const [stats, exRes] = await Promise.all([
          unitsApi.getStatistics(unitId),
          unitsApi.getExercises(unitId),
        ]);
        setStatistics(stats);
        setExercises(exRes.data || []);
      } catch (err: any) {
        setError(err.message || 'Maʼlumotlarni yuklashda xatolik');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [unitId]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Yuklanmoqda...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !unit) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8">
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertDescription>{error || 'Unit topilmadi'}</AlertDescription>
          </Alert>
          <Button onClick={() => router.back()} className="mt-4 bg-gray-900 hover:bg-gray-800 text-white">
            Orqaga qaytish
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 py-6 bg-gray-50">
        {/* Navigation */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Orqaga
        </Button>

        {/* Unit header card */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  {unit.title || unit.name}
                </CardTitle>
                <CardDescription className="mt-1 text-gray-600">
                  {unit.description || 'Tavsif mavjud emas'}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push(`/lesson/units/${unit.id}/edit`)}
                className="border-gray-300 hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Tahrirlash
              </Button>
            </div>
          </CardHeader>
          <CardContent className="bg-white p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Unit raqami
                </div>
                <div className="text-xl font-semibold text-gray-800">#{unit.unit_number || '—'}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Layers className="h-3 w-3" /> Level
                </div>
                <div className="text-xl font-semibold text-gray-800 flex items-center gap-1">
                  {level ? level.name : 'Biriktirilmagan'}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Mashqlar soni
                </div>
                <div className="text-xl font-semibold text-gray-800">{unit.exercises_count || 0}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Users className="h-3 w-3" /> O‘quvchilar urinishi
                </div>
                <div className="text-xl font-semibold text-gray-800">{unit.students_attempted || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Statistics and Exercises */}
        <Tabs defaultValue="statistics" className="w-full">
          <TabsList className="bg-white border border-gray-200 p-1">
            <TabsTrigger
              value="statistics"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600"
            >
              Statistika
            </TabsTrigger>
            <TabsTrigger
              value="exercises"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600"
            >
              Exerciselar
            </TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="mt-4">
            {statistics ? (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-100 bg-white">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-blue-600" />
                    Unit statistikasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                      <div className="text-3xl font-bold text-blue-600 mb-1 text-center">
                        {statistics.total_exercises || 0}
                      </div>
                      <p className="text-sm text-gray-600 text-center">Jami Mashqlar</p>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                      <div className="text-3xl font-bold text-green-600 mb-1 text-center">
                        {statistics.completed_exercises || 0}
                      </div>
                      <p className="text-sm text-gray-600 text-center">Bajarilgan</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">O'rtacha baho</span>
                      <span className="text-lg font-bold text-gray-900">{statistics.average_score || 0}%</span>
                    </div>
                    <Progress value={statistics.average_score || 0} className="h-2 bg-gray-200 [&>div]:bg-blue-600" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                      <div className="text-3xl font-bold text-purple-600 mb-1 text-center">
                        {statistics.total_vocabs || 0}
                      </div>
                      <p className="text-sm text-gray-600 text-center">Jami Vocablar</p>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                      <div className="text-3xl font-bold text-yellow-600 mb-1 text-center">
                        {statistics.mastered_vocabs || 0}
                      </div>
                      <p className="text-sm text-gray-600 text-center">O'zlashtirilgan</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Users className="h-4 w-4" /> Urinishlar
                      </span>
                      <span className="text-lg font-bold text-gray-900">{statistics.students_attempted || 0}</span>
                    </div>
                  </div>

                  {statistics.last_activity && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">
                          Oxirgi faollik: {new Date(statistics.last_activity).toLocaleString('uz-UZ')}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="bg-white p-8 text-center text-gray-500">
                  <BrainCircuit className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>Statistika mavjud emas</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Exercises Tab */}
          <TabsContent value="exercises" className="mt-4">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100 bg-white">
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Exerciselar
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-white p-6">
                {exercises.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Bu unitda hech qanday exercise yo'q</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exercises.map((ex) => {
                      const typeKey = ex.type?.toLowerCase() || 'test';
                      const config = exerciseTypeConfig[typeKey] || {
                        label: ex.type || 'Exercise',
                        icon: HelpCircle,
                        color: 'bg-gray-100 text-gray-800 border-gray-200',
                      };
                      const Icon = config.icon;

                      return (
                        <div key={ex.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{ex.title || 'Nomsiz exercise'}</h4>
                              {ex.description && (
                                <p className="text-sm text-gray-600 mt-1">{ex.description}</p>
                              )}
                              {/* Task count */}
                              {ex.tasks_count > 0 && (
                                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                  <FileText className="h-3 w-3" /> Ichida {ex.tasks_count} ta task
                                </p>
                              )}
                            </div>
                            <Badge className={`${config.color} border px-3 py-1 font-normal flex items-center gap-1`}>
                              <Icon className="h-3 w-3" />
                              {config.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}