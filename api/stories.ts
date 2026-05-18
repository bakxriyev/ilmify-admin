import api from '../lib/api';

export interface Story {
  id: string | number;
  title: string;
  description: string;
  media_url: string; // e.g., "file-1234567890.png"
  likes: number;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface UploadStoryRequest {
  title: string;
  description: string;
  file: File;
}

export interface UpdateStoryRequest {
  title?: string;
  description?: string;
  file?: File;
}

export interface GetAllStoriesParams {
  page?: number;
  limit?: number;
  sort_by?: 'title' | 'likes' | 'views' | 'created_at';
  sort_order?: 'asc' | 'desc';
  search?: string;
}

export interface StoriesResponse {
  data: Story[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const processApiParams = (params?: GetAllStoriesParams): Record<string, any> => {
  const processedParams: Record<string, any> = {};
  
  if (!params) {
    return { page: 1, limit: 10 };
  }
  
  if (params.page !== undefined && params.page !== null) {
    const pageNum = Number(params.page);
    processedParams.page = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
  } else {
    processedParams.page = 1;
  }
  
  if (params.limit !== undefined && params.limit !== null) {
    const limitNum = Number(params.limit);
    if (isNaN(limitNum) || limitNum < 1) {
      processedParams.limit = 10;
    } else if (limitNum > 100) {
      processedParams.limit = 100;
    } else {
      processedParams.limit = limitNum;
    }
  } else {
    processedParams.limit = 10;
  }
  
  if (params.sort_by) processedParams.sort_by = params.sort_by;
  if (params.sort_order) processedParams.sort_order = params.sort_order;
  if (params.search) processedParams.search = params.search;
  
  return processedParams;
};

export const storiesApi = {
  // POST /stories (create)
  async upload(data: UploadStoryRequest): Promise<Story> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('file', data.file);

    try {
      const response = await api.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error uploading story:', error);
      throw error;
    }
  },

  // GET /stories
  async getAll(params?: GetAllStoriesParams): Promise<StoriesResponse> {
    try {
      const processedParams = processApiParams(params);
      const response = await api.get('/stories', { params: processedParams });
      
      // If backend returns array directly
      if (Array.isArray(response.data)) {
        return {
          data: response.data,
          total: response.data.length,
          page: processedParams.page,
          limit: processedParams.limit,
          totalPages: Math.ceil(response.data.length / processedParams.limit),
        };
      }
      
      // Expected format: { data, total, page, limit, totalPages }
      return response.data;
    } catch (error: any) {
      console.error('Error fetching stories:', error);
      if (error.response?.status === 400) {
        const safeResponse = await api.get('/stories', { params: { page: 1, limit: 10 } });
        return safeResponse.data;
      }
      throw error;
    }
  },

  // GET /stories/{id}
  async getById(id: string | number): Promise<Story> {
    try {
      const response = await api.get(`/stories/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching story ${id}:`, error);
      throw error;
    }
  },

  // PATCH /stories/{id}
  async update(id: string | number, data: UpdateStoryRequest): Promise<Story> {
    const formData = new FormData();
    if (data.title !== undefined) formData.append('title', data.title);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.file) formData.append('file', data.file);

    try {
      const response = await api.patch(`/stories/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error updating story ${id}:`, error);
      throw error;
    }
  },

  // DELETE /stories/{id}
  async delete(id: string | number): Promise<void> {
    try {
      await api.delete(`/stories/${id}`);
    } catch (error: any) {
      console.error(`Error deleting story ${id}:`, error);
      throw error;
    }
  },

  // POST /stories/{id}/like
  async like(id: string | number): Promise<void> {
    try {
      await api.post(`/stories/${id}/like`);
    } catch (error: any) {
      console.error(`Error liking story ${id}:`, error);
      throw error;
    }
  },

  // POST /stories/{id}/unlike (optional, if needed)
  async unlike(id: string | number): Promise<void> {
    try {
      await api.post(`/stories/${id}/unlike`);
    } catch (error: any) {
      console.error(`Error unliking story ${id}:`, error);
      throw error;
    }
  },

  // POST /stories/{id}/view/{viewerId}
  async view(id: string | number, viewerId: string): Promise<void> {
    try {
      await api.post(`/stories/${id}/view/${viewerId}`);
    } catch (error: any) {
      console.error(`Error recording view for story ${id}:`, error);
      throw error;
    }
  },
};