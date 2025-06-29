import React from "react";

type Props = {
    profileImg: string;
    username: string;
    handle: string;
    isVerified: boolean;
    promoText: string;
    offerLink: string;
    timestamp: string;
};

const UserPromoCard: React.FC<Props> = ({
    profileImg,
    username,
    handle,
    isVerified,
    promoText,
    offerLink,
    timestamp,
}) => {
    return (
        <div className="border rounded-xl p-4 shadow-md bg-white w-full max-w-md">
            <div className="flex items-start gap-3">
                <img
                    src={profileImg}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                    <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-800">
                            {username}
                        </span>
                        {isVerified && (
                            <svg
                                className="w-4 h-4 text-blue-500"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 12-12-1.5-1.5z" />
                            </svg>
                        )}
                        <span className="text-sm text-gray-500">@{handle}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                        is currently running a promotion,{" "}
                        <a href={offerLink} className="text-blue-500 underline">
                            check it out
                        </a>
                    </p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">
                        {promoText}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{timestamp}</p>
                </div>
            </div>
        </div>
    );
};

export default UserPromoCard;
