import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import {
  uploadToSpaces,
  getKeyFromUrl,
  deleteFromSpaces,
} from "../services/digitalOceanService.js";

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
        coverUrl: true,
        createdAt: true,
        profile: {
          select: {
            monthlyPrice: true,
            isVerified: true,
            categories: true,
            socialLinks: true,
          },
        },
        _count: {
          select: {
            posts: true,
            subscribers: true,
          },
        },
      },
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    let isSubscribed = false;
    if (req.user) {
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
    }

    const recentPosts = await prisma.post.findMany({
      where: {
        userId: user.id,
        isArchived: false,
        isPremium: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
      select: {
        id: true,
        title: true,
        content: true,
        mediaUrls: true,
        mediaType: true,
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
        recentPosts,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, bio, username, email, currentPassword, newPassword } =
      req.body;

    const updateData = {};

    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;

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
    }

    if (newPassword && currentPassword) {
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

      updateData.password = hashedPassword;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    const { password, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error("Please upload an image");
      error.statusCode = 400;
      return next(error);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (user.avatarUrl) {
      const key = getKeyFromUrl(user.avatarUrl);
      if (key) {
        await deleteFromSpaces(key);
      }
    }

    const result = await uploadToSpaces(req.file.path, "avatars", {
      userId: req.user.id,
    });

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: result.url },
    });

    res.status(200).json({
      success: true,
      data: {
        avatarUrl: updatedUser.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadCover = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error("Please upload an image");
      error.statusCode = 400;
      return next(error);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (user.coverUrl) {
      const key = getKeyFromUrl(user.coverUrl);
      if (key) {
        await deleteFromSpaces(key);
      }
    }

    const result = await uploadToSpaces(req.file.path, "covers", {
      userId: req.user.id,
    });

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { coverUrl: result.url },
    });

    res.status(200).json({
      success: true,
      data: {
        coverUrl: updatedUser.coverUrl,
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
