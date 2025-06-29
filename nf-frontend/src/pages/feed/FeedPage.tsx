import React, { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { Post, Pagination } from 'src/types/content';
import { ContentService } from 'src/services/contentService';
import { PostCard } from 'src/components/feed/PostCard';
import { Spinner } from 'src/components/common/Spinner';

export const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });
  
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await ContentService.getFeed({
        page: pagination.page,
        limit: pagination.limit
      });
      
      const { posts: newPosts, pagination: newPagination } = response;
      
      if (pagination.page >= newPagination.totalPages) {
        setHasMore(false);
      }
      
      setPosts((prevPosts) => [...prevPosts, ...(newPosts || [])]);
      setPagination((prev) => ({
        ...newPagination,
        page: prev.page + 1
      }));
    } catch (err) {
      setError('Failed to load posts. Please try again later.');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      fetchPosts();
    }
  }, [inView, hasMore]);

  const handleInteraction = () => {
    // Optionally refresh the feed or update specific post
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-red-500">{error}</div>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onInteraction={handleInteraction}
            />
          ))}
        </div>

        {/* Infinite scroll trigger */}
        <div ref={ref} className="h-10 flex items-center justify-center">
          {loading && <Spinner />}
        </div>

        {!hasMore && posts.length > 0 && (
          <div className="text-center text-gray-500 mt-4">
            No more posts to load
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center text-gray-500 mt-4">
            No posts found. Follow some creators to see their content here!
          </div>
        )}
      </>
    );
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 relative min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Your Feed</h1>
      {renderContent()}

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/create')}
        className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  );
}; 