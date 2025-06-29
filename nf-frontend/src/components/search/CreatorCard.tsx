import React from 'react';
import { Link } from 'react-router-dom';
import { User } from 'src/types/user';
import { Avatar } from 'src/components/common/Avatar';

interface CreatorCardProps {
  creator: User;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({ creator }) => {
  return (
    <Link
      to={`/profile/${creator.username}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
    >
      <div className="flex items-center space-x-4">
        <Avatar
          src={creator.avatarUrl}
          alt={creator.username}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium truncate">
            {creator.username}
          </h3>
          {creator.fullName && (
            <p className="text-gray-500 truncate">{creator.fullName}</p>
          )}
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
            <span>{creator._count?.posts || 0} posts</span>
            <span>{creator._count?.subscribers || 0} subscribers</span>
          </div>
        </div>
      </div>
      {creator.bio && (
        <p className="mt-3 text-gray-600 text-sm line-clamp-2">
          {creator.bio}
        </p>
      )}
    </Link>
  );
}; 