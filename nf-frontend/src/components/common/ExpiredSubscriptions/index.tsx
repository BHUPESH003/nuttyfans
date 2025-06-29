import React from "react";
import { useKeenSlider } from "keen-slider/react";
import { UserPreviewCard } from "../userPreviewCard";

type User = {
    backgroundImage: string;
    avatar: string;
    username: string;
    handle: string;
    isVerified?: boolean;
    status?: string;
    online?: boolean;
};

type ExpiredSubscriptionsProps = {
    users: User[];
};

export const ExpiredSubscriptions: React.FC<ExpiredSubscriptionsProps> = ({
    users,
}) => {
    const [sliderRef] = useKeenSlider<HTMLDivElement>({
        slides: {
            perView: 1,
            spacing: 15,
        },
        breakpoints: {
            "(min-width: 768px)": {
                slides: {
                    perView: 2,
                    spacing: 15,
                },
            },
            "(min-width: 1024px)": {
                slides: {
                    perView: 1,
                    spacing: 15,
                },
            },
        },
    });

    return (
        <div className="w-full lg:max-w-xs px-2 mt-6">
            <h2 className="text-sm font-semibold mb-2 px-2 text-gray-600">
                Expired Subscriptions
            </h2>
            <div ref={sliderRef} className="keen-slider">
                {users.map((user, index) => (
                    <div key={index} className="keen-slider__slide">
                        <UserPreviewCard {...user} />
                    </div>
                ))}
            </div>
        </div>
    );
};
