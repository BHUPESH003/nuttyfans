import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    const error = new Error("Not authorized, no token provided");
    error.statusCode = 401;
    return next(error);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        profile: {
          select: {
            id: true,
            isVerified: true,
          },
        },
      },
    });

    if (!user) {
      const error = new Error("User belonging to this token no longer exists");
      error.statusCode = 401;
      return next(error);
    }

    if (!user.isActive) {
      const error = new Error("User account is deactivated");
      error.statusCode = 401;
      return next(error);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    error.statusCode = 401;
    error.message = "Not authorized, invalid token";
    next(error);
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      const error = new Error(
        "You do not have permission to perform this action"
      );
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
};

export const isCreator = async (req, res, next) => {
  try {
    if (!req.user.profile) {
      const error = new Error(
        "You need to be a creator to perform this action"
      );
      error.statusCode = 403;
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const isVerifiedCreator = async (req, res, next) => {
  try {
    if (!req.user.profile || !req.user.profile.isVerified) {
      const error = new Error(
        "You need to be a verified creator to perform this action"
      );
      error.statusCode = 403;
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
};
