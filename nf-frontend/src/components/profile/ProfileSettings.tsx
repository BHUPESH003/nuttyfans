import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../common/input';
import { Button } from '../common/button';
import { ProfileSettings, UserProfile } from 'src/types/profile';
import { profileService } from 'src/services/profile-service';

const profileSettingsSchema = z.object({
    displayName: z.string().min(2, 'Display name must be at least 2 characters'),
    bio: z.string().max(500, 'Bio must be less than 500 characters'),
    socialLinks: z.object({
        twitter: z.string().url('Invalid URL').optional().or(z.literal('')),
        instagram: z.string().url('Invalid URL').optional().or(z.literal('')),
        website: z.string().url('Invalid URL').optional().or(z.literal(''))
    }),
    isPrivate: z.boolean(),
    allowMessages: z.boolean(),
    showActivity: z.boolean()
});

type ProfileSettingsFormData = z.infer<typeof profileSettingsSchema>;

interface ProfileSettingsProps {
    profile: UserProfile;
    onSettingsUpdate: (settings: ProfileSettings) => void;
}

export function ProfileSettingsForm({ profile, onSettingsUpdate }: ProfileSettingsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<ProfileSettingsFormData>({
        resolver: zodResolver(profileSettingsSchema),
        defaultValues: {
            displayName: profile.fullName,
            bio: profile.bio,
            socialLinks: profile.socialLinks,
            isPrivate: false,
            allowMessages: true,
            showActivity: true
        }
    });

    const onSubmit = async (data: ProfileSettingsFormData) => {
        try {
            setIsLoading(true);
            setError('');
            const updatedSettings = await profileService.updateSettings(data);
            onSettingsUpdate(updatedSettings.data);
        } catch (err) {
            setError(err?.message || 'Failed to update settings');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-500 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <Input
                        label="Display Name"
                        {...register('displayName')}
                        error={errors.displayName?.message}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Bio
                    </label>
                    <textarea
                        {...register('bio')}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.bio?.message && (
                        <p className="mt-1 text-sm text-red-500">{errors.bio.message}</p>
                    )}
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Social Links</h3>
                    <Input
                        label="Twitter"
                        {...register('socialLinks.twitter')}
                        error={errors.socialLinks?.twitter?.message}
                    />
                    <Input
                        label="Instagram"
                        {...register('socialLinks.instagram')}
                        error={errors.socialLinks?.instagram?.message}
                    />
                    <Input
                        label="Website"
                        {...register('socialLinks.website')}
                        error={errors.socialLinks?.website?.message}
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Privacy Settings</h3>
                    <div className="space-y-2">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                {...register('isPrivate')}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">Private Profile</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                {...register('allowMessages')}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">Allow Messages</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                {...register('showActivity')}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">Show Activity</span>
                        </label>
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
} 