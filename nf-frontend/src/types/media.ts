export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';

export interface Media {
  id: string;
  key: string;
  url: string;
  fileName: string;
  contentType: string;
  mediaType: MediaType;
  uploadStatus: MediaUploadStatus;
  userId: string;
  folder: string;
  metadata?: MediaMetadata;
  createdAt: string;
  updatedAt: string;
}

export type MediaUploadStatus = 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';

export interface MediaMetadata {
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  quality?: string;
  hasThumbnail?: boolean;
  thumbnailUrl?: string;
}

export interface UploadResponse {
  presignedUrl: string;
  key: string;
  publicUrl: string;
  mediaId: string;
  metadata: {
    originalFilename: string;
    contentType: string;
    folder: string;
    userId: string;
  };
}

export interface MediaUploadConfig {
  fileName: string;
  contentType: string;
  folder: string;
  maxSize?: number;
} 