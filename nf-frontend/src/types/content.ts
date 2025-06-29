import { User } from "./user";

export type MediaType = "image" | "video";

export interface Media {
    id: string;
    url: string;
    type: MediaType;
    thumbnailUrl?: string;
    duration?: number; // for videos
}
export interface Post {
    id: string;
    userId: string;
    user: User;
    title: string | null;
    content: string | null;
    isPremium: boolean;
    price: number | null;
    mediaUrls: string[]; // List of image/video URLs
    mediaType: string[]; // IMAGE, VIDEO, etc.
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
    isBlurred?: boolean; // Optional flag (you may decide based on app logic)
    isLiked?: boolean;
    tipsAmount?: number;
    _count: {
        likes: number;
        comments: number;
    };
    categories?: Category[];
}
export interface Comment {
    id: string;
    post: Post;
    user: User;
    content: string;
    createdAt: string;
    likesCount: number;
    isLiked: boolean;
}

export interface Interaction {
    id: string;
    type: "like" | "comment" | "tip";
    user: User;
    post: Post;
    createdAt: string;
    amount?: number; // for tips
}

export interface Pagination {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export interface FeedResponse {
    posts: Post[];
    pagination: Pagination;
}

export interface FeedFilters {
    creatorId?: string;
    isPremium?: boolean;
    mediaType?: MediaType;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
