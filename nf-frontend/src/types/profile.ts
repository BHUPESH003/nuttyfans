export interface SocialLinks {
    twitter?: string;
    instagram?: string;
    website?: string;
}

export interface ProfileStats {
    followers: number;
    following: number;
    posts: number;
    likes: number;
}

export interface UserProfile {
    id: string;
    username: string;
    fullName: string;
    email: string;
    bio: string;
    avatarUrl: string;
    coverUrl: string;
    socialLinks: SocialLinks;
    stats: ProfileStats;
    isVerified: boolean;
    subscriptionPrice: number;
    createdAt: string;
    updatedAt: string;
}

export interface ProfileSettings {
    displayName: string;
    bio: string;
    socialLinks: SocialLinks;
    isPrivate: boolean;
    allowMessages: boolean;
    showActivity: boolean;
}

export interface PaymentInfo {
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
    currency: string;
}

export interface NotificationSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    newFollower: boolean;
    newComment: boolean;
    newMessage: boolean;
    newSubscriber: boolean;
} 