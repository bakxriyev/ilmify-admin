'use client';

import { useState, useEffect } from 'react';
import { storiesApi, Story, GetAllStoriesParams } from '@/api/stories';
import { Heart, Eye, Upload, X, Loader2, Play, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [viewerModal, setViewerModal] = useState<{ open: boolean; story: Story | null }>({
    open: false,
    story: null,
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';

  // Get current user ID from localStorage
  const getCurrentUserId = (): string | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id || null;
      } catch {
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    fetchStories();
  }, [page]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const params: GetAllStoriesParams = { page, limit };
      const response = await storiesApi.getAll(params);

      let storiesData: Story[] = [];
      let totalPagesCount = 1;

      if (response && Array.isArray(response)) {
        storiesData = response;
        totalPagesCount = Math.ceil(storiesData.length / limit);
      } else if (response && response.data && Array.isArray(response.data)) {
        storiesData = response.data;
        totalPagesCount = response.totalPages || 1;
      } else {
        console.warn('Unexpected stories API response format:', response);
      }

      setStories(storiesData);
      setTotalPages(totalPagesCount);
    } catch (error) {
      toast.error('Failed to load stories');
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      setUploading(true);
      await storiesApi.upload({
        title: formData.title.trim(),
        description: formData.description.trim(),
        file: selectedFile,
      });
      toast.success('Story uploaded');
      setUploadModal(false);
      setFormData({ title: '', description: '' });
      setSelectedFile(null);
      fetchStories();
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (story: Story) => {
    setEditingStory(story);
    setFormData({
      title: story.title,
      description: story.description,
    });
    setSelectedFile(null);
    setUploadModal(true);
  };

  const handleUpdate = async () => {
    if (!editingStory) return;
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      setUploading(true);
      await storiesApi.update(editingStory.id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        file: selectedFile || undefined,
      });
      toast.success('Story updated');
      setUploadModal(false);
      setEditingStory(null);
      setFormData({ title: '', description: '' });
      setSelectedFile(null);
      fetchStories();
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this story?')) return;
    try {
      setDeletingId(id);
      await storiesApi.delete(id);
      toast.success('Story deleted');
      fetchStories();
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLike = async (storyId: string | number) => {
    // Admin cannot like – just show info
    toast('Likes are disabled for admin', { icon: 'ℹ️' });
  };

  const handleView = async (story: Story) => {
    // Increment view count via API
    const viewerId = getCurrentUserId();
    if (viewerId) {
      try {
        await storiesApi.view(story.id, viewerId);
        // Update local state optimistically
        setStories((prev) =>
          prev.map((s) => (s.id === story.id ? { ...s, views: s.views + 1 } : s))
        );
      } catch (error) {
        // silent
      }
    }
    // Open viewer modal
    setViewerModal({ open: true, story });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Stories</h1>
          <button
            onClick={() => {
              setEditingStory(null);
              setFormData({ title: '', description: '' });
              setSelectedFile(null);
              setUploadModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Upload className="w-5 h-5" />
            Upload Story
          </button>
        </div>

        {stories.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No stories yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {stories.map((story) => {
                const isVideo = story.media_url?.match(/\.(mp4|webm|ogg|mov)$/i);
                const mediaUrl = `${BACKEND_URL}/uploads/stories/${story.media_url}`;
                return (
                  <div
                    key={story.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 group relative"
                  >
                    {/* Admin actions */}
                    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(story);
                        }}
                        className="p-1.5 bg-white rounded-full shadow-md hover:bg-amber-50 text-amber-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(story.id);
                        }}
                        disabled={deletingId === story.id}
                        className="p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 text-red-600"
                      >
                        {deletingId === story.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Media Thumbnail */}
                    <div
                      className="relative h-48 w-full bg-gray-100 cursor-pointer"
                      onClick={() => handleView(story)}
                    >
                      {isVideo ? (
                        <>
                          <video
                            src={mediaUrl}
                            className="w-full h-full object-cover"
                            controls={false}
                            muted
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="w-12 h-12 text-white bg-black/50 rounded-full p-3" />
                          </div>
                        </>
                      ) : story.media_url ? (
                        // Using regular img to avoid Next.js image optimization issues
                        <img
                          src={mediaUrl}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          No media
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{story.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{story.description}</p>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(story.id);
                            }}
                            className="flex items-center gap-1 text-red-500 hover:text-red-600"
                          >
                            <Heart className="w-4 h-4 fill-current" />
                            <span>{story.likes || 0}</span>
                          </button>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {story.views || 0}
                          </span>
                        </div>
                        <span className="text-xs">
                          {story.created_at ? new Date(story.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Upload/Edit Modal */}
        {uploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingStory ? 'Edit Story' : 'Upload Story'}
                </h2>
                <button
                  onClick={() => {
                    setUploadModal(false);
                    setEditingStory(null);
                    setSelectedFile(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingStory ? 'Replace file (optional)' : 'File (image or video)'}
                  </label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="w-full"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-500 mt-1">Selected: {selectedFile.name}</p>
                  )}
                  {editingStory && !selectedFile && (
                    <p className="text-sm text-gray-500 mt-1">Current file: {editingStory.media_url}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={() => {
                      setUploadModal(false);
                      setEditingStory(null);
                      setSelectedFile(null);
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingStory ? handleUpdate : handleUpload}
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {uploading ? 'Saving...' : (editingStory ? 'Update' : 'Upload')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Story Viewer Modal */}
        {viewerModal.open && viewerModal.story && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setViewerModal({ open: false, story: null })}
          >
            <div
              className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setViewerModal({ open: false, story: null })}
                className="absolute top-2 right-2 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col max-h-[90vh]">
                {/* Media area - scrollable if needed */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                  {viewerModal.story.media_url?.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                    <video
                      src={`${BACKEND_URL}/uploads/stories/${viewerModal.story.media_url}`}
                      controls
                      autoPlay
                      className="max-h-[70vh] max-w-full"
                    />
                  ) : (
                    <img
                      src={`${BACKEND_URL}/uploads/stories/${viewerModal.story.media_url}`}
                      alt={viewerModal.story.title}
                      className="max-h-[70vh] max-w-full object-contain"
                    />
                  )}
                </div>

                {/* Footer with info */}
                <div className="bg-white p-4 text-gray-900">
                  <h2 className="text-xl font-bold">{viewerModal.story.title}</h2>
                  {viewerModal.story.description && (
                    <p className="text-gray-600 mt-1">{viewerModal.story.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 fill-current text-red-500" />
                      {viewerModal.story.likes || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {viewerModal.story.views || 0}
                    </span>
                    <span>
                      {viewerModal.story.created_at
                        ? new Date(viewerModal.story.created_at).toLocaleDateString()
                        : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}