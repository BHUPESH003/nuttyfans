import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { UserPreviewCard } from "../userPreviewCard";
import { NavigationOptions } from "swiper/types";

// User type definition
export type User = {
    backgroundImage: string;
    avatar: string;
    username: string;
    handle: string;
    isVerified?: boolean;
    status?: string;
    online?: boolean;
};

type SuggestionsSwiperProps = {
    users: User[];
    title: string;
};

export const Suggestions: React.FC<SuggestionsSwiperProps> = ({
    users,
    title,
}) => {
    // Group users into slides of 3 (desktop) or 2 (mobile)

    const prevRef = useRef<HTMLButtonElement | null>(null);
    const nextRef = useRef<HTMLButtonElement | null>(null);

    return (
        <div className="w-full lg:max-w-xs px-2">
            {/* Heading + Buttons */}
            <div className="flex items-center justify-between px-2 mb-2">
                <h2 className="text-sm font-semibold text-gray-600">{title}</h2>
                <div className="flex gap-2">
                    <button
                        ref={prevRef}
                        className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition"
                    >
                        ◀
                    </button>
                    <button
                        ref={nextRef}
                        className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition"
                    >
                        ▶
                    </button>
                </div>
            </div>

            {/* Swiper Slider */}
            <Swiper
                modules={[Navigation]}
                spaceBetween={10}
                slidesPerView={1}
                direction="horizontal"
                navigation={{
                    prevEl: prevRef.current,
                    nextEl: nextRef.current,
                }}
                watchOverflow={true}
                onBeforeInit={(swiper) => {
                    if (swiper.params.navigation) {
                        const navigation = swiper.params
                            .navigation as NavigationOptions;
                        navigation.prevEl = prevRef.current!;
                        navigation.nextEl = nextRef.current!;
                    }
                }}
                breakpoints={{
                    0: {
                        slidesPerView: 1,
                        slidesPerGroup: 1,
                    },
                    768: {
                        slidesPerView: 1,
                        slidesPerGroup: 1,
                    },
                    1024: {
                        slidesPerView: 1,
                        slidesPerGroup: 1,
                    },
                }}
                onSwiper={(swiper) => {
                    setTimeout(() => swiper.update(), 100);
                }}
            >
                {/* Slide with 2–3 stacked cards */}
                {Array.from({ length: Math.ceil(users.length / 3) }).map(
                    (_, i) => (
                        <SwiperSlide key={i}>
                            <div className="flex flex-col gap-2">
                                {users
                                    .slice(i * 3, i * 3 + 3)
                                    .map((user, j) => (
                                        <UserPreviewCard key={j} {...user} />
                                    ))}
                            </div>
                        </SwiperSlide>
                    )
                )}
            </Swiper>
        </div>
    );
};
