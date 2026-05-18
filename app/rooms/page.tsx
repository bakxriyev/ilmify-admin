'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import {
  Building2, Plus, Search, RefreshCw, Edit, Trash2, X, Loader2,
  Users, DoorOpen, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { debounce } from 'lodash';
import { roomsApi, type Room } from '@/api/roomsApi';
import toast from 'react-hot-toast';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    totalCapacity: 0,
    occupiedSeats: 0,
  });

  // Add/Edit modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formName, setFormName] = useState('');
  const [formCapacity, setFormCapacity] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch rooms
  const fetchRooms = useCallback(async (search?: string) => {
    try {
      setTableLoading(true);
      const params = search ? { search } : undefined;
      const response = await roomsApi.getAll(params);
      const data = response.data ?? [];
      setRooms(data);
      setStats({
        total: data.length,
        totalCapacity: data.reduce((acc, r) => acc + r.capacity, 0),
        occupiedSeats: data.reduce((acc, r) => acc + r.occupied_seats, 0),
      });
    } catch (err: any) {
      toast.error(err.message || 'Xonalarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchRooms(searchTerm || undefined);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, fetchRooms]);

  // Open add modal
  const openAddModal = () => {
    setEditingRoom(null);
    setFormName('');
    setFormCapacity('');
    setFormError('');
    setShowFormModal(true);
  };

  // Open edit modal
  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormName(room.name);
    setFormCapacity(String(room.capacity));
    setFormError('');
    setShowFormModal(true);
  };

  // Submit form (create / update)
  const handleFormSubmit = async () => {
    if (!formName.trim()) {
      setFormError('Xona nomini kiriting');
      return;
    }
    const capacity = parseInt(formCapacity);
    if (!capacity || capacity < 1) {
      setFormError('Sig‘imni to‘g‘ri kiriting');
      return;
    }
    try {
      setFormSubmitting(true);
      setFormError('');
      if (editingRoom) {
        await roomsApi.update(editingRoom.id, { name: formName.trim(), capacity });
        toast.success('Xona tahrirlandi');
      } else {
        await roomsApi.create({ name: formName.trim(), capacity });
        toast.success('Xona qo‘shildi');
      }
      setShowFormModal(false);
      fetchRooms(searchTerm || undefined);
    } catch (err: any) {
      setFormError(err.message || 'Xatolik yuz berdi');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!roomToDelete) return;
    try {
      setIsDeleting(true);
      await roomsApi.delete(roomToDelete.id);
      toast.success(`"${roomToDelete.name}" o‘chirildi`);
      fetchRooms(searchTerm || undefined);
      setShowDeleteModal(false);
      setRoomToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'O‘chirishda xatolik');
    } finally {
      setIsDeleting(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    if (searchInputRef.current) searchInputRef.current.value = '';
  };

  if (loading) {
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
        <div className="w-full h-full p-4 md:p-6 lg:p-8">
          <div className="space-y-6 w-full">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white w-full">
              <div className="absolute inset-0 bg-grid-white/[0.1] bg-[length:20px_20px]"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-2xl"></div>

              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/20 backdrop-blur-lg rounded-2xl shadow-xl transform hover:scale-110 transition-all duration-300">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-3">
                        Xonalar
                        <Badge className="bg-white/30 text-white border-white/40 text-sm px-3 py-1">
                          {stats.total} ta
                        </Badge>
                      </h1>
                      <p className="text-white/80 text-lg flex items-center gap-2">
                        <span>Barcha o‘quv xonalarini boshqarish</span>
                        <span className="w-1.5 h-1.5 bg-white/60 rounded-full"></span>
                        <span>Oxirgi yangilanish: {new Date().toLocaleTimeString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => fetchRooms(searchTerm || undefined)}
                      variant="outline"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    >
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Yangilash
                    </Button>
                    <Button
                      onClick={openAddModal}
                      className="bg-white text-blue-600 hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Yangi Xona
                    </Button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                  <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/30 rounded-lg">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-white/70 text-sm">Jami xonalar</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/30 rounded-lg">
                        <DoorOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-white/70 text-sm">Umumiy sig‘im</p>
                        <p className="text-2xl font-bold">{stats.totalCapacity}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/30 rounded-lg">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-white/70 text-sm">Band o‘rinlar</p>
                        <p className="text-2xl font-bold">{stats.occupiedSeats}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Search & Table Card */}
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl overflow-hidden w-full">
              <CardHeader className="pb-3 border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-lg">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-800 dark:text-white">
                        Xonalar ro‘yxati
                      </CardTitle>
                      <CardDescription className="text-gray-500 dark:text-gray-400">
                        {rooms.length} ta xona ko‘rsatilmoqda
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Xona nomi bo‘yicha qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all duration-300 w-full"
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {tableLoading ? (
                  <div className="flex flex-col items-center justify-center py-24">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                      <div className="absolute inset-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Xonalar yuklanmoqda...</p>
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="text-center py-24 px-4">
                    <div className="inline-block p-6 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full mb-6">
                      <Building2 className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Xonalar topilmadi</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
                      {searchTerm ? `"${searchTerm}" bo'yicha hech narsa topilmadi` : 'Yangi xona qo‘shish bilan boshlang'}
                    </p>
                    <div className="flex gap-4 justify-center">
                      {searchTerm && (
                        <Button
                          onClick={clearSearch}
                          variant="outline"
                          className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                        >
                          Qidiruvni tozalash
                        </Button>
                      )}
                      <Button
                        onClick={openAddModal}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 hover:scale-105"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Yangi Xona
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden xl:block overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                          <TableRow>
                            <TableHead className="w-16 text-gray-700 dark:text-gray-300">#</TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300">Xona nomi</TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300">Sig‘im</TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300">Guruhlar soni</TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300">Band o'rinlar</TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300 text-right">Amallar</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rooms.map((room, index) => (
                            <TableRow
                              key={room.id}
                              className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300 group"
                            >
                              <TableCell className="font-medium text-gray-800 dark:text-gray-200">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                                    <Building2 className="h-5 w-5 text-white" />
                                  </div>
                                  <div>
                                     <div className="font-semibold text-gray-900 dark:text-white">
                                      <Link href={`/rooms/${room.id}`} className="hover:text-blue-600 transition-colors">
                                        {room.name}
                                      </Link>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      ID: {room.id}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-3 py-1">
                                  {room.capacity} o‘rin
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1">
                                  {room.groups_count} ta
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 px-3 py-1">
                                  {room.occupied_seats}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      asChild
                                      className="h-9 w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg"
                                      title="Ko‘rish"
                                    >
                                      <Link href={`/rooms/${room.id}`}><DoorOpen className="h-4 w-4" /></Link>
                                    </Button>
                                    <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditModal(room)}
                                    className="h-9 w-9 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all duration-300 hover:scale-110 rounded-lg"
                                    title="Tahrirlash"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setRoomToDelete(room);
                                      setShowDeleteModal(true);
                                    }}
                                    className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300 hover:scale-110 rounded-lg"
                                    title="O‘chirish"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="xl:hidden space-y-4">
                      {rooms.map((room) => (
                        <div
                          key={room.id}
                          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-blue-300 dark:hover:border-blue-700 group"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                                <Building2 className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                  {room.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  ID: {room.id}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(room)}
                                className="h-9 w-9 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all duration-300"
                                title="Tahrirlash"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setRoomToDelete(room);
                                  setShowDeleteModal(true);
                                }}
                                className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300"
                                title="O‘chirish"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sig‘im</p>
                              <p className="font-semibold text-gray-900 dark:text-white">{room.capacity} o‘rin</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Guruhlar</p>
                              <p className="font-semibold text-gray-900 dark:text-white">{room.groups_count} ta</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Band o'rinlar</p>
                              <p className="font-semibold text-gray-900 dark:text-white">{room.occupied_seats}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bo‘sh o‘rinlar</p>
                              <p className="font-semibold text-gray-900 dark:text-white">{room.capacity - room.occupied_seats}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      {/* Add / Edit Modal */}
      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="bg-white dark:bg-gray-900 sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              {editingRoom ? 'Xonani tahrirlash' : 'Yangi xona qo‘shish'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {editingRoom ? 'Xona maʼlumotlarini yangilang' : 'Yangi o‘quv xonasi maʼlumotlarini kiriting'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="room-name" className="text-gray-700 dark:text-gray-300">
                Xona nomi
              </Label>
              <Input
                id="room-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Masalan: 101-xona"
                className="border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all duration-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-capacity" className="text-gray-700 dark:text-gray-300">
                Sig‘im (o‘rinlar soni)
              </Label>
              <Input
                id="room-capacity"
                type="number"
                value={formCapacity}
                onChange={(e) => setFormCapacity(e.target.value)}
                placeholder="Masalan: 30"
                min="1"
                className="border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all duration-300"
              />
            </div>

            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                <X className="h-4 w-4 flex-shrink-0" />
                {formError}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFormModal(false)}
              disabled={formSubmitting}
              className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={formSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 hover:scale-105"
            >
              {formSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                editingRoom ? 'Saqlash' : 'Qo‘shish'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-white dark:bg-gray-900 sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Xonani o‘chirish
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Siz haqiqatan ham <span className="font-semibold text-gray-900 dark:text-white">{roomToDelete?.name}</span> xonasini o‘chirmoqchimisiz? Bu amalni qaytarib bo‘lmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setRoomToDelete(null);
              }}
              disabled={isDeleting}
              className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
            >
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white transition-all duration-300"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  O‘chirilmoqda...
                </>
              ) : (
                'O‘chirish'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
