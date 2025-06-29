import React from "react";

type Props = {
    bannerImage?: string;
    profileImage: string;
    username: string;
    handle: string;
    isVerified?: boolean;
    status?: string;
    limitedOfferText?: string;
    offerEndDate?: string;
    promoMessage?: string;
    price?: string;
    expiryDate?: string;
    showOfferCard: boolean;
};

const ProfileOfferCard: React.FC<Props> = ({
    bannerImage,
    profileImage,
    username,
    handle,
    isVerified,
    status,
    limitedOfferText,
    offerEndDate,
    promoMessage,
    price,
    expiryDate,
    showOfferCard,
}) => {
    return (
        <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-lg bg-white">
            {/* Banner */}
            <div className="relative">
                <img
                    src={bannerImage || "https://via.placeholder.com/400x150"}
                    alt="Banner"
                    className="w-full h-36 object-cover"
                />
                <span className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                    75 new posts
                </span>
                <span className="absolute top-2 right-2 bg-white text-black text-xs px-2 py-1 rounded shadow">
                    {status}
                </span>
            </div>

            {/* Profile & Info */}
            <div className="px-4 py-4">
                <div className="flex items-center gap-3">
                    <img
                        src={profileImage}
                        alt="Profile"
                        className="w-14 h-14 rounded-full -mt-10 border-4 border-white shadow"
                    />
                    <div>
                        <div className="flex items-center gap-1">
                            <h2 className="font-semibold text-lg truncate max-w-[160px]">
                                {username}
                            </h2>
                            {isVerified && (
                                <svg
                                    className="w-4 h-4 text-blue-500"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 12-12-1.5-1.5z" />
                                </svg>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">@{handle}</p>
                    </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                    <button className="text-sm text-gray-600 hover:text-blue-500">
                        ⭐ Add to favorites and other lists
                    </button>
                    <button className="text-sm text-gray-600 border rounded px-2 py-1 w-fit">
                        ✉ Message
                    </button>
                </div>

                {/* Offer Card */}
                {showOfferCard && (
                    <div className="mt-4 bg-gray-100 rounded-lg p-3 text-sm">
                        <p className="text-pink-600 font-semibold">
                            {limitedOfferText}
                        </p>
                        <p className="text-gray-500 text-xs mb-2">
                            Offer ends {offerEndDate}
                        </p>

                        <div className="flex items-start gap-2 mt-2">
                            <img
                                src={profileImage}
                                className="w-6 h-6 rounded-full"
                                alt="Mini"
                            />
                            <p className="text-gray-800">{promoMessage}</p>
                        </div>

                        <button className="mt-3 w-full bg-blue-500 text-white font-semibold py-2 rounded">
                            SUBSCRIBE{" "}
                            {price && (
                                <span className="ml-2 text-sm font-normal">
                                    for {price}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* Expiry */}
                <p className="text-xs text-gray-400 mt-2">
                    Expired {expiryDate}
                </p>
                <p className="text-sm text-blue-500 mt-1 cursor-pointer">
                    Show discounted options ⌄
                </p>
            </div>
        </div>
    );
};

export default ProfileOfferCard;
