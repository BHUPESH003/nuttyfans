import React, { ReactNode } from "react";
import classNames from "classnames";

type Position =
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center";

interface CustomModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    width?: string;
    height?: string;
    position?: Position;
    className?: string;
    showBackdrop?: boolean;
}

const getPositionClasses = (position: Position): string => {
    switch (position) {
        case "top-left":
            return "top-4 left-4";
        case "top-right":
            return "top-4 right-4";
        case "bottom-left":
            return "bottom-4 left-4";
        case "bottom-right":
            return "bottom-4 right-4";
        case "center":
        default:
            return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
    }
};

const CustomModal: React.FC<CustomModalProps> = ({
    isOpen,
    onClose,
    children,
    width = "w-80",
    height = "h-auto",
    position = "center",
    className = "",
    showBackdrop = true,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            {showBackdrop && (
                <div
                    className="absolute inset-0 bg-black bg-opacity-40"
                    onClick={onClose}
                />
            )}
            <div
                className={classNames(
                    "absolute bg-white rounded-xl shadow-lg transition-all",
                    width,
                    height,
                    getPositionClasses(position),
                    className
                )}
            >
                {children}
            </div>
        </div>
    );
};

export default CustomModal;
