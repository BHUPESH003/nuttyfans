import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
    Home,
    Bell,
    MessageCircle,
    Star,
    Users,
    CreditCard,
    User,
    MoreHorizontal,
    Plus,
} from "lucide-react";
import { Button } from "src/components/common/button";
import useWindowWidth from "src/hooks/useWindowWidth";
import { useAtomValue } from "jotai";
import { userAtom } from "src/store";

const Sidebar: React.FC = () => {
    const userAtomValue = useAtomValue(userAtom);
    // For demo: hardcoded to collapsed
    const isCollapsed = useWindowWidth() < 1024;
    const navigate = useNavigate();

    const navItems = [
        { icon: <Home size={20} />, label: "Home", to: "/" },
        // {
        //     icon: <Bell size={20} />,
        //     label: "Notifications",
        //     to: "/notifications",
        //     badge: <NotificationBadge />,
        // },
        {
            icon: <MessageCircle size={20} />,
            label: "Messages",
            to: "/messages",
            badge: 15,
        },
        { icon: <Star size={20} />, label: "Collections", to: "/bookmarks" },
        {
            icon: <Users size={20} />,
            label: "Subscriptions",
            to: "/subscriptions",
        },
        {
            icon: <CreditCard size={20} />,
            label: "Add card",
            to: "/settings/payments",
        },
        {
            icon: <User size={20} />,
            label: "My profile",
            to: `/profile/${userAtomValue?.username}`,
        },
        { icon: <MoreHorizontal size={20} />, label: "More", to: "/settings" },
    ];

    return (
        <aside
            className={`flex flex-col ${
                isCollapsed ? "w-16" : "w-64"
            } min-h-screen md:p-4 border-r bg-white text-gray-700 transition-all duration-300`}
        >
            {/* Top Avatar */}
            <div
                onClick={() => navigate(`/profile/${userAtomValue?.username}`)}
                className={`flex items-center ${
                    isCollapsed ? "justify-center" : "space-x-3"
                } mb-6 cursor-pointer hover:opacity-80`}
            >
                <img
                    src="https://via.placeholder.com/40"
                    alt="User"
                    className="rounded-full w-10 h-10"
                />
                {!isCollapsed && <span className="font-medium">Username</span>}
            </div>

            {/* Navigation Items */}
            <nav className="flex flex-col gap-4 flex-1">
                {navItems.map((item, index) => (
                    <NavLink
                        key={index}
                        to={item.to}
                        className={({ isActive }) => `
                            flex items-center ${isCollapsed ? "justify-center" : "justify-between"}
                            group hover:text-blue-500 cursor-pointer
                            ${isActive ? "text-blue-500" : ""}
                        `}
                    >
                        {/* Icon + Badge wrapper */}
                        <div
                            className={`relative flex items-center ${
                                isCollapsed ? "justify-center" : "gap-3"
                            }`}
                        >
                            {/* Icon with badge */}
                            <div className="relative">
                                {item.icon}
                                {item.badge &&
                                    (typeof item.badge === "number" ? (
                                        <span className="absolute -top-1 -right-1 text-[9px] bg-[var(--blue)] text-white rounded-full px-1 py-0.5 leading-none shadow">
                                            {item.badge}
                                        </span>
                                    ) : (
                                        item.badge
                                    ))}
                            </div>

                            {/* Label */}
                            {!isCollapsed && (
                                <span className="hidden lg:block">
                                    {item.label}
                                </span>
                            )}
                        </div>
                    </NavLink>
                ))}
            </nav>

            {/* Button */}
            <Button
                onClick={() => navigate("/create")}
                className={`flex items-center ${
                    isCollapsed ? "justify-center" : "justify-evenly"
                } px-2`}
            >
                <Plus size={18} />
                {!isCollapsed && (
                    <span className="hidden lg:block">New Post</span>
                )}
            </Button>
        </aside>
    );
};

export default Sidebar;
