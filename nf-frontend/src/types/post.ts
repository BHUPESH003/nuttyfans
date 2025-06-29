import { User } from './user';

export interface Post {
  id: string;
  title?: string;
  content?: string;
  mediaUrls?: string[];
  mediaType?: ('image' | 'video' | 'audio')[];
  isPremium: boolean;
  price?: number;
  creatorId: string;
  creator: User;
  createdAt: string;
  updatedAt: string;
  _count?: {
    likes: number;
    comments: number;
    shares: number;
  };
  categories?: {
    id: string;
    name: string;
  }[];
}

export interface PostCounts {
  likes: number;
  comments: number;
  shares: number;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  userId: string;
  user?: User;
  parentId?: string;
  _count?: {
    replies: number;
    likes: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Like {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
}

export interface PostCreateInput {
  title?: string;
  content?: string;
  isPremium: boolean;
  price?: number;
  categories?: string[];
  mediaIds?: string[];
}

export interface PostUpdateInput extends Partial<PostCreateInput> {
  id: string;
} 