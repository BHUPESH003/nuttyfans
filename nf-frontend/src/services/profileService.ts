import { AxiosResponse } from 'axios';
import { User, CreatorProfile } from 'src/types/user';
import { api } from './api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface MediaResponse {
  id: string;
  url: string;
  key: string;
  mediaType: 'IMAGE' | 'VIDEO';
}

interface UpdateProfileData {
  fullName: string;
  avatarUrl?: string;
  profile: Partial<CreatorProfile>;
}

export class ProfileService {
  static async updateProfile(data: UpdateProfileData): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await api.put('/profile', data);
    return response.data.data;
  }

  static async uploadMedia(formData: FormData): Promise<MediaResponse> {
    const response: AxiosResponse<ApiResponse<MediaResponse>> = await api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  static async getPresignedUrl(data: {
    fileName: string;
    contentType: string;
    folder: string;
  }): Promise<{
    presignedUrl: string;
    key: string;
    publicUrl: string;
    mediaId: string;
  }> {
    const response: AxiosResponse<ApiResponse<{
      presignedUrl: string;
      key: string;
      publicUrl: string;
      mediaId: string;
    }>> = await api.post('/media/presigned-url', data);
    return response.data.data;
  }

  static async confirmMediaUpload(mediaId: string): Promise<MediaResponse> {
    const response: AxiosResponse<ApiResponse<MediaResponse>> = await api.put(`/media/${mediaId}/confirm`);
    return response.data.data;
  }
} 