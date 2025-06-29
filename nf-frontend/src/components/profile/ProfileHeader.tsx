import { useState } from "react";
import { Camera, Edit2, CheckCircle } from "lucide-react";
import { Button } from "../common/button";
import { UserProfile } from "src/types/profile";
import { profileService } from "src/services/profile-service";

interface ProfileHeaderProps {
    profile: UserProfile;
    isOwnProfile: boolean;
    onProfileUpdate: (profile: UserProfile) => void;
}

export function ProfileHeader({
    profile,
    isOwnProfile,
    onProfileUpdate,
}: ProfileHeaderProps) {
    const [isEditingImages, setIsEditingImages] = useState(false);

    const handleAvatarChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const result = await profileService.updateProfileImage(file);
            onProfileUpdate({ ...profile, avatarUrl: result.data.avatarUrl });
        } catch (error) {
            console.error("Failed to update avatar:", error);
        }
    };

    const handleCoverChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const result = await profileService.updateCoverImage(file);
            onProfileUpdate({ ...profile, coverUrl: result.data.coverUrl });
        } catch (error) {
            console.error("Failed to update cover:", error);
        }
    };

    return (
        <div className="relative">
            {/* Cover Photo */}
            <div className="relative h-48 md:h-64 bg-gray-200">
                <img
                    src={profile.coverUrl || "/default-cover.jpg"}
                    alt="Cover"
                    className="w-full h-full object-cover"
                />
                {isOwnProfile && isEditingImages && (
                    <label className="absolute bottom-4 right-4 cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCoverChange}
                        />
                        <Camera className="h-6 w-6 text-white hover:text-blue-500" />
                    </label>
                )}
            </div>

            {/* Profile Picture and Basic Info */}
            <div className="relative px-4 py-5 sm:px-6 -mt-16">
                <div className="flex flex-col sm:flex-row items-center">
                    {/* Profile Picture */}
                    <div className="relative">
                        <img
                            src={profile.avatarUrl || "/default-avatar.jpg"}
                            alt={profile.fullName}
                            className="h-32 w-32 rounded-full border-4 border-white object-cover"
                        />
                        {isOwnProfile && isEditingImages && (
                            <label className="absolute bottom-2 right-2 cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                                <Camera className="h-5 w-5 text-gray-600 hover:text-blue-500" />
                            </label>
                        )}
                    </div>

                    {/* User Info */}
                    <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {profile.fullName}
                            </h1>
                            {profile.isVerified && (
                                <CheckCircle className="ml-2 h-5 w-5 text-blue-500" />
                            )}
                        </div>
                        <p className="text-sm text-gray-500">
                            @{profile.username}
                        </p>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            {profile.bio}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 sm:mt-0 sm:ml-auto">
                        {isOwnProfile ? (
                            <div className="flex space-x-3">
                                <Button
                                    variant="secondary"
                                    onClick={() =>
                                        setIsEditingImages(!isEditingImages)
                                    }
                                >
                                    {isEditingImages ? (
                                        <>
                                            <CheckCircle className="h-5 w-5 mr-2" />
                                            Done
                                        </>
                                    ) : (
                                        <>
                                            <Edit2 className="h-5 w-5 mr-2" />
                                            Edit Profile
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <Button variant="primary">
                                Subscribe ${profile.subscriptionPrice}/month
                            </Button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                {/* <div className="mt-6 grid grid-cols-3 gap-4 border-t border-gray-200 pt-4">
                    <div className="text-center">
                        <span className="text-xl font-bold text-gray-900">
                            {profile?.stats.posts}
                        </span>
                        <span className="block text-sm text-gray-500">
                            Posts
                        </span>
                    </div>
                    <div className="text-center">
                        <span className="text-xl font-bold text-gray-900">
                            {profile.stats.followers}
                        </span>
                        <span className="block text-sm text-gray-500">
                            Followers
                        </span>
                    </div>
                    <div className="text-center">
                        <span className="text-xl font-bold text-gray-900">
                            {profile.stats.following}
                        </span>
                        <span className="block text-sm text-gray-500">
                            Following
                        </span>
                    </div>
                </div> */}
            </div>
        </div>
    );
}
