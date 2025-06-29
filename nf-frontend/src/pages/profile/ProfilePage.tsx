import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'src/types/user';
import { Button } from 'src/components/common/button';
import { Spinner } from 'src/components/common/Spinner';
import { AuthService } from 'src/services/authService';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await AuthService.getCurrentUser();
      setUser(response);
    } catch (err) {
      setError('Failed to load profile. Please try again later.');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
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

  if (!user) {
    return null;
  }

  const menuItems = [
    {
      title: 'My Posts',
      description: 'Manage your content and posts',
      icon: '📝',
      path: '/my-posts',
    },
    {
      title: 'Edit Profile',
      description: 'Update your profile information',
      icon: '👤',
      path: '/settings/profile',
    },
    {
      title: 'Subscription Settings',
      description: 'Manage your subscription plans and pricing',
      icon: '💰',
      path: '/settings/subscriptions',
    },
    {
      title: 'My Subscribers',
      description: 'View and manage your subscribers',
      icon: '👥',
      path: '/settings/subscribers',
    },
    {
      title: 'Payment Settings',
      description: 'Update your payment and payout preferences',
      icon: '💳',
      path: '/settings/payments',
    },
    {
      title: 'Account Settings',
      description: 'Manage your account preferences and security',
      icon: '⚙️',
      path: '/settings/account',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Profile Header */}
      <div className="flex items-center space-x-6 mb-8">
        <div className="relative">
          <img
            src={user.avatarUrl || 'https://via.placeholder.com/150'}
            alt={user.fullName}
            className="w-32 h-32 rounded-full object-cover"
          />
          <button
            onClick={() => navigate('/settings/profile')}
            className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
          >
            ✏️
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.fullName}</h1>
          <p className="text-gray-600">@{user.username}</p>
          <div className="flex space-x-4 mt-2">
            <div>
              <span className="font-bold">{user._count?.posts || 0}</span>
              <span className="text-gray-600 ml-1">posts</span>
            </div>
            <div>
              <span className="font-bold">{user._count?.subscribers || 0}</span>
              <span className="text-gray-600 ml-1">subscribers</span>
            </div>
            <div>
              <span className="font-bold">{user._count?.subscriptions || 0}</span>
              <span className="text-gray-600 ml-1">subscriptions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <span className="text-2xl">{item.icon}</span>
            <div>
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <div className="mt-8 flex justify-center">
        <Button
          variant="danger"
          onClick={() => {
            AuthService.logout();
            navigate('/login');
          }}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}; 