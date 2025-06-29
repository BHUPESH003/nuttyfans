import prisma from "../config/prisma.js";

export const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      return next(error);
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment || parentComment.postId !== postId) {
        const error = new Error("Parent comment not found");
        error.statusCode = 404;
        return next(error);
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: req.user.id,
        postId,
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (post.userId !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: "NEW_COMMENT",
          title: "New Comment",
          content: `${req.user.username} commented on your post`,
          relatedId: postId,
          relatedType: "Post",
        },
      });
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        include: { user: true },
      });

      if (parentComment && parentComment.userId !== req.user.id) {
        await prisma.notification.create({
          data: {
            userId: parentComment.userId,
            type: "NEW_COMMENT",
            title: "New Reply",
            content: `${req.user.username} replied to your comment`,
            relatedId: postId,
            relatedType: "Post",
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20, parentId = null } = req.query;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      return next(error);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: parentId === "null" ? null : parentId,
      },
      orderBy: { createdAt: parentId ? "asc" : "desc" },
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { replies: true },
        },
      },
    });

    const totalCount = await prisma.comment.count({
      where: {
        postId,
        parentId: parentId === "null" ? null : parentId,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        comments,
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

export const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      const error = new Error("Comment not found");
      error.statusCode = 404;
      return next(error);
    }

    if (comment.userId !== req.user.id) {
      const error = new Error("Not authorized to update this comment");
      error.statusCode = 403;
      return next(error);
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content },
    });

    res.status(200).json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { post: true },
    });

    if (!comment) {
      const error = new Error("Comment not found");
      error.statusCode = 404;
      return next(error);
    }

    const isAuthorized =
      comment.userId === req.user.id ||
      comment.post.userId === req.user.id ||
      req.user.role === "ADMIN";

    if (!isAuthorized) {
      const error = new Error("Not authorized to delete this comment");
      error.statusCode = 403;
      return next(error);
    }

    await prisma.comment.deleteMany({
      where: {
        OR: [{ id }, { parentId: id }],
      },
    });

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
