import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { User } from "src/types/user";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
};

// Persist tokens in sessionStorage
export const accessTokenAtom = atomWithStorage<string | null>(
    "accessToken",
    null
);
export const refreshTokenAtom = atomWithStorage<string | null>(
    "refreshToken",
    null
);

// Main auth state atom
export const authStateAtom = atomWithStorage<AuthState>(
    "authState",
    initialState
);

// Derived atom for checking authentication status
export const isAuthenticatedAtom = atom(
    (get) => get(authStateAtom).isAuthenticated && !!get(accessTokenAtom)
);

// Action to set auth tokens
export const setAuthTokensAtom = atom(
    null,
    (
        get,
        set,
        {
            accessToken,
            refreshToken,
        }: { accessToken: string; refreshToken: string }
    ) => {
        set(accessTokenAtom, accessToken);
        set(refreshTokenAtom, refreshToken);
    }
);

// Action to update auth state
export const updateAuthStateAtom = atom(
    null,
    (get, set, update: Partial<AuthState>) => {
        set(authStateAtom, (prev) => ({
            ...prev,
            ...update,
        }));
    }
);

// Action to handle logout
export const logoutAtom = atom(null, (get, set) => {
    set(accessTokenAtom, null);
    set(refreshTokenAtom, null);
    set(authStateAtom, initialState);
    sessionStorage.clear(); // Clear all session storage
});
