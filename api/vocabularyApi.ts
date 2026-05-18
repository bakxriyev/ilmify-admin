import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/lib/constants';
import { Vocabulary, CreateVocabularyRequest, UpdateVocabularyRequest } from '@/types';

export const vocabularyApi = {
  getAll: async (): Promise<Vocabulary[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.VOCABULARY);
    return data;
  },

  getById: async (id: string): Promise<Vocabulary> => {
    const { data } = await apiClient.get(API_ENDPOINTS.VOCABULARY_BY_ID(id));
    return data;
  },

  create: async (vocabulary: CreateVocabularyRequest): Promise<Vocabulary> => {
    const { data } = await apiClient.post(API_ENDPOINTS.VOCABULARY, vocabulary);
    return data;
  },

  update: async (id: string, vocabulary: UpdateVocabularyRequest): Promise<Vocabulary> => {
    const { data } = await apiClient.patch(API_ENDPOINTS.VOCABULARY_BY_ID(id), vocabulary);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.VOCABULARY_BY_ID(id));
  },
};
