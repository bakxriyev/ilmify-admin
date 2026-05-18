// app/levels/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Layers,
  BookOpen,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  X,
  AlertCircle,
  Download,
  Upload,
  MoreVertical,
  FileText,
  Hash,
  Calendar,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle,
  Copy,
  List,
  Grid3X3,
  Tag,
  ChevronDown,
  ArrowUpDown,
  PlusCircle,
  Trash,
  AlertTriangle
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
  DialogTitle 
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  levelsApi, 
  type Level, 
  type CreateLevelRequest,
  type GetAllLevelsParams
} from '@/api/levelsApi';

export default function LevelsPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  
  // Loading animations
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<CreateLevelRequest>({
    name: '',
    title: '',
    description: '',
  });

  const [bulkFormData, setBulkFormData] = useState<CreateLevelRequest[]>([
    { name: '', title: '', description: '' },
    { name: '', title: '', description: '' },
    { name: '', title: '', description: '' },
  ]);

  const [unitFormData, setUnitFormData] = useState({
    name: '',
    description: '',
  });

  // Filter states
  const [filters, setFilters] = useState<GetAllLevelsParams>({
    page: 1,
    limit: 10,
    sort_by: 'name',
    sort_order: 'asc',
  });
  
  const [searchText, setSearchText] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [levelUnits, setLevelUnits] = useState<any>(null);
  const [unitsLoading, setUnitsLoading] = useState(false);

  // Animations
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch levels function with enhanced animations
  const fetchLevels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate network delay for loading animation
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const response = await levelsApi.getAll(filters);
      setLevels(response.data);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });
      setSelectedLevels([]); // Reset selection
      
      // Initial load animation complete
      if (isInitialLoad) {
        setTimeout(() => setIsInitialLoad(false), 300);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch levels');
      console.error('Error fetching levels:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, isInitialLoad]);

  // Initial fetch
  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  // Handle search with debounce and animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        page: 1,
        search: searchText || undefined,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Create level with animation
  const handleCreate = async () => {
    try {
      setIsSubmitting(true);
      setActionLoading('create');
      
      // Animation delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newLevel = await levelsApi.create(formData);
      
      // Add new level to list with animation
      setLevels(prev => [newLevel, ...prev]);
      
      // Show success message
      setSuccessMessage('Level created successfully! ✨');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Close modal with delay
      setTimeout(() => {
        setShowCreateModal(false);
        setFormData({
          name: '',
          title: '',
          description: '',
        });
      }, 500);
      
      setError(null);
      // Refresh list
      await fetchLevels();
    } catch (err: any) {
      setError(err.message || 'Failed to create level');
    } finally {
      setIsSubmitting(false);
      setActionLoading(null);
    }
  };

  // Bulk create levels
  const handleBulkCreate = async () => {
    try {
      setIsSubmitting(true);
      setActionLoading('bulk-create');
      
      // Filter out empty rows
      const validData = bulkFormData.filter(level => 
        level.name.trim() && level.title.trim()
      );
      
      if (validData.length === 0) {
        setError('Please fill at least one valid level');
        return;
      }
      
      // Animation delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newLevels = await levelsApi.createBulk(validData);
      
      // Add new levels to list with animation
      setLevels(prev => [...newLevels, ...prev]);
      
      // Show success message
      setSuccessMessage(`${newLevels.length} levels created successfully! ✨`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Close modal with delay
      setTimeout(() => {
        setShowBulkCreateModal(false);
        setBulkFormData([
          { name: '', title: '', description: '' },
          { name: '', title: '', description: '' },
          { name: '', title: '', description: '' },
        ]);
      }, 500);
      
      setError(null);
      // Refresh list
      await fetchLevels();
    } catch (err: any) {
      setError(err.message || 'Failed to create levels');
    } finally {
      setIsSubmitting(false);
      setActionLoading(null);
    }
  };

  // Update level with animation
  const handleUpdate = async () => {
    if (!selectedLevel) return;
    
    try {
      setIsSubmitting(true);
      setActionLoading('update');
      
      // Animation delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const updatedLevel = await levelsApi.update(
        selectedLevel.id, 
        formData
      );
      
      // Update level in list with animation
      setLevels(prev => 
        prev.map(level => 
          level.id === updatedLevel.id ? updatedLevel : level
        )
      );
      
      // Show success message
      setSuccessMessage('Level updated successfully! ✨');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Close modal with delay
      setTimeout(() => {
        setShowEditModal(false);
        setFormData({
          name: '',
          title: '',
          description: '',
        });
        setSelectedLevel(null);
      }, 500);
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update level');
    } finally {
      setIsSubmitting(false);
      setActionLoading(null);
    }
  };

  // Delete level with animation
  const handleDelete = async () => {
    if (!selectedLevel) return;
    
    try {
      setIsSubmitting(true);
      setActionLoading('delete');
      
      // Animation delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await levelsApi.delete(selectedLevel.id);
      
      // Remove level from list with animation
      setLevels(prev => prev.filter(l => l.id !== selectedLevel.id));
      
      // Show success message
      setSuccessMessage('Level deleted successfully! ✨');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Close modal with delay
      setTimeout(() => {
        setShowDeleteModal(false);
        setSelectedLevel(null);
        setSelectedLevels(prev => prev.filter(id => id !== selectedLevel.id));
      }, 500);
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete level');
    } finally {
      setIsSubmitting(false);
      setActionLoading(null);
    }
  };

  // Delete multiple levels
  const handleDeleteMultiple = async () => {
    if (selectedLevels.length === 0) return;
    
    try {
      setIsSubmitting(true);
      setActionLoading('delete-multiple');
      
      // Animation delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Delete each selected level
      await Promise.all(
        selectedLevels.map(id => levelsApi.delete(id))
      );
      
      // Remove deleted levels from list with animation
      setLevels(prev => prev.filter(l => !selectedLevels.includes(l.id)));
      
      // Show success message
      setSuccessMessage(`${selectedLevels.length} levels deleted successfully! ✨`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reset selection
      setTimeout(() => setSelectedLevels([]), 500);
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete selected levels');
    } finally {
      setIsSubmitting(false);
      setActionLoading(null);
    }
  };

  // Add unit to level
  const handleAddUnit = async () => {
    if (!selectedLevel) return;
    
    try {
      setIsSubmitting(true);
      setActionLoading('add-unit');
      
      // Animation delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newUnit = await levelsApi.addUnit(selectedLevel.id, unitFormData);
      
      // Update level units
      if (levelUnits) {
        setLevelUnits({
          ...levelUnits,
          data: [newUnit, ...levelUnits.data],
          total: levelUnits.total + 1,
        });
      }
      
      // Show success message
      setSuccessMessage('Unit added successfully! ✨');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Close modal with delay
      setTimeout(() => {
        setShowAddUnitModal(false);
        setUnitFormData({
          name: '',
          description: '',
        });
      }, 500);
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to add unit');
    } finally {
      setIsSubmitting(false);
      setActionLoading(null);
    }
  };

  // Open edit modal with animation
  const openEditModal = (level: Level) => {
    setSelectedLevel(level);
    setFormData({
      name: level.name,
      title: level.title,
      description: level.description,
    });
    setShowEditModal(true);
  };

  // Open view modal with animation and fetch units
  const openViewModal = async (level: Level) => {
    setSelectedLevel(level);
    setShowViewModal(true);
    
    // Fetch units for this level
    try {
      setUnitsLoading(true);
      const unitsResponse = await levelsApi.getUnits(level.id, { page: 1, limit: 5 });
      setLevelUnits(unitsResponse);
    } catch (err: any) {
      console.error('Error fetching units:', err);
    } finally {
      setUnitsLoading(false);
    }
  };

  // Load more units
  const loadMoreUnits = async () => {
    if (!selectedLevel || !levelUnits || levelUnits.page >= levelUnits.totalPages) return;
    
    try {
      setUnitsLoading(true);
      const nextPage = levelUnits.page + 1;
      const unitsResponse = await levelsApi.getUnits(selectedLevel.id, { 
        page: nextPage, 
        limit: 5 
      });
      
      setLevelUnits({
        ...unitsResponse,
        data: [...levelUnits.data, ...unitsResponse.data],
      });
    } catch (err: any) {
      console.error('Error loading more units:', err);
    } finally {
      setUnitsLoading(false);
    }
  };

  // Select/deselect all levels
  const toggleSelectAll = () => {
    if (selectedLevels.length === levels.length) {
      setSelectedLevels([]);
    } else {
      setSelectedLevels(levels.map(l => l.id));
    }
  };

  // Toggle single level selection
  const toggleLevelSelection = (levelId: string) => {
    setSelectedLevels(prev =>
      prev.includes(levelId)
        ? prev.filter(id => id !== levelId)
        : [...prev, levelId]
    );
  };

  // Add new bulk form row
  const addBulkFormRow = () => {
    setBulkFormData(prev => [...prev, { name: '', title: '', description: '' }]);
  };

  // Remove bulk form row
  const removeBulkFormRow = (index: number) => {
    setBulkFormData(prev => prev.filter((_, i) => i !== index));
  };

  // Update bulk form data
  const updateBulkFormData = (index: number, field: keyof CreateLevelRequest, value: string) => {
    setBulkFormData(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({ ...prev, sort_by: sortBy as any, page: 1 }));
  };

  const toggleSortOrder = () => {
    setFilters(prev => ({ 
      ...prev, 
      sort_order: prev.sort_order === 'asc' ? 'desc' : 'asc',
      page: 1 
    }));
  };

  // Filter handlers
  const handleFilterChange = (key: keyof GetAllLevelsParams, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sort_by: 'name',
      sort_order: 'asc',
    });
    setSearchText('');
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.title.trim()
    );
  };

  // Check if bulk form has at least one valid row
  const isBulkFormValid = () => {
    return bulkFormData.some(level => level.name.trim() && level.title.trim());
  };

  // Check if unit form is valid
  const isUnitFormValid = () => {
    return unitFormData.name.trim();
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Enhanced loading skeleton with animations
  if (loading && levels.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 p-6">
          <div className="space-y-6 animate-pulse">
            {/* Animated header skeleton */}
            <div className="flex justify-between items-center">
              <div className="space-y-3">
                <div className="h-8 w-48 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-lg shimmer"></div>
                <div className="h-4 w-64 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-lg shimmer"></div>
              </div>
              <div className="h-10 w-32 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-lg shimmer"></div>
            </div>

            {/* Animated search skeleton */}
            <div className="h-12 w-full bg-gradient-to-r from-emerald-100 to-blue-100 rounded-xl shimmer"></div>

            {/* Animated cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <div className="h-6 w-32 bg-gradient-to-r from-emerald-100 to-blue-100 rounded shimmer"></div>
                      <div className="h-8 w-8 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-full shimmer"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gradient-to-r from-emerald-100 to-blue-100 rounded shimmer"></div>
                      <div className="h-4 w-3/4 bg-gradient-to-r from-emerald-100 to-blue-100 rounded shimmer"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-full shimmer"></div>
                      <div className="h-6 w-20 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-full shimmer"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Custom styles for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes slideInRight {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .shimmer {
          background: linear-gradient(90deg, 
            rgba(255,255,255,0) 0%, 
            rgba(255,255,255,0.8) 50%, 
            rgba(255,255,255,0) 100%);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
        
        /* Smooth transitions */
        * {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #10b981, #3b82f6);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #059669, #2563eb);
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 p-4 md:p-6">
        {/* Success Message Toast */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 animate-slideInRight">
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-sm">
              <CheckCircle className="h-6 w-6 animate-pulse" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          </div>
        )}

        <div className="space-y-6 animate-fadeIn">
          {/* Header with animations */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl shadow-lg">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                    Levels Management
                  </h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Organize and manage course levels and their units
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-lg p-1 border border-gray-200">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={`h-8 w-8 p-0 ${viewMode === 'table' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                variant="outline" 
                onClick={fetchLevels}
                disabled={loading}
                className="relative overflow-hidden group border border-emerald-200 hover:border-emerald-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="relative overflow-hidden group bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Level
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border border-emerald-200">
                  <DropdownMenuItem onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Single Level
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowBulkCreateModal(true)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Add Multiple Levels
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Error Alert with animation */}
          {error && (
            <div className="animate-fadeIn">
              <Alert variant="destructive" className="border-red-200 bg-red-50/80 backdrop-blur-sm">
                <AlertCircle className="h-5 w-5 animate-pulse" />
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Selection Actions */}
          {selectedLevels.length > 0 && (
            <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              <Card className="border border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-blue-50/80 backdrop-blur-sm shadow-xl overflow-hidden">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-0">
                        {selectedLevels.length} selected
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Bulk actions available
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteMultiple}
                        disabled={isSubmitting}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        {actionLoading === 'delete-multiple' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete Selected
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLevels([])}
                        className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters Card with glassmorphism */}
          <div className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <Card className="border border-white/50 bg-white/80 backdrop-blur-sm shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-blue-50/30" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                      Search & Filter
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-gray-600">
                      <Sparkles className="h-4 w-4" />
                      {pagination.total} levels found
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAdvancedFilters(!advancedFilters)}
                      className="group border border-emerald-200 hover:border-emerald-300 text-gray-700"
                    >
                      <Filter className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                      {advancedFilters ? 'Simple' : 'Advanced'} Filters
                    </Button>
                    {(searchText || filters.sort_by !== 'name') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-4">
                  {/* Animated Search Bar */}
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-5 w-5 group-hover:scale-110 transition-transform" />
                    <Input
                      placeholder="Search by level name or title..."
                      className="pl-12 pr-4 py-6 border border-emerald-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                    {searchText && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                      </div>
                    )}
                  </div>

                  {/* Advanced Filters with animation */}
                  {advancedFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-emerald-100 animate-fadeIn">
                      <div className="space-y-2">
                        <Label htmlFor="sort" className="text-emerald-600 font-medium">Sort By</Label>
                        <Select 
                          value={filters.sort_by} 
                          onValueChange={handleSortChange}
                        >
                          <SelectTrigger id="sort" className="border-emerald-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border border-emerald-200">
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="created_at">Date Created</SelectItem>
                            <SelectItem value="unit_count">Unit Count</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="limit" className="text-blue-600 font-medium">Items per page</Label>
                        <Select 
                          value={String(filters.limit)} 
                          onValueChange={(value) => handleLimitChange(Number(value))}
                        >
                          <SelectTrigger id="limit" className="border-blue-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border border-blue-200">
                            <SelectItem value="5">5 / page</SelectItem>
                            <SelectItem value="10">10 / page</SelectItem>
                            <SelectItem value="20">20 / page</SelectItem>
                            <SelectItem value="50">50 / page</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleSortOrder}
                          className="w-full border-emerald-200 hover:border-emerald-300"
                        >
                          <ArrowUpDown className="h-4 w-4 mr-2" />
                          {filters.sort_order === 'asc' ? 'Ascending' : 'Descending'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Levels List */}
          <div className="animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            {viewMode === 'table' ? (
              <Card className="border border-white/50 bg-white/80 backdrop-blur-sm shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 to-blue-50/20" />
                <CardHeader className="relative">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                        Levels List
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-gray-600">
                        <Sparkles className="h-4 w-4" />
                        Showing {levels.length} of {pagination.total} levels (Page {pagination.page})
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {levels.length === 0 ? (
                    <div className="text-center py-12 animate-pulse-glow">
                      <div className="inline-block p-4 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl mb-4">
                        <Layers className="h-16 w-16 text-emerald-500 mx-auto" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                        No levels found
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {searchText 
                          ? 'Try changing your search criteria' 
                          : 'Get started by adding your first level'
                        }
                      </p>
                      <Button 
                        onClick={() => setShowCreateModal(true)} 
                        className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Level
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table with hover effects */}
                      <div className="hidden md:block overflow-hidden rounded-xl border border-emerald-100">
                        <Table>
                          <TableHeader className="bg-gradient-to-r from-emerald-50 to-blue-50">
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="w-[50px]">
                                <Checkbox
                                  checked={selectedLevels.length === levels.length && levels.length > 0}
                                  onCheckedChange={toggleSelectAll}
                                  className="border-emerald-300 data-[state=checked]:bg-emerald-600"
                                />
                              </TableHead>
                              <TableHead className="text-emerald-600 font-bold">Level Name</TableHead>
                              <TableHead className="text-emerald-600 font-bold">Title</TableHead>
                              <TableHead className="text-emerald-600 font-bold">Description</TableHead>
                              <TableHead className="text-emerald-600 font-bold">Units</TableHead>
                              <TableHead className="text-emerald-600 font-bold">Created</TableHead>
                              <TableHead className="text-right text-emerald-600 font-bold">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {levels.map((level, index) => (
                              <TableRow 
                                key={level.id} 
                                className={`group hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-blue-50/50 transition-all duration-300 transform hover:scale-[1.02] ${
                                  selectedLevels.includes(level.id) ? "bg-gradient-to-r from-emerald-50/80 to-blue-50/80" : ""
                                }`}
                                style={{ animationDelay: `${index * 0.05}s` }}
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={selectedLevels.includes(level.id)}
                                    onCheckedChange={() => toggleLevelSelection(level.id)}
                                    className="border-emerald-300 data-[state=checked]:bg-emerald-600"
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="font-bold text-gray-900">
                                    {level.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {level.id}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-gray-700">{level.title}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-gray-600 line-clamp-2 max-w-[300px]">
                                    {level.description || 'No description'}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-md">
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    {level.unit_count || 0} units
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm text-gray-600">
                                    {formatDate(level.created_at)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openViewModal(level)}
                                      className="h-8 w-8 p-0 bg-blue-100/50 hover:bg-blue-200 text-blue-600 hover:text-blue-700"
                                      title="View details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditModal(level)}
                                      className="h-8 w-8 p-0 bg-emerald-100/50 hover:bg-emerald-200 text-emerald-600 hover:text-emerald-700"
                                      title="Edit"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 bg-purple-100/50 hover:bg-purple-200 text-purple-600 hover:text-purple-700"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="border border-purple-200">
                                        <DropdownMenuItem onClick={() => openViewModal(level)} className="text-blue-600">
                                          <Eye className="h-4 w-4 mr-2" />
                                          View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openEditModal(level)} className="text-emerald-600">
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit Level
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => {
                                            setSelectedLevel(level);
                                            setShowAddUnitModal(true);
                                          }}
                                          className="text-cyan-600"
                                        >
                                          <PlusCircle className="h-4 w-4 mr-2" />
                                          Add Unit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => {
                                            setSelectedLevel(level);
                                            setShowDeleteModal(true);
                                          }}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
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

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-4">
                        {levels.map((level, index) => (
                          <Card 
                            key={level.id} 
                            className={`border border-emerald-100 bg-white/80 backdrop-blur-sm overflow-hidden transform hover:scale-[1.02] transition-all duration-300 ${
                              selectedLevels.includes(level.id) ? "ring-2 ring-emerald-500" : ""
                            }`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                {/* Level Header with Checkbox */}
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={selectedLevels.includes(level.id)}
                                      onCheckedChange={() => toggleLevelSelection(level.id)}
                                      className="border-emerald-300 data-[state=checked]:bg-emerald-600"
                                    />
                                    <div>
                                      <h3 className="font-bold text-gray-900">
                                        {level.name}
                                      </h3>
                                      <p className="text-sm text-gray-500">
                                        {level.title}
                                      </p>
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="bg-emerald-100/50 text-emerald-600">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="border border-emerald-200">
                                      <DropdownMenuItem onClick={() => openViewModal(level)} className="text-blue-600">
                                        <Eye className="h-4 w-4 mr-2" />
                                        View
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openEditModal(level)} className="text-emerald-600">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setSelectedLevel(level);
                                          setShowAddUnitModal(true);
                                        }}
                                        className="text-cyan-600"
                                      >
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Add Unit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setSelectedLevel(level);
                                          setShowDeleteModal(true);
                                        }}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {/* Description */}
                                <div className="text-sm text-gray-600 p-2 bg-gray-50/50 rounded-lg">
                                  {level.description || 'No description'}
                                </div>

                                {/* Stats */}
                                <div className="flex flex-wrap gap-2">
                                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    {level.unit_count || 0} units
                                  </Badge>
                                  <Badge variant="outline" className="text-gray-600 border-gray-200">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDate(level.created_at)}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Pagination */}
                      {pagination.totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-emerald-100">
                          <div className="text-sm text-gray-600">
                            <Sparkles className="h-4 w-4 inline mr-2" />
                            Page {pagination.page} of {pagination.totalPages} • {pagination.total} total levels
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(pagination.page - 1)}
                              disabled={pagination.page === 1}
                              className="border border-emerald-200 hover:border-emerald-300"
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" />
                              Previous
                            </Button>
                            
                            <div className="flex items-center gap-1">
                              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                                let pageNum;
                                if (pagination.totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (pagination.page <= 3) {
                                  pageNum = i + 1;
                                } else if (pagination.page >= pagination.totalPages - 2) {
                                  pageNum = pagination.totalPages - 4 + i;
                                } else {
                                  pageNum = pagination.page - 2 + i;
                                }
                                
                                return (
                                  <Button
                                    key={pageNum}
                                    variant={pagination.page === pageNum ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`h-8 w-8 p-0 ${pagination.page === pageNum 
                                      ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white' 
                                      : 'border border-emerald-200 hover:bg-gray-100'
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
                              className="border border-emerald-200 hover:border-emerald-300"
                            >
                              Next
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {levels.map((level, index) => (
                  <Card 
                    key={level.id} 
                    className={`border border-emerald-100 bg-white/80 backdrop-blur-sm overflow-hidden transform hover:scale-[1.05] transition-all duration-300 ${
                      selectedLevels.includes(level.id) ? "ring-2 ring-emerald-500" : ""
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Level Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg">
                              <Layers className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg">
                                {level.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {level.title}
                              </p>
                            </div>
                          </div>
                          <Checkbox
                            checked={selectedLevels.includes(level.id)}
                            onCheckedChange={() => toggleLevelSelection(level.id)}
                            className="border-emerald-300 data-[state=checked]:bg-emerald-600"
                          />
                        </div>

                        {/* Description */}
                        <div className="text-sm text-gray-600 line-clamp-3 h-[60px]">
                          {level.description || 'No description provided'}
                        </div>

                        {/* Stats */}
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {level.unit_count || 0} units
                          </Badge>
                          <Badge variant="outline" className="text-gray-600 border-gray-200">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(level.created_at)}
                          </Badge>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewModal(level)}
                            className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(level)}
                            className="flex-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Level Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-cyan-500/10" />
            <DialogHeader className="relative">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Create New Level
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Add a new course level. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 relative">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-emerald-600 font-medium">Level Name *</Label>
                <div className="relative">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Beginner, Intermediate, Advanced"
                    required
                    className="pl-10 border-emerald-200 focus:border-emerald-400 bg-white/50"
                  />
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-5 w-5" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title" className="text-blue-600 font-medium">Title *</Label>
                <div className="relative">
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Beginner Level"
                    required
                    className="pl-10 border-blue-200 focus:border-blue-400 bg-white/50"
                  />
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-5 w-5" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-cyan-600 font-medium">Description</Label>
                <div className="relative">
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this level..."
                    rows={4}
                    className="w-full pl-10 pr-3 py-2 border border-cyan-200 focus:border-cyan-400 rounded-md bg-white/50 resize-none"
                  />
                  <FileText className="absolute left-3 top-3 transform text-cyan-500 h-5 w-5" />
                </div>
              </div>
            </div>
            <DialogFooter className="relative">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
                className="border-gray-300 hover:border-gray-400"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={isSubmitting || !isFormValid()}
                className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-lg"
              >
                {actionLoading === 'create' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Level
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Create Levels Modal */}
        <Dialog open={showBulkCreateModal} onOpenChange={setShowBulkCreateModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10" />
            <DialogHeader className="relative">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Create Multiple Levels
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Add multiple levels at once. Fill at least one row completely.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 relative">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-50 to-pink-50">
                      <th className="py-2 px-3 text-left text-sm font-medium text-purple-600 border-b border-purple-200">#</th>
                      <th className="py-2 px-3 text-left text-sm font-medium text-purple-600 border-b border-purple-200">Level Name *</th>
                      <th className="py-2 px-3 text-left text-sm font-medium text-purple-600 border-b border-purple-200">Title *</th>
                      <th className="py-2 px-3 text-left text-sm font-medium text-purple-600 border-b border-purple-200">Description</th>
                      <th className="py-2 px-3 text-left text-sm font-medium text-purple-600 border-b border-purple-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkFormData.map((row, index) => (
                      <tr key={index} className="border-b border-purple-100 hover:bg-purple-50/30">
                        <td className="py-3 px-3 text-gray-500">{index + 1}</td>
                        <td className="py-3 px-3">
                          <Input
                            value={row.name}
                            onChange={(e) => updateBulkFormData(index, 'name', e.target.value)}
                            placeholder="Level name"
                            className="border-purple-200 focus:border-purple-400"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <Input
                            value={row.title}
                            onChange={(e) => updateBulkFormData(index, 'title', e.target.value)}
                            placeholder="Level title"
                            className="border-pink-200 focus:border-pink-400"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <Input
                            value={row.description}
                            onChange={(e) => updateBulkFormData(index, 'description', e.target.value)}
                            placeholder="Optional description"
                            className="border-rose-200 focus:border-rose-400"
                          />
                        </td>
                        <td className="py-3 px-3">
                          {index > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBulkFormRow(index)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <Button
                variant="outline"
                onClick={addBulkFormRow}
                className="w-full border-dashed border-2 border-purple-300 text-purple-600 hover:border-purple-400 hover:text-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Row
              </Button>
              
              <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div className="text-sm text-purple-700">
                    <p className="font-medium">Tips:</p>
                    <ul className="list-disc ml-4 mt-1 space-y-1">
                      <li>Fill at least one row completely (Name and Title)</li>
                      <li>Empty rows will be ignored</li>
                      <li>You can add more rows as needed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="relative">
              <Button 
                variant="outline" 
                onClick={() => setShowBulkCreateModal(false)}
                className="border-gray-300 hover:border-gray-400"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBulkCreate} 
                disabled={isSubmitting || !isBulkFormValid()}
                className="relative overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
              >
                {actionLoading === 'bulk-create' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Create {bulkFormData.filter(r => r.name && r.title).length} Levels
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Level Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-cyan-500/10" />
            <DialogHeader className="relative">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Edit Level
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Update level information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 relative">
              <div className="space-y-2">
                <Label htmlFor="edit_name" className="text-emerald-600 font-medium">Level Name *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="border-emerald-200 focus:border-emerald-400 bg-white/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_title" className="text-blue-600 font-medium">Title *</Label>
                <Input
                  id="edit_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="border-blue-200 focus:border-blue-400 bg-white/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_description" className="text-cyan-600 font-medium">Description</Label>
                <textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-cyan-200 focus:border-cyan-400 rounded-md bg-white/50 resize-none"
                />
              </div>
            </div>
            <DialogFooter className="relative">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
                className="border-gray-300 hover:border-gray-400"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdate} 
                disabled={isSubmitting || !isFormValid()}
                className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-lg"
              >
                {actionLoading === 'update' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Update Level
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Level Modal */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
            {selectedLevel && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl shadow-lg">
                          <Layers className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <span>{selectedLevel.name}</span>
                          <p className="text-sm font-normal text-gray-600 mt-1">{selectedLevel.title}</p>
                        </div>
                      </DialogTitle>
                      <DialogDescription className="text-gray-600 mt-2">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Hash className="h-4 w-4" />
                            ID: {selectedLevel.id}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Created: {formatDate(selectedLevel.created_at)}
                          </span>
                        </div>
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* Level Details */}
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-gray-900 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        Level Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-gray-500">Description</h4>
                          <p className="text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            {selectedLevel.description || 'No description provided'}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-500">Total Units</h4>
                            <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                              <div className="text-2xl font-bold text-blue-700">
                                {selectedLevel.unit_count || 0}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-500">Created Date</h4>
                            <div className="p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-emerald-600" />
                                <span className="text-gray-900">{formatDate(selectedLevel.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-purple-600" />
                                <span className="text-gray-900">{formatDate(selectedLevel.updated_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Units Section */}
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-gray-900 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        Units
                        <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200">
                          {levelUnits?.total || 0} total units
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {unitsLoading && !levelUnits ? (
                        <div className="text-center py-8">
                          <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
                          <p className="text-gray-600 mt-2">Loading units...</p>
                        </div>
                      ) : levelUnits?.data && levelUnits.data.length > 0 ? (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            {levelUnits.data.map((unit: any) => (
                              <div key={unit.id} className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-medium text-gray-900">{unit.name}</h5>
                                    {unit.description && (
                                      <p className="text-sm text-gray-600 mt-1">{unit.description}</p>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">
                                    Unit
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {levelUnits.total > levelUnits.data.length && (
                            <div className="text-center">
                              <Button
                                variant="outline"
                                onClick={loadMoreUnits}
                                disabled={unitsLoading}
                                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                {unitsLoading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Loading...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Load More Units ({levelUnits.total - levelUnits.data.length} more)
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                          <h4 className="font-medium text-gray-700 mb-1">No units yet</h4>
                          <p className="text-gray-500 text-sm mb-4">This level doesn't have any units yet</p>
                          <Button
                            onClick={() => {
                              setShowViewModal(false);
                              setSelectedLevel(selectedLevel);
                              setShowAddUnitModal(true);
                            }}
                            className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Unit
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <DialogFooter className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Level ID: {selectedLevel.id}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowViewModal(false)}
                      className="border-gray-300 hover:bg-gray-100"
                    >
                      Close
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowViewModal(false);
                        setTimeout(() => openEditModal(selectedLevel), 100);
                      }}
                      className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-lg"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Level
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowViewModal(false);
                        setSelectedLevel(selectedLevel);
                        setShowAddUnitModal(true);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Unit
                    </Button>
                  </div>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Unit Modal */}
        <Dialog open={showAddUnitModal} onOpenChange={setShowAddUnitModal}>
          <DialogContent className="max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-emerald-500/10" />
            <DialogHeader className="relative">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Add New Unit
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Add a new unit to level: <span className="font-semibold text-gray-900">{selectedLevel?.name}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 relative">
              <div className="space-y-2">
                <Label htmlFor="unit_name" className="text-cyan-600 font-medium">Unit Name *</Label>
                <Input
                  id="unit_name"
                  value={unitFormData.name}
                  onChange={(e) => setUnitFormData({ ...unitFormData, name: e.target.value })}
                  placeholder="e.g., Introduction to Programming"
                  required
                  className="border-cyan-200 focus:border-cyan-400 bg-white/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_description" className="text-blue-600 font-medium">Description</Label>
                <textarea
                  id="unit_description"
                  value={unitFormData.description}
                  onChange={(e) => setUnitFormData({ ...unitFormData, description: e.target.value })}
                  placeholder="Describe what this unit covers..."
                  rows={4}
                  className="w-full px-3 py-2 border border-blue-200 focus:border-blue-400 rounded-md bg-white/50 resize-none"
                />
              </div>
            </div>
            <DialogFooter className="relative">
              <Button 
                variant="outline" 
                onClick={() => setShowAddUnitModal(false)}
                className="border-gray-300 hover:border-gray-400"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddUnit} 
                disabled={isSubmitting || !isUnitFormValid()}
                className="relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg"
              >
                {actionLoading === 'add-unit' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Unit
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-rose-500/10 to-pink-500/10" />
            <DialogHeader className="relative">
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                Confirm Delete
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Are you sure you want to delete level <span className="font-semibold text-red-600">{selectedLevel?.name}</span>? 
                {selectedLevel?.unit_count ? (
                  <span className="block mt-2 text-red-500">
                    ⚠️ This level has {selectedLevel.unit_count} unit(s). Deleting it will also remove all associated units.
                  </span>
                ) : null}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="relative">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)}
                className="border-gray-300 hover:border-gray-400"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg"
              >
                {actionLoading === 'delete' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Level
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}