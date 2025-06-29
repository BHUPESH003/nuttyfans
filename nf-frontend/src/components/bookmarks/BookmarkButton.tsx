import React, { useState, useEffect } from 'react';
import { BookmarkService } from 'src/services/bookmarkService';

interface BookmarkButtonProps {
  postId: string;
  initialIsBookmarked?: boolean;
  onBookmarkChange?: (isBookmarked: boolean) => void;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  postId,
  initialIsBookmarked = false,
  onBookmarkChange,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialIsBookmarked === undefined) {
      checkBookmarkStatus();
    }
  }, [postId]);

  const checkBookmarkStatus = async () => {
    try {
      const status = await BookmarkService.isBookmarked(postId);
      setIsBookmarked(status);
    } catch (err) {
      console.error('Error checking bookmark status:', err);
    }
  };

  const handleClick = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      if (isBookmarked) {
        // Find the bookmark ID first
        const { bookmarks } = await BookmarkService.getBookmarks();
        const bookmark = bookmarks.find((b) => b.postId === postId);
        if (bookmark) {
          await BookmarkService.removeBookmark(bookmark.id);
          setIsBookmarked(false);
          onBookmarkChange?.(false);
        }
      } else {
        await BookmarkService.createBookmark({ postId });
        setIsBookmarked(true);
        onBookmarkChange?.(true);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`p-2 rounded-full transition-colors ${
        isLoading
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-gray-100'
      }`}
      title={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
    >
      {isBookmarked ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 text-blue-500"
        >
          <path
            fillRule="evenodd"
            d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 text-gray-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
          />
        </svg>
      )}
    </button>
  );
}; 