import prisma from "../config/prisma.js";
import {
  uploadToSpaces,
  getMediaTypeFromFilename,
  getKeyFromUrl,
  deleteFromSpaces,
} from "../services/digitalOceanService.js";

export const createPost = async (req, res, next) => {
  try {
    const { title, content, isPremium, price, categories } = req.body;
    const files = req.files;

    if (isPremium && !price) {
      const error = new Error("Premium posts require a price");
      error.statusCode = 400;
      return next(error);
    }

    const mediaUrls = [];
    const mediaTypes = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const quality = req.mediaQuality || "high";

        const result = await uploadToSpaces(file.path, "posts", {
          quality,
          userId: req.user.id,
        });
        mediaUrls.push(result.url);
        mediaTypes.push(getMediaTypeFromFilename(file.originalname));
      }
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        isPremium: isPremium || false,
        price: isPremium ? parseFloat(price) : null,
        mediaUrls,
        mediaType: mediaTypes,
        userId: req.user.id,
        categories: {
          connect: categories ? categories.map((id) => ({ id })) : [],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        categories: true,
      },
    });

    if (req.user.profile?.isVerified) {
      const activeSubscribers = await prisma.subscription.findMany({
        where: {
          creatorId: req.user.id,
          status: "ACTIVE",
          currentPeriodEnd: { gte: new Date() },
        },
        select: {
          subscriberId: true,
        },
      });

      const notificationPromises = activeSubscribers.map((sub) =>
        prisma.notification.create({
          data: {
            userId: sub.subscriberId,
            type: "NEW_CONTENT",
            title: "New Content",
            content: `${req.user.username} has posted new content`,
            relatedId: post.id,
            relatedType: "Post",
          },
        })
      );

      await Promise.all(notificationPromises);
    }

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

export const getPosts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      creatorId,
      category,
      isPremium,
      search,
      sort = "newest",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isArchived: false,
    };

    if (creatorId) {
      where.userId = creatorId;
    }

    if (category) {
      where.categories = {
        some: { id: category },
      };
    }

    if (isPremium !== undefined) {
      where.isPremium = isPremium === "true";
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    if (!req.user || (creatorId && creatorId !== req.user.id)) {
      let isSubscribed = false;

      if (req.user && creatorId) {
        const subscription = await prisma.subscription.findFirst({
          where: {
            subscriberId: req.user.id,
            creatorId,
            status: "ACTIVE",
            currentPeriodEnd: { gte: new Date() },
          },
        });

        isSubscribed = !!subscription;
      }

      if (!isSubscribed) {
        where.isPremium = false;
      }
    }

    let orderBy = {};

    switch (sort) {
      case "popular":
        orderBy = { createdAt: "desc" }; // Note: For proper popularity, we'd need a likes count field
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy,
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            profile: {
              select: {
                isVerified: true,
              },
            },
          },
        },
        categories: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    const totalCount = await prisma.post.count({ where });

    if (req.user) {
      const postIds = posts.map((post) => post.id);

      const likedPosts = await prisma.like.findMany({
        where: {
          userId: req.user.id,
          postId: { in: postIds },
        },
        select: { postId: true },
      });

      const likedPostIds = likedPosts.map((like) => like.postId);

      const purchasedPosts = await prisma.purchase.findMany({
        where: {
          userId: req.user.id,
          postId: { in: postIds },
          status: "COMPLETED",
        },
        select: { postId: true },
      });

      const purchasedPostIds = purchasedPosts.map(
        (purchase) => purchase.postId
      );

      posts.forEach((post) => {
        post.isLiked = likedPostIds.includes(post.id);
        post.isPurchased = purchasedPostIds.includes(post.id);
      });
    }

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

export const getPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
            profile: {
              select: {
                isVerified: true,
                monthlyPrice: true,
              },
            },
          },
        },
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

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      return next(error);
    }

    if (post.isArchived && (!req.user || req.user.id !== post.user.id)) {
      const error = new Error("Post is archived");
      error.statusCode = 404;
      return next(error);
    }

    let canAccess = !post.isPremium;

    if (req.user && post.isPremium) {
      if (req.user.id === post.userId) {
        canAccess = true;
      } else {
        const subscription = await prisma.subscription.findFirst({
          where: {
            subscriberId: req.user.id,
            creatorId: post.userId,
            status: "ACTIVE",
            currentPeriodEnd: { gte: new Date() },
          },
        });

        if (subscription) {
          canAccess = true;
        } else {
          const purchase = await prisma.purchase.findFirst({
            where: {
              userId: req.user.id,
              postId: post.id,
              status: "COMPLETED",
            },
          });

          if (purchase) {
            canAccess = true;
          }
        }
      }
    }

    if (post.isPremium && !canAccess) {
      post.mediaUrls = [];
      post.content = post.content?.substring(0, 100) + "... [Premium Content]";

      res.status(200).json({
        success: true,
        data: {
          ...post,
          isLocked: true,
        },
      });
      return;
    }

    let isLiked = false;
    if (req.user) {
      const like = await prisma.like.findFirst({
        where: {
          userId: req.user.id,
          postId: post.id,
        },
      });

      isLiked = !!like;
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId: post.id,
        parentId: null,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: { select: { replies: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        ...post,
        isLiked,
        comments,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, isPremium, price, categories, isArchived } =
      req.body;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      return next(error);
    }

    if (post.userId !== req.user.id) {
      const error = new Error("Not authorized to update this post");
      error.statusCode = 403;
      return next(error);
    }

    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    if (isPremium !== undefined) {
      updateData.isPremium = isPremium;

      if (isPremium && !price && !post.price) {
        const error = new Error("Premium posts require a price");
        error.statusCode = 400;
        return next(error);
      }

      if (price !== undefined) {
        updateData.price = parseFloat(price);
      } else if (isPremium && !post.price) {
        updateData.price = 0;
      }
    }

    const updatedPost = await prisma.post.update({
      where: { id },
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
      data: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      return next(error);
    }

    if (post.userId !== req.user.id && req.user.role !== "ADMIN") {
      const error = new Error("Not authorized to delete this post");
      error.statusCode = 403;
      return next(error);
    }

    if (post.mediaUrls && post.mediaUrls.length > 0) {
      for (const url of post.mediaUrls) {
        const key = getKeyFromUrl(url);
        if (key) {
          await deleteFromSpaces(key);
        }
      }
    }

    await prisma.post.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const likePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      return next(error);
    }

    const existingLike = await prisma.like.findFirst({
      where: {
        userId: req.user.id,
        postId: id,
      },
    });

    if (existingLike) {
      return res.status(200).json({
        success: true,
        message: "Post already liked",
      });
    }

    await prisma.like.create({
      data: {
        userId: req.user.id,
        postId: id,
      },
    });

    if (post.userId !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: "NEW_LIKE",
          title: "New Like",
          content: `${req.user.username} liked your post`,
          relatedId: id,
          relatedType: "Post",
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Post liked successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const unlikePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      return next(error);
    }

    await prisma.like.deleteMany({
      where: {
        userId: req.user.id,
        postId: id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Post unliked successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const uploadMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      const error = new Error("No files uploaded");
      error.statusCode = 400;
      return next(error);
    }

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      return next(error);
    }

    if (post.userId !== req.user.id) {
      const error = new Error("Not authorized to update this post");
      error.statusCode = 403;
      return next(error);
    }

    const newMediaUrls = [];
    const newMediaTypes = [];

    for (const file of files) {
      const quality = req.mediaQuality || "high";

      const result = await uploadToSpaces(file.path, "posts", {
        quality,
        userId: req.user.id,
      });
      newMediaUrls.push(result.url);
      newMediaTypes.push(getMediaTypeFromFilename(file.originalname));
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        mediaUrls: [...post.mediaUrls, ...newMediaUrls],
        mediaType: [...post.mediaType, ...newMediaTypes],
      },
    });

    res.status(200).json({
      success: true,
      data: {
        mediaUrls: updatedPost.mediaUrls,
        mediaType: updatedPost.mediaType,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMedia = async (req, res, next) => {
  try {
    const { id, index } = req.params;
    const mediaIndex = parseInt(index);

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      return next(error);
    }

    if (post.userId !== req.user.id) {
      const error = new Error("Not authorized to update this post");
      error.statusCode = 403;
      return next(error);
    }

    if (mediaIndex < 0 || mediaIndex >= post.mediaUrls.length) {
      const error = new Error("Invalid media index");
      error.statusCode = 400;
      return next(error);
    }

    const mediaUrl = post.mediaUrls[mediaIndex];
    const key = getKeyFromUrl(mediaUrl);
    if (key) {
      await deleteFromSpaces(key);
    }

    const newMediaUrls = [...post.mediaUrls];
    const newMediaTypes = [...post.mediaType];
    newMediaUrls.splice(mediaIndex, 1);
    newMediaTypes.splice(mediaIndex, 1);

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        mediaUrls: newMediaUrls,
        mediaType: newMediaTypes,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        mediaUrls: updatedPost.mediaUrls,
        mediaType: updatedPost.mediaType,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const bookmarkPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      return next(error);
    }

    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        userId: req.user.id,
        postId: id,
      },
    });

    if (existingBookmark) {
      return res.status(200).json({
        success: true,
        message: "Post already bookmarked",
      });
    }

    await prisma.bookmark.create({
      data: {
        userId: req.user.id,
        postId: id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Post bookmarked successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const unbookmarkPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      return next(error);
    }

    await prisma.bookmark.deleteMany({
      where: {
        userId: req.user.id,
        postId: id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Post unbookmarked successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getBookmarkedPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                profile: {
                  select: {
                    isVerified: true,
                  },
                },
              },
            },
            categories: true,
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        },
      },
    });

    const posts = bookmarks.map((bookmark) => bookmark.post);
    const totalCount = await prisma.bookmark.count({
      where: { userId: req.user.id },
    });

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
