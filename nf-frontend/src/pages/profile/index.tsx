import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { profileService } from 'src/services/profile-service';
import { UserProfile } from 'src/types';
import { userAtom } from 'src/store';
import { ProfileHeader } from 'src/components/profile/ProfileHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/common/tabs';
import { ProfileSettingsForm } from 'src/components/profile/ProfileSettings';


export default function ProfilePage() {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const [currentUser] = useAtom(userAtom);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const isOwnProfile = currentUser?.username === username;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                setError('');
                if (!username) {
                    throw new Error('Username is required');
                }
                const profileData = await profileService.getProfile(username);
                setProfile(profileData.data);
            } catch (err) {
                setError(err?.message || 'Failed to load profile');
                if (err?.response?.status === 404) {
                    navigate('/404');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [username, navigate]);

    const handleProfileUpdate = (updatedProfile: UserProfile) => {
        setProfile(updatedProfile);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900">Error</h2>
                    <p className="mt-2 text-gray-500">{error || 'Profile not found'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <ProfileHeader
                profile={profile}
                isOwnProfile={isOwnProfile}
                onProfileUpdate={handleProfileUpdate}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Tabs defaultValue="posts" className="w-full">
                    <TabsList>
                        <TabsTrigger value="posts">Posts</TabsTrigger>
                        <TabsTrigger value="media">Media</TabsTrigger>
                        {isOwnProfile && (
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="posts">
                        <div className="mt-6">
                            {/* Posts will be implemented in the Content Management module */}
                            <p className="text-center text-gray-500">No posts yet</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="media">
                        <div className="mt-6">
                            {/* Media grid will be implemented in the Content Management module */}
                            <p className="text-center text-gray-500">No media yet</p>
                        </div>
                    </TabsContent>

                    {isOwnProfile && (
                        <TabsContent value="settings">
                            <div className="mt-6">
                                <ProfileSettingsForm
                                    profile={profile}
                                    onSettingsUpdate={(settings) => {
                                        setProfile({
                                            ...profile,
                                            fullName: settings.displayName,
                                            bio: settings.bio,
                                            socialLinks: settings.socialLinks
                                        });
                                    }}
                                />
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </div>
    );
} 