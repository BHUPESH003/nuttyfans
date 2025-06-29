import axios, {
    AxiosInstance,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from "axios";

export interface ApiResponse<T> {
    data: T;
    message?: string;
    status: number;
}

export interface ApiError {
    message: string;
    code: string;
    statusCode: number;
}

interface CustomRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const api: AxiosInstance = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const accessToken = sessionStorage.getItem("accessToken");
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
        const originalRequest = error.config as CustomRequestConfig;

        // If the error is not 401 or the request has already been retried, reject
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            const refreshToken = sessionStorage.getItem("refreshToken");
            if (!refreshToken) {
                throw new Error("No refresh token available");
            }

            // Attempt to refresh the token
            const response = await axios.post(`${baseURL}/auth/refresh`, {
                refreshToken,
            });
            console.log(response.data);
            const { accessToken } = response.data.data;

            sessionStorage.setItem("accessToken", accessToken);

            // Retry the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axios(originalRequest);
        } catch (refreshError) {
            // If token refresh fails, clear auth state and reject
            sessionStorage.clear();
            window.location.href = "/login";
            return Promise.reject(refreshError);
        }
    }
);
