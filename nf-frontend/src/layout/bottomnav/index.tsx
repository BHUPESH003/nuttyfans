import { useAtomValue } from "jotai";
import { Home, Plus, MessageSquare } from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";
import { userAtom } from "src/store";

const BottomNav: React.FC = () => {
    const userAtomValue = useAtomValue(userAtom);
    const navItems = [
        { icon: <Home size={24} />, to: "/" },
        // {
        //     icon: <Bell size={24} />,
        //     to: "/notifications",
        //     badge: <NotificationBadge />,
        // },
        { icon: <Plus size={24} />, to: "/create" },
        {
            icon: <MessageSquare size={24} />,
            to: "/messages",
            badge: 16,
        },
    ];

    console.log(userAtomValue);

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex items-center justify-around py-2 z-50 lg:hidden">
            {navItems.map((item, index) => (
                <NavLink
                    key={index}
                    to={item.to}
                    className={({ isActive }) => `
                        relative text-${isActive ? "blue-500" : "gray-500"}
                        hover:text-blue-500 transition-colors
                    `}
                >
                    {item.icon}
                    {item.badge &&
                        (typeof item.badge === "number" ? (
                            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full px-1.5">
                                {item.badge}
                            </span>
                        ) : (
                            item.badge
                        ))}
                </NavLink>
            ))}
            <NavLink
                to={`/profile/${userAtomValue?.username}`}
                className={({ isActive }) => `
                    ${isActive ? "ring-2 ring-blue-500" : ""}
                    rounded-full transition-all
                `}
            >
                <img
                    src="https://placehold.co/32x32"
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover"
                />
            </NavLink>
        </div>
    );
};

export default BottomNav;
