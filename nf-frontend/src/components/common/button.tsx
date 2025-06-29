import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger";
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = "primary",
    fullWidth = false,
    className = "",
    disabled,
    ...props
}) => {
    const baseClasses = `
    px-4 py-2 rounded-lg font-medium
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors
    ${fullWidth ? "w-full" : ""}
    ${className}
  `;

    const variantClasses = {
        primary: `bg-[var(--blue)] hover:bg-[var(--dp-blue)] text-white`,
        secondary: `
      bg-gray-100 text-gray-700
      hover:bg-gray-200
      focus:ring-gray-500
    `,
        danger: `
      bg-red-600 text-white
      hover:bg-red-700
      focus:ring-red-500
    `,
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]}`}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};
