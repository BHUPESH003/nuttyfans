import React, { useState } from 'react';
import { ReportModal } from './ReportModal';

interface ReportButtonProps {
  postId: string;
  className?: string;
  variant?: 'icon' | 'text' | 'button';
}

export const ReportButton: React.FC<ReportButtonProps> = ({
  postId,
  className = '',
  variant = 'icon',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    // You could trigger a notification or update UI state here
    console.log('Report submitted successfully');
  };

  const renderButton = () => {
    switch (variant) {
      case 'text':
        return (
          <button
            onClick={() => setIsModalOpen(true)}
            className={`text-gray-500 hover:text-gray-700 ${className}`}
          >
            Report
          </button>
        );
      case 'button':
        return (
          <button
            onClick={() => setIsModalOpen(true)}
            className={`bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 ${className}`}
          >
            Report Content
          </button>
        );
      case 'icon':
      default:
        return (
          <button
            onClick={() => setIsModalOpen(true)}
            className={`text-gray-500 hover:text-gray-700 ${className}`}
            title="Report content"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
              />
            </svg>
          </button>
        );
    }
  };

  return (
    <>
      {renderButton()}
      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        postId={postId}
        onSuccess={handleSuccess}
      />
    </>
  );
}; 