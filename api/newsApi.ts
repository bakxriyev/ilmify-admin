import api from '../lib/api';

export interface News {
  id: string;
  title: string;
  content: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNewsRequest {
  title: string;
  content: string;
  image?: File; // multipart/form-data
}

export interface UpdateNewsRequest {
  title?: string;
  content?: string;
  image?: File;
}

export interface GetAllNewsParams {
  page?: number;
  limit?: number;
  sort_by?: 'title' | 'created_at';
  sort_order?: 'asc' | 'desc';
  search?: string;
}

export interface NewsResponse {
  data: News[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Helper for processing params (copied from levelsApi)
const processApiParams = (params?: GetAllNewsParams): Record<string, any> => {
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

export const newsApi = {
  // POST /news (multipart/form-data)
  async create(data: CreateNewsRequest): Promise<News> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.image) {
      formData.append('image', data.image);
    }

    try {
      const response = await api.post('/news', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating news:', error);
      throw error;
    }
  },

  // GET /news
  async getAll(params?: GetAllNewsParams): Promise<NewsResponse> {
    try {
      const processedParams = processApiParams(params);
      const response = await api.get('/news', { params: processedParams });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching news:', error);
      if (error.response?.status === 400) {
        // Fallback to safe params
        const safeResponse = await api.get('/news', { params: { page: 1, limit: 10 } });
        return safeResponse.data;
      }
      throw error;
    }
  },

  // GET /news/{id}
  async getById(id: string): Promise<News> {
    try {
      const response = await api.get(`/news/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching news ${id}:`, error);
      throw error;
    }
  },

  // PATCH /news/{id} (multipart/form-data)
  async update(id: string, data: UpdateNewsRequest): Promise<News> {
    const formData = new FormData();
    if (data.title !== undefined) formData.append('title', data.title);
    if (data.content !== undefined) formData.append('content', data.content);
    if (data.image) formData.append('image', data.image);

    try {
      const response = await api.patch(`/news/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error updating news ${id}:`, error);
      throw error;
    }
  },

  // DELETE /news/{id}
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/news/${id}`);
    } catch (error: any) {
      console.error(`Error deleting news ${id}:`, error);
      throw error;
    }
  },
};