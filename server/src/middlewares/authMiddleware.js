import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { config } from "../config/env.js";

/**
 * Extract token from request headers
 * @param {Request} req - Express request object
 * @returns {string|null} - JWT token or null
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
};

/**
 * Verify JWT token and return decoded payload
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
};

/**
 * Get user from database with full profile information
 * @param {string} userId - User ID
 * @returns {object|null} - User object or null
 */
const getUserById = async (userId) => {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        isEmailVerified: true,
        twoFactorEnabled: true,
        lastActiveAt: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            isVerified: true,
            isCreator: true,
            squareAccountId: true,
            monthlyPrice: true,
            displayName: true,
            bio: true,
            tagline: true,
            about: true,
            socialLinks: true,
            categories: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            _count: {
              select: {
                subscribers: true,
                posts: true,
              },
            },
          },
        },
        _count: {
          select: {
            posts: true,
            subscribers: true,
            subscriptions: true,
            notifications: {
              where: { isRead: false },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Database error in getUserById:", error);
    return null;
  }
};

/**
 * Create authentication error
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} - Error object
 */
const createAuthError = (message, statusCode = 401) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Main authentication middleware
 * Validates JWT token and sets req.user with authenticated user data
 */
export const protect = async (req, res, next) => {
  try {
    // Extract token from headers
    const token = extractToken(req);

    if (!token) {
      return next(
        createAuthError("Authentication required - No token provided")
      );
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return next(createAuthError("Invalid or expired token"));
    }

    // Get user from database
    const user = await getUserById(decoded.sub);

    if (!user) {
      return next(createAuthError("User not found or account deleted"));
    }

    // Check if user account is active
    if (!user.isActive) {
      return next(createAuthError("Account has been deactivated", 403));
    }

    // Update user's last active time (non-blocking)
    prisma.user
      .update({
        where: { id: user.id },
        data: {
          lastActiveAt: new Date(),
          isOnline: true,
        },
      })
      .catch((error) => {
        console.error("Failed to update last active time:", error);
      });

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    next(createAuthError("Authentication failed"));
  }
};

/**
 * Optional authentication middleware
 * Similar to protect but doesn't require authentication
 * Sets req.user if valid token is provided
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return next(); // No token is fine for optional auth
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return next(); // Invalid token is fine for optional auth
    }

    const user = await getUserById(decoded.sub);

    if (user && user.isActive) {
      req.user = user;

      // Update last active time (non-blocking)
      prisma.user
        .update({
          where: { id: user.id },
          data: {
            lastActiveAt: new Date(),
            isOnline: true,
          },
        })
        .catch((error) => {
          console.error("Failed to update last active time:", error);
        });
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next(); // Don't fail for optional auth
  }
};

/**
 * Creator-only middleware
 * Requires user to be authenticated and have creator status
 */
export const requireCreator = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(createAuthError("Authentication required"));
    }

    const hasCreatorProfile = req.user.profile && req.user.profile.isCreator;

    if (!hasCreatorProfile) {
      return next(createAuthError("Creator account required", 403));
    }

    next();
  } catch (error) {
    console.error("Creator middleware error:", error);
    next(createAuthError("Creator verification failed"));
  }
};

/**
 * Admin-only middleware
 * Requires user to be authenticated and have admin role
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(createAuthError("Authentication required"));
    }

    if (req.user.role !== "ADMIN") {
      return next(createAuthError("Admin access required", 403));
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    next(createAuthError("Admin verification failed"));
  }
};

/**
 * Email verification middleware
 * Requires user to have verified email
 */
export const requireVerifiedEmail = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(createAuthError("Authentication required"));
    }

    if (!req.user.isEmailVerified) {
      return next(createAuthError("Email verification required", 403));
    }

    next();
  } catch (error) {
    console.error("Email verification middleware error:", error);
    next(createAuthError("Email verification check failed"));
  }
};

/**
 * Role-based access control middleware factory
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Function} - Middleware function
 */
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(createAuthError("Authentication required"));
      }

      if (!allowedRoles.includes(req.user.role)) {
        return next(createAuthError("Insufficient permissions", 403));
      }

      next();
    } catch (error) {
      console.error("Role middleware error:", error);
      next(createAuthError("Role verification failed"));
    }
  };
};

/**
 * Self or admin middleware
 * Allows access if user is accessing their own resource or is admin
 * @param {string} userIdParam - Parameter name containing user ID
 * @returns {Function} - Middleware function
 */
export const requireSelfOrAdmin = (userIdParam = "userId") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(createAuthError("Authentication required"));
      }

      const targetUserId = req.params[userIdParam];

      if (req.user.id === targetUserId || req.user.role === "ADMIN") {
        return next();
      }

      return next(
        createAuthError("Access denied - can only access own resources", 403)
      );
    } catch (error) {
      console.error("Self or admin middleware error:", error);
      next(createAuthError("Access verification failed"));
    }
  };
};

/**
 * Rate limiting middleware for sensitive operations
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} - Middleware function
 */
export const rateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + (req.user ? req.user.id : "");
    const now = Date.now();

    if (!attempts.has(key)) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const attemptData = attempts.get(key);

    if (now > attemptData.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (attemptData.count >= maxAttempts) {
      return next(
        createAuthError("Too many attempts, please try again later", 429)
      );
    }

    attemptData.count++;
    next();
  };
};

// Legacy exports for backward compatibility
export const creator = requireCreator;
export const admin = requireAdmin;
