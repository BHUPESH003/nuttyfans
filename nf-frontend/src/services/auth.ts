const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const setStoredAccessToken = (token: string): void => {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const setStoredRefreshToken = (token: string): void => {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const getStoredAccessToken = (): string | null => {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getStoredRefreshToken = (): string | null => {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
};

export const clearStoredTokens = (): void => {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
    return !!getStoredAccessToken();
};
