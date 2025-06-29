import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Post } from 'src/types/content';
import { ContentService } from 'src/services/contentService';
import { Button } from 'src/components/common/button';
import { Spinner } from 'src/components/common/Spinner';

export const MyPostsPage: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await ContentService.getFeed({ creatorId: 'me' });
      setPosts(response.posts);
    } catch (err) {
      setError('Failed to load your posts. Please try again later.');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await ContentService.deletePost(postId);
      setPosts(posts.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">{error}</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Posts</h1>
        <Button
          variant="primary"
          onClick={() => navigate('/create')}
        >
          Create New Post
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>You haven't created any posts yet.</p>
          <Button
            variant="secondary"
            onClick={() => navigate('/create')}
            className="mt-4"
          >
            Create Your First Post
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => (
            <div
              key={post.id}
              className="border rounded-lg p-4 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mt-2">{post.caption}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/edit/${post.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(post.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {post.media.map((item, index) => (
                  <div key={index} className="aspect-square">
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={`Media ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover rounded-lg"
                        controls
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex space-x-4 text-sm text-gray-500">
                <span>❤️ {post.likesCount} likes</span>
                <span>💬 {post.commentsCount} comments</span>
                <span>💰 ${post.tipsAmount} tips</span>
                {post.isPremium && (
                  <span className="text-blue-600">Premium Content</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 