import useWindowWidth from "src/hooks/useWindowWidth";
import BottomNav from "./bottomnav";
import Sidebar from "./sidebar";
import { Suspense } from "react";
import { Outlet } from "react-router-dom";

const Layout = () => {
    const isCollapsed = useWindowWidth() < 1024;
    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Sidebar (left column) */}
            <div
                className={`sticky top-0 overflow-auto h-[100vh] hidden md:block ${isCollapsed ? "w-16" : "w-64"}  text-white `}
            >
                <Sidebar />
            </div>

            {/* Main content area */}
            <main className="flex-1 w-full md:w-auto p-4 pb-20 md:pb-4">
                <Suspense fallback={<h2>Loading.....</h2>}>
                    <Outlet />
                </Suspense>
            </main>

            {/* Bottom navigation for small screens */}
            <div className="fixed bottom-0 w-full md:hidden z-50">
                <BottomNav />
            </div>
        </div>
    );
};

export default Layout;
