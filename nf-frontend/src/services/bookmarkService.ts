import { AxiosResponse } from 'axios';
import { api } from 'src/services/api';
import {
  Bookmark,
  BookmarkCollection,
  BookmarkCreateInput,
  BookmarkCollectionCreateInput,
} from 'src/types/bookmark';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export class BookmarkService {
  static async getBookmarks(
    page = 1,
    limit = 20,
    collectionId?: string
  ): Promise<{
    bookmarks: Bookmark[];
    total: number;
  }> {
    const response: AxiosResponse<ApiResponse<{
      bookmarks: Bookmark[];
      total: number;
    }>> = await api.get('/bookmarks', {
      params: { page, limit, collectionId },
    });
    return response.data.data;
  }

  static async createBookmark(input: BookmarkCreateInput): Promise<Bookmark> {
    const response: AxiosResponse<ApiResponse<Bookmark>> = await api.post(
      '/bookmarks',
      input
    );
    return response.data.data;
  }

  static async removeBookmark(bookmarkId: string): Promise<void> {
    await api.delete(`/bookmarks/${bookmarkId}`);
  }

  static async updateBookmark(
    bookmarkId: string,
    updates: Partial<BookmarkCreateInput>
  ): Promise<Bookmark> {
    const response: AxiosResponse<ApiResponse<Bookmark>> = await api.put(
      `/bookmarks/${bookmarkId}`,
      updates
    );
    return response.data.data;
  }

  static async getCollections(page = 1, limit = 20): Promise<{
    collections: BookmarkCollection[];
    total: number;
  }> {
    const response: AxiosResponse<ApiResponse<{
      collections: BookmarkCollection[];
      total: number;
    }>> = await api.get('/bookmarks/collections', {
      params: { page, limit },
    });
    return response.data.data;
  }

  static async createCollection(
    input: BookmarkCollectionCreateInput
  ): Promise<BookmarkCollection> {
    const response: AxiosResponse<ApiResponse<BookmarkCollection>> = await api.post(
      '/bookmarks/collections',
      input
    );
    return response.data.data;
  }

  static async updateCollection(
    collectionId: string,
    updates: Partial<BookmarkCollectionCreateInput>
  ): Promise<BookmarkCollection> {
    const response: AxiosResponse<ApiResponse<BookmarkCollection>> = await api.put(
      `/bookmarks/collections/${collectionId}`,
      updates
    );
    return response.data.data;
  }

  static async deleteCollection(collectionId: string): Promise<void> {
    await api.delete(`/bookmarks/collections/${collectionId}`);
  }

  static async addToCollection(
    bookmarkId: string,
    collectionId: string
  ): Promise<void> {
    await api.post(`/bookmarks/${bookmarkId}/collections/${collectionId}`);
  }

  static async removeFromCollection(
    bookmarkId: string,
    collectionId: string
  ): Promise<void> {
    await api.delete(`/bookmarks/${bookmarkId}/collections/${collectionId}`);
  }

  static async isBookmarked(postId: string): Promise<boolean> {
    const response: AxiosResponse<ApiResponse<{ isBookmarked: boolean }>> = await api.get(
      `/bookmarks/check/${postId}`
    );
    return response.data.data.isBookmarked;
  }
} 