import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { config } from "../config/env.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, config.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          squareCustomerId: true,
          profile: {
            select: {
              id: true,
              isVerified: true,
              squareAccountId: true,
            },
          },
        },
      });

      if (!user || !user.isActive) {
        const error = new Error("User not found or account deactivated");
        error.statusCode = 401;
        return next(error);
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Auth error:", error);
      const authError = new Error("Not authorized, token failed");
      authError.statusCode = 401;
      next(authError);
    }
  } else {
    const error = new Error("Not authorized, no token");
    error.statusCode = 401;
    next(error);
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === "ADMIN") {
    next();
  } else {
    const error = new Error("Not authorized as an admin");
    error.statusCode = 403;
    next(error);
  }
};

export const creator = (req, res, next) => {
  if (req.user && req.user.profile && req.user.profile.isVerified) {
    next();
  } else {
    const error = new Error("Not authorized as a verified creator");
    error.statusCode = 403;
    next(error);
  }
};
