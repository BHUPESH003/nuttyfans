import React from 'react';
import { Link } from 'react-router-dom';
import { Post } from 'src/types/post';
import { Avatar } from 'src/components/common/Avatar';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Post Media */}
      {post.mediaUrls?.[0] && (
        <div className="aspect-video relative">
          {post.mediaType?.[0] === 'video' ? (
            <video
              src={post.mediaUrls[0]}
              className="w-full h-full object-cover"
              controls
            />
          ) : (
            <img
              src={post.mediaUrls[0]}
              alt={post.title || 'Post image'}
              className="w-full h-full object-cover"
            />
          )}
          {post.isPremium && (
            <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded">
              Premium
            </div>
          )}
        </div>
      )}

      {/* Post Content */}
      <div className="p-4">
        {/* Creator Info */}
        <Link
          to={`/profile/${post.creator.username}`}
          className="flex items-center space-x-2 mb-3"
        >
          <Avatar
            src={post.creator.avatarUrl}
            alt={post.creator.username}
            size="sm"
          />
          <span className="font-medium text-sm">
            {post.creator.username}
          </span>
        </Link>

        {/* Post Title & Content */}
        <Link to={`/posts/${post.id}`}>
          {post.title && (
            <h3 className="font-medium mb-1">{post.title}</h3>
          )}
          {post.content && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {post.content}
            </p>
          )}
        </Link>

        {/* Post Stats */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>{post._count?.likes || 0} likes</span>
            <span>{post._count?.comments || 0} comments</span>
          </div>
          <span>
            {formatDistanceToNow(new Date(post.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}; 