// components/ui/Input.tsx
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    isPassword?: boolean;
    error?: string;
}

export const Input = ({ label, isPassword, error, className, ...props }: InputProps) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="flex flex-col gap-1 w-full">
            {label && (
                <label className="text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    {...props}
                    type={
                        isPassword
                            ? showPassword
                                ? "text"
                                : "password"
                            : props.type
                    }
                    className={twMerge(
                        "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2",
                        error
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500",
                        className
                    )}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                    >
                        {showPassword ? (
                            <EyeOff size={18} />
                        ) : (
                            <Eye size={18} />
                        )}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};
