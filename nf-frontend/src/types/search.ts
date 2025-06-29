import { User } from './user';
import { Post } from './post';

export interface SearchFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  contentType?: 'image' | 'video' | 'text';
  sortBy?: 'recent' | 'popular' | 'trending';
  location?: string;
  subscriptionTier?: string;
}

export interface SearchResults {
  creators: {
    items: User[];
    total: number;
  };
  posts: {
    items: Post[];
    total: number;
  };
  categories: {
    id: string;
    name: string;
    count: number;
  }[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  postCount: number;
  creatorCount: number;
  isPopular: boolean;
}

export interface TrendingContent {
  posts: {
    item: Post;
    score: number; // engagement score
    trend: 'up' | 'down' | 'stable';
  }[];
  creators: {
    user: User;
    score: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  categories: {
    category: Category;
    score: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

export interface RecommendationResponse {
  forYou: Post[];
  similar: Post[];
  trending: Post[];
  fromFollowed: Post[];
} 