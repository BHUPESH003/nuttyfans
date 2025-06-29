export type User = {
    id: string;
    username: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
    bio?: string;
    role: "USER" | "CREATOR" | "ADMIN";
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
        posts: number;
        subscribers: number;
        subscriptions: number;
    };
};

export interface CreatorProfile {
    id: string;
    userId: string;
    bio: string;
    location?: string;
    website?: string;
    subscriptionPrice: number;
    isVerified: boolean;
    paymentDetails?: {
        paypalEmail?: string;
        stripeAccountId?: string;
    };
    socialLinks?: {
        twitter?: string;
        instagram?: string;
        tiktok?: string;
    };
}

export type UserRole = "USER" | "CREATOR" | "ADMIN";

export interface SocialLinks {
    twitter?: string;
    instagram?: string;
    website?: string;
    [key: string]: string | undefined;
}

export interface UserCounts {
    posts: number;
    subscribers: number;
    subscriptions: number;
    likes?: number;
    comments?: number;
}

export interface UserSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    privateAccount: boolean;
    theme: "light" | "dark" | "system";
    language: string;
}
