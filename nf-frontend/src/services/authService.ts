import { AxiosResponse } from "axios";
import { User } from "src/types/user";
import { api } from "./api";

interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export class AuthService {
    static async login(email: string, password: string): Promise<AuthResponse> {
        const response: AxiosResponse<ApiResponse<AuthResponse>> =
            await api.post("/auth/login", {
                email,
                password,
            });
        const { data } = response.data;
        sessionStorage.setItem("accessToken", data.accessToken);
        sessionStorage.setItem("refreshToken", data.refreshToken);
        return data;
    }

    static async register(userData: {
        username: string;
        email: string;
        password: string;
        fullName: string;
    }): Promise<AuthResponse> {
        const response: AxiosResponse<ApiResponse<AuthResponse>> =
            await api.post("/auth/register", userData);
        const { data } = response.data;
        sessionStorage.setItem("accessToken", data.accessToken);
        sessionStorage.setItem("refreshToken", data.refreshToken);
        return data;
    }

    static async refreshToken(refreshToken: string): Promise<AuthResponse> {
        const response: AxiosResponse<ApiResponse<AuthResponse>> =
            await api.post("/auth/refresh-token", {
                refreshToken,
            });
        const { data } = response.data;
        sessionStorage.setItem("accessToken", data.accessToken);
        sessionStorage.setItem("refreshToken", data.refreshToken);
        return data;
    }

    static async getCurrentUser(): Promise<User> {
        const response: AxiosResponse<ApiResponse<User>> =
            await api.get("/auth/me");
        return response.data.data;
    }

    static logout(): void {
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
    }

    static isAuthenticated(): boolean {
        return !!sessionStorage.getItem("accessToken");
    }

    static getAccessToken(): string | null {
        return sessionStorage.getItem("accessToken");
    }

    static getRefreshToken(): string | null {
        return sessionStorage.getItem("refreshToken");
    }
}
