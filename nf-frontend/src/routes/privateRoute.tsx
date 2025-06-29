import { useAtomValue } from "jotai";
import { JSX } from "react";
import { Navigate } from "react-router-dom";
import { authStateAtom } from "src/store/auth";

function PrivateRoute(props: { children: JSX.Element }) {
    const { isAuthenticated, isLoading } = useAtomValue(authStateAtom);

    console.log("auth", isAuthenticated);

    // While auth state is loading (e.g. from localStorage or API), don't render or redirect
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        ); // Or a spinner
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return props.children;
}

export default PrivateRoute;
