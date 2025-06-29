import React, { useRef } from 'react';
import { MediaType } from 'src/types/content';

export interface MediaItem {
  file: File;
  type: MediaType;
  previewUrl: string;
}

interface MediaUploadProps {
  media: MediaItem[];
  onMediaAdd: (newMedia: MediaItem[]) => void;
  onMediaRemove: (index: number) => void;
  maxItems?: number;
  className?: string;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  media,
  onMediaAdd,
  onMediaRemove,
  maxItems = 10,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const remainingSlots = maxItems - media.length;
    if (remainingSlots <= 0) return;

    const newMedia: MediaItem[] = [];
    Array.from(files).slice(0, remainingSlots).forEach(file => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      if (!isVideo && !isImage) return;

      newMedia.push({
        file,
        type: isVideo ? 'video' : 'image',
        previewUrl: URL.createObjectURL(file)
      });
    });

    onMediaAdd(newMedia);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {media.map((item, index) => (
          <div key={index} className="relative aspect-square">
            {item.type === 'image' ? (
              <img
                src={item.previewUrl}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <video
                src={item.previewUrl}
                className="w-full h-full object-cover rounded-lg"
                controls
              />
            )}
            <button
              type="button"
              onClick={() => onMediaRemove(index)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ))}
        {media.length < maxItems && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
          >
            <span className="text-4xl text-gray-400">+</span>
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleMediaSelect}
        className="hidden"
      />
    </div>
  );
}; 