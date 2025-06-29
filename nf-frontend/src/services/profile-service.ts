import { api } from "./api";
import {
    UserProfile,
    ProfileSettings,
    PaymentInfo,
    NotificationSettings,
} from "src/types/profile";

interface ApiResponse<T> {
    data: T;
    success: boolean;
}

class ProfileService {
    async getProfile(username: string): Promise<ApiResponse<UserProfile>> {
        const response = await api.get<ApiResponse<UserProfile>>(
            `/users/${username}`
        );
        return response.data;
    }

    async updateProfile(
        data: Partial<UserProfile>
    ): Promise<ApiResponse<UserProfile>> {
        const response = await api.patch<ApiResponse<UserProfile>>(
            "/users/profile",
            data
        );
        return response.data;
    }

    async updateProfileImage(
        file: File
    ): Promise<ApiResponse<{ avatarUrl: string }>> {
        const formData = new FormData();
        formData.append("avatar", file);
        const response = await api.post<ApiResponse<{ avatarUrl: string }>>(
            "/users/avatar",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    }

    async updateCoverImage(
        file: File
    ): Promise<ApiResponse<{ coverUrl: string }>> {
        const formData = new FormData();
        formData.append("cover", file);
        const response = await api.post<ApiResponse<{ coverUrl: string }>>(
            "/profiles/cover",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    }

    async updateSettings(
        settings: Partial<ProfileSettings>
    ): Promise<ApiResponse<ProfileSettings>> {
        const response = await api.patch<ApiResponse<ProfileSettings>>(
            "/profiles/settings",
            settings
        );
        return response.data;
    }

    async updatePaymentInfo(
        paymentInfo: Partial<PaymentInfo>
    ): Promise<ApiResponse<PaymentInfo>> {
        const response = await api.patch<ApiResponse<PaymentInfo>>(
            "/profiles/payment-info",
            paymentInfo
        );
        return response.data;
    }

    async updateNotificationSettings(
        settings: Partial<NotificationSettings>
    ): Promise<ApiResponse<NotificationSettings>> {
        const response = await api.patch<ApiResponse<NotificationSettings>>(
            "/profiles/notifications",
            settings
        );
        return response.data;
    }

    async getStats(username: string) {
        const response = await api.get(`/profiles/${username}/stats`);
        return response.data;
    }
}

export const profileService = new ProfileService();
