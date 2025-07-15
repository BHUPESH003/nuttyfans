import crypto from "crypto";
import prisma from "../config/prisma.js";
import {
  generateTokens,
  verifyRefreshToken,
  generateEmailVerificationToken,
  generateMagicLinkToken,
  verifyEmailVerificationToken,
  verifyMagicLinkToken,
} from "../utils/jwtUtils.js";
import emailService from "../services/emailService.js";

// Helper function to clean up user data for response
const cleanUserData = (user) => {
  const { emailVerificationToken, magicLinkToken, ...cleanUser } = user;
  return cleanUser;
};

// Register with only email
export const register = async (req, res, next) => {
  try {
    const { email, username, name, fullName } = req.body;

    // Validate required fields
    if (!email || !username) {
      const error = new Error("Email and username are required");
      error.statusCode = 400;
      return next(error);
    }

    // Check if email already exists
    const emailExists = await prisma.user.findUnique({
      where: { email },
    });

    if (emailExists) {
      const error = new Error("Email already in use");
      error.statusCode = 400;
      return next(error);
    }

    // Check if username already exists
    const usernameExists = await prisma.user.findUnique({
      where: { username },
    });

    if (usernameExists) {
      const error = new Error("Username already taken");
      error.statusCode = 400;
      return next(error);
    }

    // Generate email verification token
    const emailVerificationToken = generateEmailVerificationToken({
      id: crypto.randomUUID(),
      email,
      username,
    });

    // Create user (no password needed)
    const user = await prisma.user.create({
      data: {
        email,
        username,
        fullName: fullName || name || username,
        role: "USER",
        emailVerificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isEmailVerified: false,
        language: req.headers["accept-language"]?.split(",")[0] || "en",
      },
      include: {
        profile: true,
      },
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(
        email,
        user.fullName || username,
        emailVerificationToken
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    // Create welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "WELCOME",
        title: "Welcome to NuttyFans!",
        content: `Welcome ${
          user.fullName || user.username
        }! Please verify your email to get started.`,
      },
    });

    res.status(201).json({
      success: true,
      message:
        "Registration successful! Please check your email to verify your account.",
      data: {
        user: cleanUserData(user),
        requiresEmailVerification: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login with magic link - send magic link to email
export const login = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      const error = new Error("Email is required");
      error.statusCode = 400;
      return next(error);
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Check if user exists
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        success: true,
        message: "If this account exists, you will receive a login link",
        data: {
          sentTo: email,
        },
      });
    }

    // Check if account is active
    if (!user.isActive) {
      const error = new Error("Your account has been deactivated");
      error.statusCode = 403;
      return next(error);
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      const error = new Error("Please verify your email address first");
      error.statusCode = 401;
      return next(error);
    }

    // Generate magic link token
    const magicLinkToken = generateMagicLinkToken({
      id: user.id,
      email: user.email,
    });
    const magicLinkExpires = new Date();
    magicLinkExpires.setMinutes(magicLinkExpires.getMinutes() + 15); // 15 minutes

    // Update user with magic link token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        magicLinkToken,
        magicLinkExpires,
        loginAttempts: 0,
      },
    });

    // Send magic link email
    try {
      await emailService.sendMagicLinkEmail(
        user.email,
        user.fullName || user.username,
        magicLinkToken
      );
    } catch (emailError) {
      console.error("Failed to send magic link email:", emailError);
      const error = new Error("Failed to send login link");
      error.statusCode = 500;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Login link sent to your email",
      data: {
        sentTo: user.email,
        expiresIn: "15 minutes",
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify magic link and complete login
export const verifyMagicLink = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      const error = new Error("Login token is required");
      error.statusCode = 400;
      return next(error);
    }

    // Verify the magic link token
    const decoded = verifyMagicLinkToken(token);

    if (!decoded) {
      const error = new Error("Invalid or expired login link");
      error.statusCode = 401;
      return next(error);
    }

    // Find user with magic link token
    const user = await prisma.user.findFirst({
      where: {
        email: decoded.email,
        magicLinkToken: token,
        magicLinkExpires: {
          gt: new Date(),
        },
      },
      include: {
        profile: true,
      },
    });

    if (!user) {
      const error = new Error("Invalid or expired login link");
      error.statusCode = 401;
      return next(error);
    }

    // Clear magic link token and update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        magicLinkToken: null,
        magicLinkExpires: null,
        loginAttempts: 0,
        lastActiveAt: new Date(),
      },
    });

    // Generate authentication tokens
    const tokens = generateTokens(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: cleanUserData(user),
        ...tokens,
        loginMethod: "magic_link",
      },
    });
  } catch (error) {
    next(error);
  }
};

// Email verification
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      const error = new Error("Verification token is required");
      error.statusCode = 400;
      return next(error);
    }

    // Verify the email verification token
    const decoded = verifyEmailVerificationToken(token);

    if (!decoded) {
      const error = new Error("Invalid or expired verification token");
      error.statusCode = 400;
      return next(error);
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: {
        email: decoded.email,
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(), // Token must not be expired
        },
      },
      include: {
        profile: true,
      },
    });

    if (!user) {
      const error = new Error("Invalid or expired verification token");
      error.statusCode = 400;
      return next(error);
    }

    // Update user as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
      include: {
        profile: true,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "EMAIL_VERIFIED",
        title: "Email Verified",
        content:
          "Your email address has been successfully verified! You can now log in.",
      },
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(
        user.email,
        user.fullName || user.username
      );
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now log in.",
      data: {
        user: cleanUserData(updatedUser),
        verified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Resend verification email
export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      const error = new Error("Email is required");
      error.statusCode = 400;
      return next(error);
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not
      return res.status(200).json({
        success: true,
        message:
          "If your email is registered and not verified, a verification email has been sent.",
      });
    }

    if (user.isEmailVerified) {
      const error = new Error("Email is already verified");
      error.statusCode = 400;
      return next(error);
    }

    // Generate new verification token
    const emailVerificationToken = generateEmailVerificationToken(user);
    const emailVerificationExpires = new Date();
    emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24);

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpires,
      },
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(
        email,
        user.fullName || user.username,
        emailVerificationToken
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      const error = new Error("Failed to send verification email");
      error.statusCode = 500;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Verification email has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      const error = new Error("Refresh token is required");
      error.statusCode = 400;
      return next(error);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      const error = new Error("Invalid refresh token");
      error.statusCode = 401;
      return next(error);
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        profile: true,
      },
    });

    if (!user || !user.isActive) {
      const error = new Error("User not found or inactive");
      error.statusCode = 401;
      return next(error);
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    res.status(200).json({
      success: true,
      data: {
        user: cleanUserData(user),
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
            notifications: {
              where: { isRead: false },
            },
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
      data: {
        user: cleanUserData(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout
export const logout = async (req, res, next) => {
  try {
    // Update user last active time
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        lastActiveAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};
