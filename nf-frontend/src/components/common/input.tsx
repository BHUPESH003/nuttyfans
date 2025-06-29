import React, { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

type BaseProps = {
  label?: string;
  error?: string;
};

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  as: 'textarea';
  rows?: number;
};

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  as?: never;
};

export type Props = BaseProps & (InputProps | TextareaProps);

export const Input: React.FC<Props> = ({ label, error, as, className = '', ...props }) => {
  const baseClasses = `
    w-full px-3 py-2 border rounded-lg
    focus:outline-none focus:ring-2 focus:ring-blue-500
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${error ? 'border-red-500' : 'border-gray-300'}
    ${className}
  `;

  const renderInput = () => {
    if (as === 'textarea') {
      return (
        <textarea
          className={baseClasses}
          {...(props as TextareaProps)}
        />
      );
    }

    return (
      <input
        className={baseClasses}
        {...(props as InputProps)}
      />
    );
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {renderInput()}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}; 