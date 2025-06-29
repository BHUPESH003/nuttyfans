import { AxiosResponse } from 'axios';
import { Post, Comment, Interaction, FeedFilters, FeedResponse } from 'src/types/content';
import { api } from './api';

interface ApiResponse<T> {
  data: T;
  success: boolean;
}

export class ContentService {
  static async getFeed(filters?: FeedFilters): Promise<FeedResponse> {
    const response: AxiosResponse<ApiResponse<FeedResponse>> = await api.get('/posts', { params: filters });
    return response.data.data;
  }

  static async getPost(postId: string): Promise<Post> {
    const response: AxiosResponse<ApiResponse<Post>> = await api.get(`/posts/${postId}`);
    return response.data.data;
  }

  static async createPost(formData: FormData): Promise<Post> {
    const response: AxiosResponse<ApiResponse<Post>> = await api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  }

  static async deletePost(postId: string): Promise<void> {
    await api.delete(`/posts/${postId}`);
  }

  static async likePost(postId: string): Promise<void> {
    await api.post(`/posts/${postId}/like`);
  }

  static async unlikePost(postId: string): Promise<void> {
    await api.delete(`/posts/${postId}/like`);
  }

  static async getComments(postId: string): Promise<Comment[]> {
    const response: AxiosResponse<ApiResponse<Comment[]>> = await api.get(`/posts/${postId}/comments`);
    return response.data.data;
  }

  static async createComment(postId: string, content: string): Promise<Comment> {
    const response: AxiosResponse<ApiResponse<Comment>> = await api.post(`/posts/${postId}/comments`, { content });
    return response.data.data;
  }

  static async deleteComment(postId: string, commentId: string): Promise<void> {
    await api.delete(`/posts/${postId}/comments/${commentId}`);
  }

  static async sendTip(postId: string, amount: number): Promise<Interaction> {
    const response: AxiosResponse<ApiResponse<Interaction>> = await api.post(`/posts/${postId}/tip`, { amount });
    return response.data.data;
  }
} 