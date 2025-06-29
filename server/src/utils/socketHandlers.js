import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { config } from "../config/env.js";

const onlineUsers = new Map();

export const setupSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, config.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      });

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.user.id})`);

    onlineUsers.set(socket.user.id, socket.id);

    socket.join(`user:${socket.user.id}`);

    io.emit("users:online", Array.from(onlineUsers.keys()));

    socket.on("message:send", async (data) => {
      try {
        const { receiverId, content, mediaUrl } = data;

        const message = await prisma.message.create({
          data: {
            content,
            mediaUrl,
            senderId: socket.user.id,
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
            content: `${socket.user.username} sent you a message`,
            relatedId: socket.user.id,
            relatedType: "User",
          },
        });

        if (onlineUsers.has(receiverId)) {
          io.to(`user:${receiverId}`).emit("message:receive", message);
        }

        io.to(`user:${receiverId}`).emit("notification:new");

        socket.emit("message:sent", { id: message.id });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message:error", { message: "Failed to send message" });
      }
    });

    socket.on("typing:start", (receiverId) => {
      if (onlineUsers.has(receiverId)) {
        io.to(`user:${receiverId}`).emit("typing:started", socket.user.id);
      }
    });

    socket.on("typing:stop", (receiverId) => {
      if (onlineUsers.has(receiverId)) {
        io.to(`user:${receiverId}`).emit("typing:stopped", socket.user.id);
      }
    });

    socket.on("disconnect", () => {
      console.log(
        `User disconnected: ${socket.user.username} (${socket.user.id})`
      );

      onlineUsers.delete(socket.user.id);

      io.emit("users:online", Array.from(onlineUsers.keys()));
    });
  });
};
