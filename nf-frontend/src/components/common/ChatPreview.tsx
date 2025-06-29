import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from 'src/components/common/Avatar';

interface ChatPreviewProps {
  userId: string;
  username: string;
  avatarUrl: string;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
  onClick?: () => void;
  isOnline?: boolean;
}

export const ChatPreview: React.FC<ChatPreviewProps> = ({
  username,
  avatarUrl,
  lastMessage,
  unreadCount,
  onClick,
  isOnline,
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${
        unreadCount > 0 ? 'bg-blue-50' : ''
      }`}
    >
      <div className="relative">
        <Avatar src={avatarUrl} alt={username} size="md" />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>
      
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="font-medium truncate">{username}</span>
          {lastMessage && (
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
            </span>
          )}
        </div>
        
        {lastMessage && (
          <p className="text-sm text-gray-500 truncate">
            {lastMessage.content}
          </p>
        )}
      </div>

      {unreadCount > 0 && (
        <div className="ml-3 bg-blue-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </div>
  );
}; 