import { AxiosResponse } from 'axios';
import { api } from './api';
import {
  SearchFilters,
  SearchResults,
  Category,
  TrendingContent,
  RecommendationResponse,
} from 'src/types/search';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export class SearchService {
  static async search(
    query: string,
    filters?: SearchFilters,
    page = 1,
    limit = 20
  ): Promise<SearchResults> {
    const response: AxiosResponse<ApiResponse<SearchResults>> = await api.get('/search', {
      params: {
        q: query,
        ...filters,
        page,
        limit,
      },
    });
    return response.data.data;
  }

  static async getCategories(): Promise<Category[]> {
    const response: AxiosResponse<ApiResponse<Category[]>> = await api.get('/categories');
    return response.data.data;
  }

  static async getCategoryDetails(categoryId: string): Promise<Category> {
    const response: AxiosResponse<ApiResponse<Category>> = await api.get(`/categories/${categoryId}`);
    return response.data.data;
  }

  static async getTrendingContent(): Promise<TrendingContent> {
    const response: AxiosResponse<ApiResponse<TrendingContent>> = await api.get('/trending');
    return response.data.data;
  }

  static async getRecommendations(): Promise<RecommendationResponse> {
    const response: AxiosResponse<ApiResponse<RecommendationResponse>> = await api.get('/recommendations');
    return response.data.data;
  }

  static async searchCreators(
    query: string,
    filters?: Partial<SearchFilters>,
    page = 1,
    limit = 20
  ): Promise<SearchResults['creators']> {
    const response: AxiosResponse<ApiResponse<SearchResults['creators']>> = await api.get('/search/creators', {
      params: {
        q: query,
        ...filters,
        page,
        limit,
      },
    });
    return response.data.data;
  }

  static async searchPosts(
    query: string,
    filters?: Partial<SearchFilters>,
    page = 1,
    limit = 20
  ): Promise<SearchResults['posts']> {
    const response: AxiosResponse<ApiResponse<SearchResults['posts']>> = await api.get('/search/posts', {
      params: {
        q: query,
        ...filters,
        page,
        limit,
      },
    });
    return response.data.data;
  }

  static async getPopularSearches(): Promise<string[]> {
    const response: AxiosResponse<ApiResponse<string[]>> = await api.get('/search/popular');
    return response.data.data;
  }

  static async getSimilarContent(postId: string): Promise<SearchResults['posts']> {
    const response: AxiosResponse<ApiResponse<SearchResults['posts']>> = await api.get(`/posts/${postId}/similar`);
    return response.data.data;
  }
} 