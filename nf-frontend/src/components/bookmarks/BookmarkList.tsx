import React, { useState, useEffect } from 'react';
import { BookmarkService } from 'src/services/bookmarkService';
import { Bookmark, BookmarkCollection } from 'src/types/bookmark';
import { PostCard } from 'src/components/search/PostCard';

interface BookmarkListProps {
  collectionId?: string;
}

export const BookmarkList: React.FC<BookmarkListProps> = ({ collectionId }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [collections, setCollections] = useState<BookmarkCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>(
    collectionId
  );

  useEffect(() => {
    loadBookmarks();
    if (!collectionId) {
      loadCollections();
    }
  }, [page, selectedCollection]);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const { bookmarks: newBookmarks, total } = await BookmarkService.getBookmarks(
        page,
        20,
        selectedCollection
      );
      setBookmarks((prev) => (page === 1 ? newBookmarks : [...prev, ...newBookmarks]));
      setHasMore(bookmarks.length < total);
    } catch (err) {
      setError('Failed to load bookmarks');
      console.error('Error loading bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      const { collections } = await BookmarkService.getCollections();
      setCollections(collections);
    } catch (err) {
      console.error('Error loading collections:', err);
    }
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    try {
      await BookmarkService.removeBookmark(bookmarkId);
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    } catch (err) {
      console.error('Error removing bookmark:', err);
    }
  };

  const handleCollectionChange = (collectionId: string | undefined) => {
    setSelectedCollection(collectionId);
    setPage(1);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {!collectionId && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Collections</h2>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            <button
              onClick={() => handleCollectionChange(undefined)}
              className={`px-4 py-2 rounded-full ${
                !selectedCollection
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Bookmarks
            </button>
            {collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => handleCollectionChange(collection.id)}
                className={`px-4 py-2 rounded-full ${
                  selectedCollection === collection.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {collection.name}
                <span className="ml-2 text-sm">
                  {collection._count?.bookmarks || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-center mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookmarks.map((bookmark) => (
          <div key={bookmark.id} className="relative">
            <PostCard post={bookmark.post} />
            <button
              onClick={() => handleRemoveBookmark(bookmark.id)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {loading && (
        <div className="text-center text-gray-500 mt-4">Loading...</div>
      )}

      {!loading && hasMore && (
        <button
          onClick={loadMore}
          className="w-full mt-4 py-2 text-blue-500 hover:text-blue-600"
        >
          Load More
        </button>
      )}

      {!loading && bookmarks.length === 0 && (
        <div className="text-center text-gray-500 mt-4">
          No bookmarks found
        </div>
      )}
    </div>
  );
}; 