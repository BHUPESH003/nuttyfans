import React from "react";

type ChatPreviewProps = {
    profileImage: string;
    username: string;
    handle: string;
    messagePreview: string;
    time: string;
    isOnline: boolean;
    isVerified?: boolean;
};

const ChatPreview: React.FC<ChatPreviewProps> = ({
    profileImage,
    username,
    handle,
    messagePreview,
    time,
    isOnline,
    isVerified,
}) => {
    return (
        <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer">
            <div className="flex items-center gap-3">
                <img
                    src={profileImage}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                />
                <div className="text-sm">
                    <div className="flex items-center gap-1">
                        <span className="font-semibold">{username}</span>
                        <span>{isVerified && "✔️"}</span>
                        <span className="text-gray-500">@{handle}</span>
                    </div>
                    <p className="text-gray-700 truncate max-w-[200px]">
                        🖼️ {messagePreview}
                    </p>
                </div>
            </div>
            <div className="flex flex-col items-end text-xs">
                <span className="text-blue-500">{time}</span>
                {isOnline && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                )}
            </div>
        </div>
    );
};

export default ChatPreview;
