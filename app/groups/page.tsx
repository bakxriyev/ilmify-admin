'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  User,
  Calendar,
  Clock,
  BookOpen,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  X,
  AlertCircle,
  MoreVertical,
  GraduationCap,
  Hash,
  CalendarDays,
  Clock3,
  XCircle,
  UserCheck,
  BookMarked,
  Layers,
  DoorOpen,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  groupsApi,
  type Group,
  type GetAllGroupsParams,
} from '@/api/groupsApi';

export default function GroupsListPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState<GetAllGroupsParams>({
    page: 1,
    limit: 10,
    include: 'mainTeacher,supportTeacher,level,lessons',
  });

  const [searchText, setSearchText] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await groupsApi.getAll(filters);
      setGroups(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Guruhlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        page: 1,
        name: searchText || undefined,
      }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Delete handler
  const handleDelete = async () => {
    if (!groupToDelete) return;
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await groupsApi.delete(groupToDelete.id);
      await fetchGroups();
      setShowDeleteModal(false);
      setGroupToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Guruhni o\'chirishda xatolik');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Pagination
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleFilterChange = (key: keyof GetAllGroupsParams, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      include: 'mainTeacher,supportTeacher,level,lessons',
    });
    setSearchText('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading skeleton
  if (loading && groups.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Main content – left aligned, no max-width container */}
      <div className="space-y-6 px-0 md:px-2 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Guruhlar boshqaruvi</h1>
            <p className="text-gray-600 mt-1">O'quv guruhlari va dars jadvallarini boshqaring</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={fetchGroups}
              disabled={loading}
              className="border-gray-300 hover:bg-gray-100"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Yangilash
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/groups/new">
                <Plus className="h-4 w-4 mr-2" />
                Guruh yaratish
              </Link>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters Card */}
        <Card className="border border-gray-200">
          {/* ... filter content (unchanged) ... */}
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-800">Qidirish va filtrlash</CardTitle>
                <CardDescription className="text-gray-600">
                  {pagination.total} ta guruh topildi
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdvancedFilters(!advancedFilters)}
                  className="text-gray-700 hover:bg-gray-100"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {advancedFilters ? 'Oddiy' : 'Kengaytirilgan'} filtr
                </Button>
                {(searchText || filters.teacher_id || filters.support_teacher_id || filters.day) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-700 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Tozalash
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* ... search and advanced filters ... */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Guruh nomi bo'yicha qidirish..."
                  className="pl-10 border-gray-300"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              {advancedFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div className="space-y-2">
                    <Label htmlFor="teacher_id">O'qituvchi ID</Label>
                    <Input
                      id="teacher_id"
                      placeholder="O'qituvchi ID"
                      value={filters.teacher_id || ''}
                      onChange={(e) => handleFilterChange('teacher_id', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support_teacher_id">Yordamchi o'qituvchi ID</Label>
                    <Input
                      id="support_teacher_id"
                      placeholder="Yordamchi o'qituvchi ID"
                      value={filters.support_teacher_id || ''}
                      onChange={(e) => handleFilterChange('support_teacher_id', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="day">Kun</Label>
                    <Input
                      id="day"
                      placeholder="Kun (masalan, Dushanba)"
                      value={filters.day || ''}
                      onChange={(e) => handleFilterChange('day', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="limit">Sahifadagi soni</Label>
                    <Select
                      value={String(filters.limit)}
                      onValueChange={(value) => handleLimitChange(Number(value))}
                    >
                      <SelectTrigger id="limit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 / sahifa</SelectItem>
                        <SelectItem value="10">10 / sahifa</SelectItem>
                        <SelectItem value="20">20 / sahifa</SelectItem>
                        <SelectItem value="50">50 / sahifa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Groups List */}
        <Card className="border border-gray-200">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-gray-800">Guruhlar ro'yxati</CardTitle>
                <CardDescription className="text-gray-600">
                  {groups.length} ta guruh ko'rsatilmoqda ({pagination.total} tadan), {pagination.page}-sahifa
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={String(filters.limit)}
                  onValueChange={(value) => handleLimitChange(Number(value))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                        <SelectItem value="5">5 / sahifa</SelectItem>
                        <SelectItem value="10">10 / sahifa</SelectItem>
                        <SelectItem value="20">20 / sahifa</SelectItem>
                        <SelectItem value="50">50 / sahifa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Guruhlar topilmadi</h3>
                <p className="text-gray-600 mb-6">
                  {searchText || filters.teacher_id || filters.support_teacher_id || filters.day
                    ? 'Qidiruv shartlarini o\'zgartirib ko\'ring'
                    : 'Birinchi guruhingizni yaratishdan boshlang'}
                </p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/groups/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Guruh yaratish
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table – butun qator bosiladigan */}
                <div className="hidden md:block overflow-x-auto rounded-md border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-[250px] text-gray-700 font-semibold">Guruh nomi</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Asosiy o'qituvchi</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Yordamchi o'qituvchi</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Daraja</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Xona</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Studentlar</TableHead>
                        <TableHead className="text-gray-700 font-semibold">O'rinlar</TableHead>
                        <TableHead className="text-right w-[180px] text-gray-700 font-semibold">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groups.map((group) => (
                        <TableRow
                          key={group.id}
                          className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                          onClick={() => router.push(`/groups/${group.id}`)}
                        >
                          <TableCell>
                            <div className="font-medium text-gray-900">{group.name}</div>
                            <div className="text-sm text-gray-500">ID: {group.id}</div>
                          </TableCell>
                          <TableCell>
                            {group.mainTeacher ? (
                              <div>
                                <div className="font-medium text-gray-900">
                                  {group.mainTeacher.first_name} {group.mainTeacher.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{group.mainTeacher.gmail}</div>
                              </div>
                            ) : (
                              <span className="text-gray-500">Biriktirilmagan</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {group.supportTeacher ? (
                              <div>
                                <div className="font-medium text-gray-900">
                                  {group.supportTeacher.first_name} {group.supportTeacher.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{group.supportTeacher.gmail}</div>
                              </div>
                            ) : (
                              <span className="text-gray-500">Biriktirilmagan</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {group.level ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <BookOpen className="h-3 w-3 mr-1" />
                                {group.level.name}
                              </Badge>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {group.room ? (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                <DoorOpen className="h-3 w-3 mr-1" />
                                {group.room.name}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-gray-900">{group.student_count || 0}</span>
                          </TableCell>
                          <TableCell>
                            {group.room ? (
                              <span className={`text-sm font-medium ${(group.room.available_seats || 0) <= 0 ? 'text-red-600' : (group.room.available_seats || 0) <= 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                                {(group.room.available_seats || 0)}/{group.room.capacity}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center gap-1 text-gray-700">
                                <Calendar className="h-3 w-3" />
                                <span>{group.lessons?.length || 0} ta dars</span>
                              </div>
                              {group.lessons && group.lessons.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Next: {formatDate(group.lessons[0].date)} soat {group.lessons[0].time}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                title="Batafsil"
                              >
                                <Link href={`/groups/${group.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="h-8 w-8 p-0 text-gray-600 hover:text-green-600 hover:bg-green-50"
                                title="Tahrirlash"
                              >
                                <Link href={`/groups/${group.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="border border-gray-200">
                                  <DropdownMenuItem asChild className="text-gray-700">
                                  <Link href={`/groups/${group.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Batafsil
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="text-gray-700">
                                  <Link href={`/groups/${group.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Tahrirlash
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGroupToDelete(group);
                                      setShowDeleteModal(true);
                                      setDeleteError(null);
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    O'chirish
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards – butun karta bosiladigan */}
                <div className="md:hidden space-y-4">
                  {groups.map((group) => (
                    <Card
                      key={group.id}
                      className="border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => router.push(`/groups/${group.id}`)}
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{group.name}</h3>
                              <p className="text-sm text-gray-500">ID: {group.id}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-600 hover:text-gray-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="border border-gray-200">
                                <DropdownMenuItem asChild className="text-gray-700">
                                  <Link href={`/groups/${group.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ko'rish
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="text-gray-700">
                                  <Link href={`/groups/${group.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Tahrirlash
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setGroupToDelete(group);
                                    setShowDeleteModal(true);
                                    setDeleteError(null);
                                  }}
                                  className="text-red-600"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    O'chirish
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-700">Asosiy o'qituvchi</div>
                              <div className="text-sm text-gray-900">
                                {group.mainTeacher
                                  ? `${group.mainTeacher.first_name} ${group.mainTeacher.last_name}`
                                  : 'Biriktirilmagan'}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-700">Yordamchi o'qituvchi</div>
                              <div className="text-sm text-gray-900">
                                {group.supportTeacher
                                  ? `${group.supportTeacher.first_name} ${group.supportTeacher.last_name}`
                                  : 'Biriktirilmagan'}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {group.level && (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200"
                              >
                                <BookOpen className="h-3 w-3" />
                                {group.level.name}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 bg-gray-50 text-gray-700 border-gray-200"
                            >
                              <Calendar className="h-3 w-3" />
                              {group.lessons?.length || 0} ta dars
                            </Badge>
                          </div>

                          {group.lessons && group.lessons.length > 0 && (
                            <div className="text-sm">
                              <div className="font-medium text-gray-700 mb-1">Keyingi dars</div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="h-4 w-4" />
                                {formatDate(group.lessons[0].date)} soat {group.lessons[0].time}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination (unchanged) */}
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      {pagination.page}-sahifa / {pagination.totalPages} • jami {pagination.total} ta guruh
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="border-gray-300 hover:bg-gray-100"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Oldingi
                      </Button>
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) pageNum = i + 1;
                          else if (pagination.page <= 3) pageNum = i + 1;
                          else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                          else pageNum = pagination.page - 2 + i;
                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.page === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className={`h-8 w-8 p-0 ${
                                pagination.page === pageNum
                                  ? 'bg-blue-600 hover:bg-blue-700'
                                  : 'border-gray-300 hover:bg-gray-100'
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
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="border-gray-300 hover:bg-gray-100"
                      >
                        Keyingi
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="bg-white sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="text-gray-900">O'chirishni tasdiqlash</DialogTitle>
              <DialogDescription className="text-gray-600">
                <span className="font-semibold text-gray-900">{groupToDelete?.name}</span> guruhini o'chirishga ishonchingiz komilmi? Bu amalni ortga qaytarib bo'lmaydi.
              </DialogDescription>
            </DialogHeader>
            {deleteError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{deleteError}</AlertDescription>
              </Alert>
            )}
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="border-gray-300 hover:bg-gray-100"
              >
                Bekor qilish
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteLoading ? 'O\'chirilmoqda...' : 'Guruhni o\'chirish'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}