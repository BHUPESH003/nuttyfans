import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BookmarkList } from 'src/components/bookmarks/BookmarkList';
import { CreateCollectionModal } from 'src/components/bookmarks/CreateCollectionModal';

export const BookmarksPage: React.FC = () => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    // Refresh the page to show the new collection
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!collectionId && (
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">My Bookmarks</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Create Collection
            </button>
          </div>
        </div>
      )}

      <BookmarkList collectionId={collectionId} />

      <CreateCollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}; 