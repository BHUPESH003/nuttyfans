import React from "react";

interface UserInfo {
    name: string;
    handle: string;
    avatar: string;
    banner: string;
}

interface PostCardProps {
    author: {
        name: string;
        handle: string;
        avatar: string;
        postedAt: string;
    };
    content: string;
    links: { label: string; url: string }[];
    thumbnail: string;
    highlightText?: {
        title: string;
        subtitle?: string;
    };
    users: UserInfo[];
    likes: number;
}

const PostCard: React.FC<PostCardProps> = ({
    author,
    content,
    links,
    thumbnail,
    highlightText,
    users,
    likes,
}) => {
    return (
        <div className="bg-[#1a1a1a] text-white max-w-xl mx-auto rounded-xl overflow-hidden border border-gray-700">
            {/* Header */}
            <div className="flex items-start gap-3 px-4 pt-4">
                <img
                    src={author.avatar}
                    alt={author.name}
                    className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{author.name}</span>
                        <span className="text-xs text-gray-400">
                            @{author.handle}
                        </span>
                        <span className="text-xs text-gray-500">
                            • {author.postedAt}
                        </span>
                    </div>
                    <p className="text-sm mt-1">
                        {content}
                        <br />
                        {links.map((link, idx) => (
                            <a
                                key={idx}
                                href={link.url}
                                className="text-blue-400 inline-block mr-2"
                            >
                                {link.label}
                            </a>
                        ))}
                    </p>
                </div>
            </div>

            {/* Thumbnail */}
            <div className="relative mt-4">
                <img src={thumbnail} alt="Post" className="w-full" />
                {highlightText && (
                    <div className="absolute bottom-4 left-4 text-white text-xl font-bold drop-shadow-md">
                        {highlightText.title}
                        {highlightText.subtitle && (
                            <div className="text-lg font-light italic">
                                {highlightText.subtitle}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* User Cards */}
            <div className="flex gap-2 px-4 py-3">
                {users.map((user, idx) => (
                    <div
                        key={idx}
                        className="flex-1 bg-[#2a2a2a] rounded-lg overflow-hidden"
                    >
                        <div className="relative">
                            <img
                                src={user.banner}
                                alt={user.name}
                                className="w-full h-24 object-cover"
                            />
                            <div className="absolute bottom-0 left-0 p-2 bg-gradient-to-t from-black w-full">
                                <p className="text-sm font-bold">
                                    @{user.handle}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 pb-4 text-gray-400 text-sm">
                <div className="flex items-center gap-4">
                    <button>❤️</button>
                    <button>💬</button>
                    <button>💸 SEND TIP</button>
                </div>
                <span>{likes} likes</span>
            </div>
        </div>
    );
};

export default PostCard;
