import { Post } from './post';
import { User } from './user';

export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  post: Post;
  createdAt: string;
  notes?: string;
  collections?: string[];
}

export interface BookmarkCollection {
  id: string;
  name: string;
  description?: string;
  userId: string;
  user: User;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    bookmarks: number;
  };
}

export interface BookmarkCreateInput {
  postId: string;
  notes?: string;
  collections?: string[];
}

export interface BookmarkCollectionCreateInput {
  name: string;
  description?: string;
  isPrivate?: boolean;
} 