import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { NavigateFunction } from "react-router-dom";
import { api } from "../services/api";
import {
    authStateAtom,
    accessTokenAtom,
    refreshTokenAtom,
    setAuthTokensAtom,
    updateAuthStateAtom,
    logoutAtom,
    isAuthenticatedAtom,
} from "../store/auth";

interface UseAuthOptions {
    navigate?: NavigateFunction;
}

export const useAuth = (options: UseAuthOptions = {}) => {
    const navigate = options.navigate;
    const [authState] = useAtom(authStateAtom);
    const [accessToken] = useAtom(accessTokenAtom);
    const [refreshToken] = useAtom(refreshTokenAtom);
    const [isAuthenticated] = useAtom(isAuthenticatedAtom);
    const setAuthTokens = useSetAtom(setAuthTokensAtom);
    const updateAuthState = useSetAtom(updateAuthStateAtom);
    const logout = useSetAtom(logoutAtom);

    const login = useCallback(
        async (email: string, password: string) => {
            try {
                updateAuthState({ isLoading: true, error: null });
                const response = await api.post("/auth/login", {
                    email,
                    password,
                });
                const { accessToken, refreshToken, user } = response.data;

                setAuthTokens({ accessToken, refreshToken });
                updateAuthState({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                });

                if (navigate) {
                    navigate("/dashboard");
                }
            } catch (error) {
                updateAuthState({
                    isLoading: false,
                    error: "Invalid credentials",
                });
                throw error;
            }
        },
        [setAuthTokens, updateAuthState, navigate]
    );

    const refreshAuth = useCallback(async () => {
        if (!refreshToken) return false;

        try {
            const response = await api.post("/auth/refresh", { refreshToken });
            const { accessToken: newAccessToken, user } = response.data;

            setAuthTokens({ accessToken: newAccessToken, refreshToken });
            updateAuthState({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });

            return true;
        } catch (error) {
            console.error("Failed to refresh authentication:", error);
            handleLogout();
            return false;
        }
    }, [refreshToken, setAuthTokens, updateAuthState]);

    const handleLogout = useCallback(() => {
        logout();
        if (navigate) {
            navigate("/login");
        }
    }, [logout, navigate]);

    // Check authentication status on mount and token changes
    useEffect(() => {
        const checkAuth = async () => {
            if (!accessToken && !refreshToken) {
                updateAuthState({ isLoading: false });
                return;
            }

            try {
                if (!accessToken && refreshToken) {
                    // Try to refresh the token if we only have a refresh token
                    const success = await refreshAuth();
                    if (!success) {
                        handleLogout();
                    }
                    return;
                }

                // Verify the current token
                const response = await api.get("/auth/verify");
                updateAuthState({
                    user: response.data.user,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                });
            } catch (error) {
                console.error("Authentication check failed:", error);
                // Try to refresh the token if verification fails
                const success = await refreshAuth();
                if (!success) {
                    handleLogout();
                }
            }
        };

        checkAuth();
    }, [accessToken, refreshToken, refreshAuth, handleLogout, updateAuthState]);

    return {
        ...authState,
        isAuthenticated,
        login,
        logout: handleLogout,
        refreshAuth,
    };
};
