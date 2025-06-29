import { RegisterData } from "src/types/auth";
import { LoginCredentials } from "src/types/auth";
import { api } from "./api";
import { User } from "src/types/user";
import { setStoredAccessToken, setStoredRefreshToken } from "./auth";
// import { getStoredAccessToken } from "./auth";

interface ApiResponse<T> {
    data: T;
    success: boolean;
}

interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

class AuthService {
    async login(
        credentials: LoginCredentials
    ): Promise<ApiResponse<AuthResponse>> {
        const response = await api.post<ApiResponse<AuthResponse>>(
            "/auth/login",
            credentials
        );
        const { accessToken, refreshToken } = response.data.data;

        // Store tokens
        setStoredAccessToken(accessToken);
        setStoredRefreshToken(refreshToken);

        // Check if access token exists and set user atom
        // if (getStoredAccessToken()) {
        //     const userResponse = await this.getProfile();
        //     localStorage.setItem('user', JSON.stringify(userResponse));
        // }

        return response.data;
    }

    async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
        const response = await api.post<ApiResponse<AuthResponse>>(
            "/auth/register",
            data
        );
        return response.data;
    }

    async logout(): Promise<void> {
        await api.post("/auth/logout");
    }

    async forgotPassword(email: string): Promise<void> {
        await api.post("/auth/forgot-password", { email });
    }

    async resetPassword(token: string, password: string): Promise<void> {
        await api.post("/auth/reset-password", { token, password });
    }

    async verifyEmail(token: string): Promise<void> {
        await api.post("/auth/verify-email", { token });
    }

    async resendVerificationEmail(email: string): Promise<void> {
        await api.post("/auth/resend-verification", { email });
    }

    async getProfile(): Promise<User> {
        const response = await api.get<User>("/auth/me");
        return response.data;
    }

    async updateProfile(data: Partial<User>): Promise<User> {
        const response = await api.patch<User>("/auth/profile", data);
        return response.data;
    }

    async changePassword(
        currentPassword: string,
        newPassword: string
    ): Promise<void> {
        await api.post("/auth/change-password", {
            currentPassword,
            newPassword,
        });
    }
}

export const authService = new AuthService();
