import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import prisma from "../config/prisma.js";
import { generateTokens, verifyRefreshToken } from "../utils/jwtUtils.js";
import emailService from "../services/emailService.js";
import { config } from "../config/env.js";

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  config.GOOGLE_CALLBACK_URL
);

export const register = async (req, res, next) => {
  try {
    const { email, username, password, confirmPassword, name } = req.body;

    // Validate required fields
    if (!email || !username || !password || !confirmPassword || !name) {
      const error = new Error(
        "All fields are required: email, username, password, confirmPassword, name"
      );
      error.statusCode = 400;
      return next(error);
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      const error = new Error("Passwords do not match");
      error.statusCode = 400;
      return next(error);
    }

    // Validate password strength
    if (password.length < 6) {
      const error = new Error("Password must be at least 6 characters long");
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

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = new Date();
    emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        fullName: name, // Use name for fullName field
        role: "USER",
        emailVerificationToken,
        emailVerificationExpires,
        isEmailVerified: false,
      },
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(
        email,
        username,
        emailVerificationToken
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail registration if email fails
    }

    // Don't generate tokens yet - user needs to verify email first
    const {
      password: _,
      emailVerificationToken: __,
      ...userWithoutSensitiveData
    } = user;

    res.status(201).json({
      success: true,
      message:
        "Registration successful! Please check your email to verify your account.",
      data: {
        user: userWithoutSensitiveData,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: email || "" }, { username: username || "" }],
      },
    });

    // Check if user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      return next(error);
    }

    // Check if account is active
    if (!user.isActive) {
      const error = new Error("Your account has been deactivated");
      error.statusCode = 401;
      return next(error);
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      // Check if verification token has expired
      if (
        user.emailVerificationExpires &&
        user.emailVerificationExpires < new Date()
      ) {
        // Generate new verification token
        const emailVerificationToken = crypto.randomBytes(32).toString("hex");
        const emailVerificationExpires = new Date();
        emailVerificationExpires.setHours(
          emailVerificationExpires.getHours() + 24
        );

        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerificationToken,
            emailVerificationExpires,
          },
        });

        // Resend verification email
        try {
          await emailService.sendVerificationEmail(
            user.email,
            user.username,
            emailVerificationToken
          );
        } catch (emailError) {
          console.error("Failed to resend verification email:", emailError);
        }
      }

      const error = new Error(
        "Please verify your email address before logging in. A new verification email has been sent."
      );
      error.statusCode = 401;
      return next(error);
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Remove sensitive data
    const {
      password: _,
      emailVerificationToken: __,
      passwordResetToken: ___,
      ...userWithoutPassword
    } = user;

    res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      const error = new Error("Verification token is required");
      error.statusCode = 400;
      return next(error);
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(), // Token must not be expired
        },
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
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.username);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    // Generate tokens now that email is verified
    const tokens = generateTokens(updatedUser);

    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      success: true,
      message: "Email verified successfully! Welcome to the platform.",
      data: {
        user: userWithoutPassword,
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

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
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = new Date();
    emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24);

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
        user.email,
        user.username,
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
      message: "Verification email sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      const error = new Error("Refresh token is required");
      error.statusCode = 400;
      return next(error);
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id || decoded.sub },
      include: {
        profile: true,
        _count: {
          select: {
            posts: true,
            subscribers: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      const error = new Error("Invalid refresh token or user deactivated");
      error.statusCode = 401;
      return next(error);
    }

    const tokens = generateTokens(user);
    const { password, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
        ...tokens,
      },
    });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      const customError = new Error("Invalid or expired refresh token");
      customError.statusCode = 401;
      return next(customError);
    }
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        _count: {
          select: {
            posts: true,
            subscribers: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    const { password, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
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

    // Always return success message to prevent email enumeration
    const successMessage =
      "If your email is registered, you'll receive a password reset link";

    if (!user) {
      return res.status(200).json({
        success: true,
        message: successMessage,
      });
    }

    // Only send reset email if user is verified
    if (!user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: successMessage,
      });
    }

    // Generate password reset token
    const passwordResetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetExpires = new Date();
    passwordResetExpires.setHours(passwordResetExpires.getHours() + 1); // 1 hour

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        user.username,
        passwordResetToken
      );
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Don't reveal email sending failure
    }

    res.status(200).json({
      success: true,
      message: successMessage,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      const error = new Error("Token and password are required");
      error.statusCode = 400;
      return next(error);
    }

    // Validate password strength
    if (password.length < 6) {
      const error = new Error("Password must be at least 6 characters long");
      error.statusCode = 400;
      return next(error);
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      const error = new Error("Invalid or expired reset token");
      error.statusCode = 400;
      return next(error);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      const error = new Error("Google token is required");
      error.statusCode = 400;
      return next(error);
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: config.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      const error = new Error("Email not provided by Google");
      error.statusCode = 400;
      return next(error);
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // User exists, update their Google info if needed
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            avatarUrl: picture || user.avatarUrl,
            isEmailVerified: true, // Google emails are already verified
          },
        });
      }
    } else {
      // Create new user
      const username = email.split("@")[0] + Math.floor(Math.random() * 1000);

      user = await prisma.user.create({
        data: {
          email,
          username,
          fullName: name,
          avatarUrl: picture,
          googleId,
          password: await bcrypt.hash(
            crypto.randomBytes(20).toString("hex"),
            12
          ), // Random password
          role: "USER",
          isEmailVerified: true, // Google emails are already verified
          isActive: true,
        },
      });

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(email, name);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Remove sensitive data
    const {
      password: _,
      emailVerificationToken: __,
      passwordResetToken: ___,
      ...userWithoutPassword
    } = user;

    res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
        ...tokens,
      },
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    next(error);
  }
};

export const getGoogleAuthUrl = async (req, res, next) => {
  try {
    const url = googleClient.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    });

    res.status(200).json({
      success: true,
      data: { url },
    });
  } catch (error) {
    next(error);
  }
};
