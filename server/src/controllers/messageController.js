import prisma from "../config/prisma.js";
import {
  uploadToS3,
  getMediaTypeFromFilename,
} from "../services/awsS3Service.js";

export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;
    const mediaFile = req.file;

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      const error = new Error("Receiver not found");
      error.statusCode = 404;
      return next(error);
    }

    if (receiverId === req.user.id) {
      const error = new Error("Cannot send message to yourself");
      error.statusCode = 400;
      return next(error);
    }

    if (!content && !mediaFile) {
      const error = new Error("Message must have content or media");
      error.statusCode = 400;
      return next(error);
    }

    let mediaUrl = null;
    let mediaType = null;
    if (mediaFile) {
      const quality = req.mediaQuality || "high";

      const result = await uploadToS3(mediaFile.path, "messages", {
        quality,
        userId: req.user.id,
      });
      mediaUrl = result.url;
      mediaType = getMediaTypeFromFilename(mediaFile.originalname);
    }

    const message = await prisma.message.create({
      data: {
        content: content || "",
        mediaUrl,
        mediaType,
        senderId: req.user.id,
        receiverId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "NEW_MESSAGE",
        title: "New Message",
        content: `${req.user.username} sent you a message`,
        relatedId: req.user.id,
        relatedType: "User",
      },
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const otherUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, avatarUrl: true },
    });

    if (!otherUser) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id },
        ],
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: req.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    const totalCount = await prisma.message.count({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id },
        ],
      },
    });

    res.status(200).json({
      success: true,
      data: {
        user: otherUser,
        messages: messages.reverse(),
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

export const getConversations = async (req, res, next) => {
  try {
    const conversations = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN m."senderId" = ${req.user.id} THEN m."receiverId" 
          ELSE m."senderId" 
        END as "userId",
        u.username,
        u."avatarUrl",
        MAX(m."createdAt") as "lastMessageAt",
        (
          SELECT count(*) 
          FROM "Message" 
          WHERE "senderId" = "userId" 
          AND "receiverId" = ${req.user.id}
          AND "isRead" = false
        ) as "unreadCount"
      FROM "Message" m
      JOIN "User" u ON (
        CASE 
          WHEN m."senderId" = ${req.user.id} THEN u.id = m."receiverId" 
          ELSE u.id = m."senderId" 
        END
      )
      WHERE m."senderId" = ${req.user.id} OR m."receiverId" = ${req.user.id}
      GROUP BY "userId", u.username, u."avatarUrl"
      ORDER BY "lastMessageAt" DESC
    `;

    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: req.user.id, receiverId: conv.userId },
              { senderId: conv.userId, receiverId: req.user.id },
            ],
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            mediaUrl: true,
            mediaType: true,
            createdAt: true,
            senderId: true,
          },
        });

        return {
          ...conv,
          lastMessage,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: conversationsWithLastMessage,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        receiverId: req.user.id,
      },
    });

    if (!message) {
      const error = new Error("Message not found");
      error.statusCode = 404;
      return next(error);
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const otherUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!otherUser) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    const result = await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: req.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `${result.count} messages marked as read`,
      count: result.count,
    });
  } catch (error) {
    next(error);
  }
};
