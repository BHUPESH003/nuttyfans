import React from "react";
import { MoreHorizontal } from "lucide-react";

type UserPreviewCardProps = {
    backgroundImage?: string;
    avatar: string;
    username: string;
    handle: string;
    isVerified?: boolean;
    status?: string;
    online?: boolean;
};

export const UserPreviewCard: React.FC<UserPreviewCardProps> = ({
    backgroundImage = '/images/default-cover.jpg',
    avatar,
    username,
    handle,
    isVerified = false,
    status,
    online = false,
}) => {
    return (
        <div
            className="relative rounded-xl overflow-hidden shadow-md"
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* Overlay */}
            <div className="bg-black/40 w-full h-full absolute top-0 left-0" />

            <div className="relative z-10 flex items-center justify-between p-3">
                <div className="relative flex items-center gap-2">
                    {/* Avatar */}
                    <div className="relative w-12 h-12">
                        <img
                            src={avatar}
                            alt={username}
                            className="w-full h-full rounded-full border-2 border-white object-cover"
                        />
                        {status && (
                            <span className="absolute -top-1 -left-1 bg-white text-xs text-black px-1.5 py-0.5 rounded-full shadow-sm">
                                {status}
                            </span>
                        )}
                        {online && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                        )}
                    </div>

                    {/* Name and handle */}
                    <div className="text-white">
                        <div className="flex items-center gap-1 text-sm font-medium">
                            {username}
                            {isVerified && (
                                <span className="text-blue-400">✔</span>
                            )}
                        </div>
                        <div className="text-xs opacity-80">{handle}</div>
                    </div>
                </div>

                {/* Optional menu */}
                <MoreHorizontal size={18} className="text-white" />
            </div>
        </div>
    );
};
