import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'src/types/user';
import { Button } from 'src/components/common/button';
import { Input } from 'src/components/common/input';
import { MediaUpload, MediaItem } from 'src/components/common/MediaUpload';
import { AuthService } from 'src/services/authService';
import { ProfileService } from 'src/services/profileService';
import { Spinner } from 'src/components/common/Spinner';

interface ProfileFormData {
  fullName: string;
  bio: string;
  location: string;
  website: string;
  subscriptionPrice: number;
  paypalEmail: string;
  twitter: string;
  instagram: string;
  tiktok: string;
}

export const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarMedia, setAvatarMedia] = useState<MediaItem[]>([]);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    bio: '',
    location: '',
    website: '',
    subscriptionPrice: 0,
    paypalEmail: '',
    twitter: '',
    instagram: '',
    tiktok: '',
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await AuthService.getCurrentUser();
      setUser(userData);
      
      // Initialize form data
      setFormData({
        fullName: userData.fullName,
        bio: userData.profile?.bio || '',
        location: userData.profile?.location || '',
        website: userData.profile?.website || '',
        subscriptionPrice: userData.profile?.subscriptionPrice || 0,
        paypalEmail: userData.profile?.paymentDetails?.paypalEmail || '',
        twitter: userData.profile?.socialLinks?.twitter || '',
        instagram: userData.profile?.socialLinks?.instagram || '',
        tiktok: userData.profile?.socialLinks?.tiktok || '',
      });

      if (userData.avatarUrl) {
        setAvatarMedia([{
          file: new File([], 'avatar'),
          type: 'image',
          previewUrl: userData.avatarUrl,
        }]);
      }
    } catch (err) {
      setError('Failed to load profile. Please try again later.');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      // Upload new avatar if changed
      let avatarUrl = user?.avatarUrl;
      if (avatarMedia.length > 0 && avatarMedia[0].file.size > 0) {
        const formData = new FormData();
        formData.append('file', avatarMedia[0].file);
        formData.append('folder', 'avatars');
        const mediaResponse = await ProfileService.uploadMedia(formData);
        avatarUrl = mediaResponse.url;
      }

      // Update profile
      await ProfileService.updateProfile({
        fullName: formData.fullName,
        avatarUrl,
        profile: {
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
          subscriptionPrice: Number(formData.subscriptionPrice),
          paymentDetails: {
            paypalEmail: formData.paypalEmail,
          },
          socialLinks: {
            twitter: formData.twitter,
            instagram: formData.instagram,
            tiktok: formData.tiktok,
          },
        },
      });

      navigate('/profile');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Picture
          </label>
          <MediaUpload
            media={avatarMedia}
            onMediaAdd={(media) => setAvatarMedia(media)}
            onMediaRemove={() => setAvatarMedia([])}
            maxItems={1}
            className="mb-4"
          />
        </div>

        {/* Basic Information */}
        <Input
          label="Full Name"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          required
        />

        <Input
          label="Bio"
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          as="textarea"
          rows={4}
          placeholder="Tell your fans about yourself..."
        />

        <Input
          label="Location"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          placeholder="City, Country"
        />

        <Input
          label="Website"
          name="website"
          value={formData.website}
          onChange={handleInputChange}
          placeholder="https://your-website.com"
        />

        {/* Creator Settings */}
        <div className="pt-6 border-t">
          <h2 className="text-lg font-medium mb-4">Creator Settings</h2>

          <Input
            label="Subscription Price ($)"
            name="subscriptionPrice"
            type="number"
            min="0"
            step="0.01"
            value={formData.subscriptionPrice}
            onChange={handleInputChange}
          />

          <Input
            label="PayPal Email"
            name="paypalEmail"
            type="email"
            value={formData.paypalEmail}
            onChange={handleInputChange}
            placeholder="your-paypal@email.com"
          />
        </div>

        {/* Social Links */}
        <div className="pt-6 border-t">
          <h2 className="text-lg font-medium mb-4">Social Links</h2>

          <Input
            label="Twitter"
            name="twitter"
            value={formData.twitter}
            onChange={handleInputChange}
            placeholder="https://twitter.com/username"
          />

          <Input
            label="Instagram"
            name="instagram"
            value={formData.instagram}
            onChange={handleInputChange}
            placeholder="https://instagram.com/username"
          />

          <Input
            label="TikTok"
            name="tiktok"
            value={formData.tiktok}
            onChange={handleInputChange}
            placeholder="https://tiktok.com/@username"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/profile')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}; 