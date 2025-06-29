// components/HorizontalSlider.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useRef } from "react";

const HorizontalSlider = ({ children }: { children: React.ReactNode }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            scrollRef.current.scrollTo({
                left:
                    direction === "left"
                        ? scrollLeft - clientWidth
                        : scrollLeft + clientWidth,
                behavior: "smooth",
            });
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow rounded-full p-1"
            >
                <ChevronLeft size={18} />
            </button>
            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-3 scroll-smooth scrollbar-hide px-6"
            >
                {children}
            </div>
            <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow rounded-full p-1"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
};

export default HorizontalSlider;
