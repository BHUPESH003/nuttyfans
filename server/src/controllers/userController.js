import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import {
  uploadToS3,
  getKeyFromUrl,
  deleteFromS3,
  getMediaTypeFromFilename,
} from "../services/awsS3Service.js";
import fs from "fs";

// Helper function to cleanup temp files
const cleanupTempFile = (filePath) => {
  if (filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`Failed to cleanup temp file ${filePath}:`, error.message);
    }
  }
};

// Helper function to clean user data for response
const cleanUserData = (user) => {
  const {
    password,
    emailVerificationToken,
    passwordResetToken,
    otpToken,
    twoFactorSecret,
    backupCodes,
    ...cleanUser
  } = user;
  return cleanUser;
};

// Get user profile by username
export const getUserProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        fullName: true,
        bio: true,
        avatarUrl: true,
        coverImageUrl: true,
        isOnline: true,
        lastActiveAt: true,
        createdAt: true,
        location: true,
        website: true,
        isPrivateProfile: true,
        profile: {
          select: {
            monthlyPrice: true,
            isVerified: true,
            verificationLevel: true,
            displayName: true,
            profileImageUrl: true,
            bannerImageUrl: true,
            tagline: true,
            about: true,
            categories: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            socialLinks: true,
            isAcceptingTips: true,
            tipMinAmount: true,
            contentRating: true,
            subscriberCount: true,
            postCount: true,
          },
        },
        _count: {
          select: {
            posts: {
              where: {
                isArchived: false,
              },
            },
            subscribers: {
              where: {
                status: "ACTIVE",
                currentPeriodEnd: {
                  gte: new Date(),
                },
              },
            },
            following: true,
            followers: true,
          },
        },
      },
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    // Check if profile is private and user is not authenticated or not following
    if (user.isPrivateProfile && (!req.user || req.user.id !== user.id)) {
      let isFollowing = false;

      if (req.user) {
        const follow = await prisma.follow.findFirst({
          where: {
            followerId: req.user.id,
            followingId: user.id,
          },
        });
        isFollowing = !!follow;
      }

      if (!isFollowing) {
        return res.status(200).json({
          success: true,
          data: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            isPrivateProfile: true,
            _count: {
              followers: user._count.followers,
            },
          },
        });
      }
    }

    let isSubscribed = false;
    let isFollowing = false;

    if (req.user && req.user.id !== user.id) {
      // Check subscription status
      const subscription = await prisma.subscription.findFirst({
        where: {
          subscriberId: req.user.id,
          creatorId: user.id,
          status: "ACTIVE",
          currentPeriodEnd: {
            gte: new Date(),
          },
        },
      });
      isSubscribed = !!subscription;

      // Check following status
      const follow = await prisma.follow.findFirst({
        where: {
          followerId: req.user.id,
          followingId: user.id,
        },
      });
      isFollowing = !!follow;
    }

    // Get recent public posts
    const recentPosts = await prisma.post.findMany({
      where: {
        userId: user.id,
        isArchived: false,
        OR: [
          { isPremium: false },
          ...(isSubscribed ? [{ isPremium: true }] : []),
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
      select: {
        id: true,
        title: true,
        content: true,
        mediaUrls: true,
        mediaType: true,
        isPremium: true,
        price: true,
        createdAt: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        ...user,
        isSubscribed,
        isFollowing,
        recentPosts,
        canViewFullProfile:
          !user.isPrivateProfile ||
          isFollowing ||
          (req.user && req.user.id === user.id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req, res, next) => {
  try {
    const {
      fullName,
      bio,
      username,
      email,
      currentPassword,
      newPassword,
      location,
      website,
      dateOfBirth,
      gender,
      isPrivateProfile,
      emailNotifications,
      pushNotifications,
    } = req.body;

    const updateData = {};

    // Basic profile fields
    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (dateOfBirth !== undefined)
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) updateData.gender = gender;
    if (isPrivateProfile !== undefined)
      updateData.isPrivateProfile = isPrivateProfile;
    if (emailNotifications !== undefined)
      updateData.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined)
      updateData.pushNotifications = pushNotifications;

    // Check username availability
    if (username !== undefined && username !== req.user.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username },
      });

      if (usernameExists) {
        const error = new Error("Username already taken");
        error.statusCode = 400;
        return next(error);
      }

      updateData.username = username;
    }

    // Check email availability
    if (email !== undefined && email !== req.user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        const error = new Error("Email already in use");
        error.statusCode = 400;
        return next(error);
      }

      updateData.email = email;
      updateData.isEmailVerified = false; // Require re-verification for new email
    }

    // Handle password change
    if (newPassword && currentPassword) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user.password) {
        const error = new Error(
          "Account uses OAuth login. Cannot set password."
        );
        error.statusCode = 400;
        return next(error);
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        const error = new Error("Current password is incorrect");
        error.statusCode = 400;
        return next(error);
      }

      if (newPassword.length < 8) {
        const error = new Error(
          "New password must be at least 8 characters long"
        );
        error.statusCode = 400;
        return next(error);
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      updateData.password = hashedPassword;

      // Create security notification
      await prisma.notification.create({
        data: {
          userId: req.user.id,
          type: "PASSWORD_CHANGED",
          title: "Password Changed",
          content: "Your password has been successfully changed.",
        },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      include: {
        profile: {
          include: {
            categories: true,
          },
        },
        _count: {
          select: {
            posts: true,
            subscribers: true,
            subscriptions: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: cleanUserData(updatedUser),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Upload avatar
export const uploadAvatar = async (req, res, next) => {
  const uploadedFile = req.file;

  try {
    if (!req.file) {
      const error = new Error("Please upload an image");
      error.statusCode = 400;
      return next(error);
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(req.file.mimetype)) {
      cleanupTempFile(uploadedFile?.path);
      const error = new Error(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed"
      );
      error.statusCode = 400;
      return next(error);
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      cleanupTempFile(uploadedFile?.path);
      const error = new Error("File too large. Maximum size is 5MB");
      error.statusCode = 400;
      return next(error);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    let uploadResult;
    try {
      // Upload new avatar
      uploadResult = await uploadToS3(req.file.path, "avatars", {
        userId: req.user.id,
        quality: "high",
      });
    } catch (uploadError) {
      cleanupTempFile(uploadedFile?.path);
      throw new Error(`Avatar upload failed: ${uploadError.message}`);
    }

    // Delete old avatar if exists
    if (
      user.avatarUrl &&
      !user.avatarUrl.includes("google") &&
      !user.avatarUrl.includes("facebook")
    ) {
      const oldKey = getKeyFromUrl(user.avatarUrl);
      if (oldKey) {
        try {
          await deleteFromS3(oldKey);
        } catch (deleteError) {
          console.warn(
            `Failed to delete old avatar ${oldKey}:`,
            deleteError.message
          );
        }
      }
    }

    // Update user avatar URL
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        avatarUrl: uploadResult.url,
      },
    });

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        avatarUrl: updatedUser.avatarUrl,
      },
    });
  } catch (error) {
    cleanupTempFile(uploadedFile?.path);
    next(error);
  }
};

// Upload cover image
export const uploadCoverImage = async (req, res, next) => {
  const uploadedFile = req.file;

  try {
    if (!req.file) {
      const error = new Error("Please upload an image");
      error.statusCode = 400;
      return next(error);
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(req.file.mimetype)) {
      cleanupTempFile(uploadedFile?.path);
      const error = new Error(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed"
      );
      error.statusCode = 400;
      return next(error);
    }

    // Validate file size (10MB max for cover)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      cleanupTempFile(uploadedFile?.path);
      const error = new Error("File too large. Maximum size is 10MB");
      error.statusCode = 400;
      return next(error);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    let uploadResult;
    try {
      // Upload new cover image
      uploadResult = await uploadToS3(req.file.path, "covers", {
        userId: req.user.id,
        quality: "high",
      });
    } catch (uploadError) {
      cleanupTempFile(uploadedFile?.path);
      throw new Error(`Cover image upload failed: ${uploadError.message}`);
    }

    // Delete old cover image if exists
    if (user.coverImageUrl) {
      const oldKey = getKeyFromUrl(user.coverImageUrl);
      if (oldKey) {
        try {
          await deleteFromS3(oldKey);
        } catch (deleteError) {
          console.warn(
            `Failed to delete old cover image ${oldKey}:`,
            deleteError.message
          );
        }
      }
    }

    // Update user cover image URL
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        coverImageUrl: uploadResult.url,
      },
    });

    res.status(200).json({
      success: true,
      message: "Cover image uploaded successfully",
      data: {
        coverImageUrl: updatedUser.coverImageUrl,
      },
    });
  } catch (error) {
    cleanupTempFile(uploadedFile?.path);
    next(error);
  }
};

// Delete avatar
export const deleteAvatar = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user.avatarUrl) {
      const error = new Error("No avatar to delete");
      error.statusCode = 400;
      return next(error);
    }

    // Don't delete OAuth avatars
    if (
      user.avatarUrl.includes("google") ||
      user.avatarUrl.includes("facebook")
    ) {
      const error = new Error("Cannot delete OAuth avatar");
      error.statusCode = 400;
      return next(error);
    }

    // Delete from storage
    const key = getKeyFromUrl(user.avatarUrl);
    if (key) {
      try {
        await deleteFromS3(key);
      } catch (deleteError) {
        console.warn(`Failed to delete avatar ${key}:`, deleteError.message);
      }
    }

    // Update user
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        avatarUrl: null,
      },
    });

    res.status(200).json({
      success: true,
      message: "Avatar deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Delete cover image
export const deleteCoverImage = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user.coverImageUrl) {
      const error = new Error("No cover image to delete");
      error.statusCode = 400;
      return next(error);
    }

    // Delete from storage
    const key = getKeyFromUrl(user.coverImageUrl);
    if (key) {
      try {
        await deleteFromS3(key);
      } catch (deleteError) {
        console.warn(
          `Failed to delete cover image ${key}:`,
          deleteError.message
        );
      }
    }

    // Update user
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        coverImageUrl: null,
      },
    });

    res.status(200).json({
      success: true,
      message: "Cover image deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Follow user
export const followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      const error = new Error("You cannot follow yourself");
      error.statusCode = 400;
      return next(error);
    }

    // Check if user exists
    const userToFollow = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToFollow) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    // Check if already following
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId: req.user.id,
        followingId: userId,
      },
    });

    if (existingFollow) {
      return res.status(200).json({
        success: true,
        message: "Already following this user",
      });
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: req.user.id,
        followingId: userId,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: userId,
        type: "NEW_FOLLOWER",
        title: "New Follower",
        content: `${req.user.username} started following you`,
        relatedId: req.user.id,
        relatedType: "User",
      },
    });

    res.status(200).json({
      success: true,
      message: "User followed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Unfollow user
export const unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    await prisma.follow.deleteMany({
      where: {
        followerId: req.user.id,
        followingId: userId,
      },
    });

    res.status(200).json({
      success: true,
      message: "User unfollowed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get user followers
export const getUserFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      skip,
      take: parseInt(limit),
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            isOnline: true,
            profile: {
              select: {
                isVerified: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalCount = await prisma.follow.count({
      where: { followingId: userId },
    });

    res.status(200).json({
      success: true,
      data: {
        followers: followers.map((f) => f.follower),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user following
export const getUserFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      skip,
      take: parseInt(limit),
      include: {
        following: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            isOnline: true,
            profile: {
              select: {
                isVerified: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalCount = await prisma.follow.count({
      where: { followerId: userId },
    });

    res.status(200).json({
      success: true,
      data: {
        following: following.map((f) => f.following),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const totalCount = await prisma.notification.count({
      where: { userId: req.user.id },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user.id,
        isRead: false,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: {
        id,
        userId: req.user.id,
      },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      const error = new Error("Current password and new password are required");
      error.statusCode = 400;
      return next(error);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      const error = new Error("Current password is incorrect");
      error.statusCode = 400;
      return next(error);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      const error = new Error("Password is required to delete account");
      error.statusCode = 400;
      return next(error);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error("Password is incorrect");
      error.statusCode = 400;
      return next(error);
    }

    await prisma.user.delete({
      where: { id: req.user.id },
    });

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUserProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        bio: true,
        avatarUrl: true,
        coverUrl: true,
        role: true,
        isActive: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            monthlyPrice: true,
            isVerified: true,
            socialLinks: true,
            categories: true,
            squareAccountId: true,
          },
        },
        _count: {
          select: {
            posts: true,
            subscribers: true,
            subscriptions: true,
            likes: true,
          },
        },
      },
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type = "all" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
    };

    if (type === "premium") {
      where.isPremium = true;
    } else if (type === "free") {
      where.isPremium = false;
    } else if (type === "archived") {
      where.isArchived = true;
    } else {
      where.isArchived = false;
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
      include: {
        categories: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            purchases: true,
          },
        },
      },
    });

    const totalCount = await prisma.post.count({ where });

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMySubscribers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const subscribers = await prisma.subscription.findMany({
      where: {
        creatorId: req.user.id,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
      include: {
        subscriber: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const totalCount = await prisma.subscription.count({
      where: {
        creatorId: req.user.id,
        status: "ACTIVE",
      },
    });

    res.status(200).json({
      success: true,
      data: {
        subscribers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMySubscriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const subscriptions = await prisma.subscription.findMany({
      where: {
        subscriberId: req.user.id,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            profile: {
              select: {
                isVerified: true,
                monthlyPrice: true,
              },
            },
          },
        },
      },
    });

    const totalCount = await prisma.subscription.count({
      where: {
        subscriberId: req.user.id,
        status: "ACTIVE",
      },
    });

    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfileStats = async (req, res, next) => {
  try {
    const stats = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        _count: {
          select: {
            posts: true,
            subscribers: true,
            subscriptions: true,
            likes: true,
          },
        },
      },
    });

    const earnings = await prisma.walletTransaction.aggregate({
      where: {
        userId: req.user.id,
        type: {
          in: ["SUBSCRIPTION_EARNING", "CONTENT_PURCHASE_EARNING"],
        },
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyEarnings = await prisma.walletTransaction.aggregate({
      where: {
        userId: req.user.id,
        type: {
          in: ["SUBSCRIPTION_EARNING", "CONTENT_PURCHASE_EARNING"],
        },
        status: "COMPLETED",
        createdAt: {
          gte: thisMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const recentActivity = await prisma.notification.count({
      where: {
        userId: req.user.id,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        ...stats._count,
        totalEarnings: earnings._sum.amount || 0,
        monthlyEarnings: monthlyEarnings._sum.amount || 0,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};
