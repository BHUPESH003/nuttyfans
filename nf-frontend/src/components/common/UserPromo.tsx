import React from 'react';
import { Avatar } from 'src/components/common/Avatar';

interface UserPromoProps {
  userId: string;
  username: string;
  avatarUrl: string;
  coverUrl?: string;
  bio?: string;
  stats?: {
    posts: number;
    subscribers: number;
  };
  isVerified?: boolean;
  subscriptionPrice?: number;
  onSubscribe?: () => void;
}

export const UserPromo: React.FC<UserPromoProps> = ({
  username,
  avatarUrl,
  coverUrl,
  bio,
  stats,
  isVerified,
  subscriptionPrice,
  onSubscribe,
}) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Cover Image */}
      {coverUrl && (
        <div 
          className="h-32 bg-cover bg-center"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      )}
      
      {/* Profile Info */}
      <div className="p-4">
        <div className="flex items-start">
          <Avatar 
            src={avatarUrl} 
            alt={username} 
            size="lg"
            className={coverUrl ? '-mt-8 border-4 border-white' : ''}
          />
          <div className="ml-4 flex-1">
            <div className="flex items-center">
              <h3 className="font-semibold text-lg">{username}</h3>
              {isVerified && (
                <svg className="w-5 h-5 text-blue-500 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            {bio && <p className="text-gray-600 text-sm mt-1">{bio}</p>}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex justify-around mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="font-semibold">{stats.posts}</div>
              <div className="text-sm text-gray-500">Posts</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{stats.subscribers}</div>
              <div className="text-sm text-gray-500">Subscribers</div>
            </div>
          </div>
        )}

        {/* Subscription Button */}
        {subscriptionPrice !== undefined && onSubscribe && (
          <button
            onClick={onSubscribe}
            className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Subscribe ${subscriptionPrice}/month
          </button>
        )}
      </div>
    </div>
  );
}; 