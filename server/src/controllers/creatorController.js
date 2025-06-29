import prisma from "../config/prisma.js";

export const becomeCreator = async (req, res, next) => {
  try {
    const { monthlyPrice, categories, socialLinks } = req.body;

    const existingProfile = await prisma.creatorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (existingProfile) {
      const error = new Error("You already have a creator profile");
      error.statusCode = 400;
      return next(error);
    }

    const creatorProfile = await prisma.creatorProfile.create({
      data: {
        userId: req.user.id,
        monthlyPrice,
        socialLinks: socialLinks || {},
        categories: {
          connect: categories?.map((id) => ({ id })) || [],
        },
      },
      include: {
        categories: true,
      },
    });

    await prisma.user.update({
      where: { id: req.user.id },
      data: { role: "CREATOR" },
    });

    res.status(201).json({
      success: true,
      data: creatorProfile,
      message:
        "Creator profile created successfully. You can now start publishing content!",
    });
  } catch (error) {
    next(error);
  }
};

export const updateCreatorProfile = async (req, res, next) => {
  try {
    const { monthlyPrice, categories, socialLinks } = req.body;

    const profile = await prisma.creatorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      const error = new Error("Creator profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const updateData = {};

    if (monthlyPrice !== undefined) updateData.monthlyPrice = monthlyPrice;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;

    const updatedProfile = await prisma.creatorProfile.update({
      where: { userId: req.user.id },
      data: {
        ...updateData,
        ...(categories && {
          categories: {
            set: [],
            connect: categories.map((id) => ({ id })),
          },
        }),
      },
      include: {
        categories: true,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const getCreators = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      sort = "popular",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      user: {
        isActive: true,
      },
      isVerified: true,
    };

    if (search) {
      where.user = {
        ...where.user,
        OR: [
          { username: { contains: search, mode: "insensitive" } },
          { fullName: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (category) {
      where.categories = {
        some: { id: category },
      };
    }

    let orderBy = {};
    switch (sort) {
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "price_low":
        orderBy = { monthlyPrice: "asc" };
        break;
      case "price_high":
        orderBy = { monthlyPrice: "desc" };
        break;
      case "popular":
      default:
        orderBy = { createdAt: "desc" }; // Note: For proper popularity, we'd need a subscribers count field
        break;
    }

    const creators = await prisma.creatorProfile.findMany({
      where,
      orderBy,
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            bio: true,
            _count: {
              select: {
                posts: true,
                subscribers: true,
              },
            },
          },
        },
        categories: true,
      },
    });

    const totalCount = await prisma.creatorProfile.count({ where });

    res.status(200).json({
      success: true,
      data: {
        creators,
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

export const getCreatorStats = async (req, res, next) => {
  try {
    const profile = await prisma.creatorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      const error = new Error("Creator profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const now = new Date();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalSubscribers = await prisma.subscription.count({
      where: {
        creatorId: req.user.id,
        status: "ACTIVE",
        currentPeriodEnd: {
          gte: now,
        },
      },
    });

    const newSubscribers = await prisma.subscription.count({
      where: {
        creatorId: req.user.id,
        createdAt: {
          gte: thirtyDaysAgo,
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

    const recentEarnings = await prisma.walletTransaction.aggregate({
      where: {
        userId: req.user.id,
        type: {
          in: ["SUBSCRIPTION_EARNING", "CONTENT_PURCHASE_EARNING"],
        },
        status: "COMPLETED",
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const postEngagement = await prisma.post.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    const totalLikes = postEngagement.reduce(
      (acc, post) => acc + post._count.likes,
      0
    );
    const totalComments = postEngagement.reduce(
      (acc, post) => acc + post._count.comments,
      0
    );

    const topPosts = await prisma.post.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: [
        { likes: { _count: "desc" } },
        { comments: { _count: "desc" } },
      ],
      take: 5,
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
            purchases: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        subscribers: {
          total: totalSubscribers,
          new: newSubscribers,
        },
        earnings: {
          total: earnings._sum.amount || 0,
          recent: recentEarnings._sum.amount || 0,
        },
        engagement: {
          likes: totalLikes,
          comments: totalComments,
        },
        topPosts,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCreatorProfile = async (req, res, next) => {
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
          include: {
            categories: true,
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

    if (!user || !user.profile) {
      const error = new Error("Creator not found");
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
      take: 6,
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

export const getCreatorsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const creators = await prisma.creatorProfile.findMany({
      where: {
        categories: {
          some: {
            id: categoryId,
          },
        },
        isVerified: true,
        user: {
          isActive: true,
        },
      },
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            bio: true,
            _count: {
              select: {
                subscribers: true,
                posts: true,
              },
            },
          },
        },
        categories: true,
      },
    });

    const totalCount = await prisma.creatorProfile.count({
      where: {
        categories: {
          some: {
            id: categoryId,
          },
        },
        isVerified: true,
        user: {
          isActive: true,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        creators,
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

export const getPopularCreators = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const creators = await prisma.creatorProfile.findMany({
      where: {
        isVerified: true,
        user: {
          isActive: true,
        },
      },
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            bio: true,
            _count: {
              select: {
                subscribers: true,
                posts: true,
              },
            },
          },
        },
        categories: true,
      },
      orderBy: {
        user: {
          subscribers: {
            _count: "desc",
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: creators,
    });
  } catch (error) {
    next(error);
  }
};

export const getVerifiedCreators = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const creators = await prisma.creatorProfile.findMany({
      where: {
        isVerified: true,
        user: {
          isActive: true,
        },
      },
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            bio: true,
            _count: {
              select: {
                subscribers: true,
                posts: true,
              },
            },
          },
        },
        categories: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalCount = await prisma.creatorProfile.count({
      where: {
        isVerified: true,
        user: {
          isActive: true,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        creators,
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
