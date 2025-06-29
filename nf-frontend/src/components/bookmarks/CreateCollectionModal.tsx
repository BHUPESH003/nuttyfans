import React, { useState } from 'react';
import { BookmarkService } from 'src/services/bookmarkService';
import { BookmarkCollectionCreateInput } from 'src/types/bookmark';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      const input: BookmarkCollectionCreateInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        isPrivate,
      };

      await BookmarkService.createCollection(input);
      onSuccess?.();
      onClose();
      setName('');
      setDescription('');
      setIsPrivate(false);
    } catch (err) {
      setError('Failed to create collection. Please try again.');
      console.error('Error creating collection:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Create New Collection</h2>

        {error && (
          <div className="mb-4 text-red-500 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Collection Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter collection name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter collection description"
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isPrivate"
              className="ml-2 block text-sm text-gray-700"
            >
              Make this collection private
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`bg-blue-500 text-white px-4 py-2 rounded-lg ${
                isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-blue-600'
              }`}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 