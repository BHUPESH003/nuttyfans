import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import prisma from "../config/prisma.js";
import {
  generateTokens,
  verifyRefreshToken,
  generateOTPToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  generateTempToken,
  verifyEmailVerificationToken,
  verifyPasswordResetToken,
  createTokenResponse,
  cleanUserDataForToken,
} from "../utils/jwtUtils.js";
import emailService from "../services/emailService.js";
import { config } from "../config/env.js";
import {
  uploadToSpaces,
  getKeyFromUrl,
  deleteFromSpaces,
} from "../services/digitalOceanService.js";

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  config.GOOGLE_CALLBACK_URL
);

// Helper function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Helper function to clean up user data for response
const cleanUserData = (user) => {
  const {
    password,
    emailVerificationToken,
    passwordResetToken,
    otpToken,
    twoFactorSecret,
    backupCodes,
    googleId,
    ...cleanUser
  } = user;
  return cleanUser;
};

// Helper function to generate unique username
const generateUniqueUsername = async (email, fullName) => {
  let baseUsername = email.split("@")[0];

  // Clean username
  baseUsername = baseUsername.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  if (!baseUsername || baseUsername.length < 3) {
    baseUsername =
      fullName?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "user";
  }

  let username = baseUsername;
  let counter = 1;

  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
};

// Register with optional password (passwordless by default)
export const register = async (req, res, next) => {
  try {
    const {
      email,
      username,
      password,
      confirmPassword,
      firstName,
      lastName,
      fullName,
      registrationMethod = "passwordless",
    } = req.body;

    // Validate required fields
    if (!email || !username) {
      const error = new Error("Email and username are required");
      error.statusCode = 400;
      return next(error);
    }

    // If password provided, validate it
    if (password) {
      if (!confirmPassword) {
        const error = new Error("Password confirmation is required");
        error.statusCode = 400;
        return next(error);
      }

      if (password !== confirmPassword) {
        const error = new Error("Passwords do not match");
        error.statusCode = 400;
        return next(error);
      }

      if (password.length < 8) {
        const error = new Error("Password must be at least 8 characters long");
        error.statusCode = 400;
        return next(error);
      }
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

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(12);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Generate email verification token using JWT
    const emailVerificationToken = generateEmailVerificationToken({
      id: crypto.randomUUID(),
      email,
      username,
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        fullName:
          fullName || `${firstName || ""} ${lastName || ""}`.trim() || username,
        role: "USER",
        emailVerificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isEmailVerified: false,
        language: req.headers["accept-language"]?.split(",")[0] || "en",
        registrationMethod,
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

    // For passwordless registration, also send a login link
    if (registrationMethod === "passwordless") {
      // Generate OTP for immediate login after verification
      const otp = generateOTP();
      const otpExpires = new Date();
      otpExpires.setMinutes(otpExpires.getMinutes() + 30); // 30 minutes for registration

      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpToken: otp,
          otpExpires,
          otpAttempts: 0,
        },
      });

      // Send welcome email with login instructions
      try {
        await emailService.sendPasswordlessWelcomeEmail(
          email,
          user.fullName || username,
          emailVerificationToken,
          otp
        );
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
    }

    res.status(201).json({
      success: true,
      message:
        registrationMethod === "passwordless"
          ? "Registration successful! Please check your email to verify your account and get your login code."
          : "Registration successful! Please check your email to verify your account.",
      data: {
        user: cleanUserData(user),
        requiresEmailVerification: true,
        registrationMethod,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Passwordless login - initiate login process
export const login = async (req, res, next) => {
  try {
    const { email, username } = req.body;

    if (!email && !username) {
      const error = new Error("Email or username is required");
      error.statusCode = 400;
      return next(error);
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: email || "" }, { username: username || "" }],
      },
      include: {
        profile: true,
      },
    });

    // Check if user exists
    if (!user) {
      // Don't reveal if email/username exists - return success regardless
      return res.status(200).json({
        success: true,
        message: "If this account exists, you will receive a login link",
        data: {
          loginMethod: "email",
          sentTo: email || "your registered email",
        },
      });
    }

    // Check if account is active
    if (!user.isActive) {
      const error = new Error("Your account has been deactivated");
      error.statusCode = 403;
      return next(error);
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // 10 minutes

    // Update user with OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpToken: otp,
        otpExpires,
        otpAttempts: 0,
      },
    });

    // Send OTP email
    try {
      await emailService.sendLoginOTP(
        user.email,
        user.fullName || user.username,
        otp
      );
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      const error = new Error("Failed to send login code");
      error.statusCode = 500;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Login code sent to your email",
      data: {
        loginMethod: "email",
        sentTo: user.email,
        expiresIn: "10 minutes",
      },
    });
  } catch (error) {
    next(error);
  }
};

// Password-based login (legacy support)
export const passwordLogin = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    if (!password && !email && !username) {
      const error = new Error("Email/username and password are required");
      error.statusCode = 400;
      return next(error);
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: email || "" }, { username: username || "" }],
      },
      include: {
        profile: true,
      },
    });

    // Check if user exists
    if (!user) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      return next(error);
    }

    // Check if user has password (not OAuth only)
    if (!user.password) {
      const error = new Error(
        "This account uses passwordless login. Please use the regular login option."
      );
      error.statusCode = 401;
      return next(error);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      return next(error);
    }

    // Check if account is active
    if (!user.isActive) {
      const error = new Error("Your account has been deactivated");
      error.statusCode = 403;
      return next(error);
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email address before logging in",
        error: "EMAIL_NOT_VERIFIED",
        data: {
          userId: user.id,
          email: user.email,
        },
      });
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActiveAt: new Date(),
        isOnline: true,
      },
    });

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return res.status(200).json({
        success: true,
        message: "2FA required",
        requiresTwoFactor: true,
        tempToken: generateTokens({ id: user.id, temp: true }).accessToken,
      });
    }

    // Generate tokens
    const tokens = generateTokens(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: cleanUserData(user),
        ...tokens,
        loginMethod: "password",
      },
    });
  } catch (error) {
    next(error);
  }
};

// OTP-based passwordless login
export const requestLoginOTP = async (req, res, next) => {
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

    if (!user) {
      // Don't reveal if email exists
      return res.status(200).json({
        success: true,
        message: "If this email is registered, you will receive a login link",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      const error = new Error("Your account has been deactivated");
      error.statusCode = 403;
      return next(error);
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // 10 minutes

    // Update user with OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpToken: otp,
        otpExpires,
        otpAttempts: 0,
      },
    });

    // Send OTP email
    try {
      await emailService.sendLoginOTP(
        email,
        user.fullName || user.username,
        otp
      );
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      const error = new Error("Failed to send login code");
      error.statusCode = 500;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Login code sent to your email",
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP and login
export const verifyLoginOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      const error = new Error("Email and OTP are required");
      error.statusCode = 400;
      return next(error);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      return next(error);
    }

    // Check OTP attempts
    if (user.otpAttempts >= 3) {
      const error = new Error(
        "Too many failed attempts. Please request a new code"
      );
      error.statusCode = 429;
      return next(error);
    }

    // Check if OTP is valid and not expired
    if (
      !user.otpToken ||
      user.otpToken !== otp ||
      user.otpExpires < new Date()
    ) {
      // Increment attempts
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpAttempts: user.otpAttempts + 1,
        },
      });

      const error = new Error("Invalid or expired login code");
      error.statusCode = 401;
      return next(error);
    }

    // Clear OTP and update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpToken: null,
        otpExpires: null,
        otpAttempts: 0,
        isEmailVerified: true, // Auto-verify email with OTP login
        lastActiveAt: new Date(),
        isOnline: true,
      },
    });

    // Generate tokens
    const tokens = generateTokens(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: cleanUserData(user),
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Google OAuth login
export const googleLogin = async (req, res, next) => {
  try {
    const { credential, clientId } = req.body;

    if (!credential) {
      const error = new Error("Google credential is required");
      error.statusCode = 400;
      return next(error);
    }

    // Verify the Google token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: config.GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      console.error("Google token verification failed:", verifyError);
      const error = new Error("Invalid Google token");
      error.statusCode = 401;
      return next(error);
    }

    const payload = ticket.getPayload();
    const {
      sub: googleId,
      email,
      name: fullName,
      given_name: firstName,
      family_name: lastName,
      picture: googleAvatarUrl,
      email_verified: emailVerified,
    } = payload;

    // Find existing user by Google ID or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
      include: {
        profile: true,
      },
    });

    if (user) {
      // Update existing user with Google info if not set
      const updateData = {};
      if (!user.googleId) updateData.googleId = googleId;
      if (!user.googleEmail) updateData.googleEmail = email;
      if (!user.googleAvatarUrl) updateData.googleAvatarUrl = googleAvatarUrl;
      if (!user.isEmailVerified && emailVerified)
        updateData.isEmailVerified = true;
      if (!user.avatarUrl && googleAvatarUrl)
        updateData.avatarUrl = googleAvatarUrl;

      updateData.lastActiveAt = new Date();
      updateData.isOnline = true;

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
          include: {
            profile: true,
          },
        });
      }
    } else {
      // Create new user
      const username = await generateUniqueUsername(email, fullName);

      user = await prisma.user.create({
        data: {
          email,
          username,
          fullName,
          firstName,
          lastName,
          googleId,
          googleEmail: email,
          googleAvatarUrl,
          avatarUrl: googleAvatarUrl,
          isEmailVerified: emailVerified || false,
          role: "USER",
          lastActiveAt: new Date(),
          isOnline: true,
        },
        include: {
          profile: true,
        },
      });

      // Create welcome notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "WELCOME",
          title: "Welcome to NuttyFans!",
          content: `Welcome ${user.fullName}! Your account has been created successfully.`,
        },
      });
    }

    // Check if account is active
    if (!user.isActive) {
      const error = new Error("Your account has been deactivated");
      error.statusCode = 403;
      return next(error);
    }

    // Generate tokens
    const tokens = generateTokens(user);

    res.status(200).json({
      success: true,
      message:
        user.createdAt === user.updatedAt
          ? "Account created and login successful"
          : "Login successful",
      data: {
        user: cleanUserData(user),
        ...tokens,
        isNewUser: user.createdAt === user.updatedAt,
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
        content: "Your email address has been successfully verified!",
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

    // For passwordless accounts, don't auto-login - they need to use the login flow
    if (user.registrationMethod === "passwordless") {
      res.status(200).json({
        success: true,
        message:
          "Email verified successfully! You can now log in with your email.",
        data: {
          user: cleanUserData(updatedUser),
          requiresLogin: true,
          registrationMethod: user.registrationMethod,
        },
      });
    } else {
      // For password-based accounts, auto-login after verification
      const tokens = generateTokens(updatedUser);

      res.status(200).json({
        success: true,
        message: "Email verified successfully! Welcome to the platform.",
        data: {
          user: cleanUserData(updatedUser),
          ...tokens,
          loginMethod: "email_verification",
        },
      });
    }
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

    // Generate new verification token using JWT
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
    // Update user online status
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        isOnline: false,
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

// Forgot password
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

    if (!user) {
      // Don't reveal if email exists
      return res.status(200).json({
        success: true,
        message:
          "If this email is registered, you will receive a password reset link",
      });
    }

    // Generate reset token using JWT
    const resetToken = generatePasswordResetToken(user);
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(
        email,
        user.fullName || user.username,
        resetToken
      );
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      const error = new Error("Failed to send password reset email");
      error.statusCode = 500;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Password reset link has been sent to your email",
    });
  } catch (error) {
    next(error);
  }
};

// Reset password
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      const error = new Error(
        "Token, password, and confirmPassword are required"
      );
      error.statusCode = 400;
      return next(error);
    }

    if (password !== confirmPassword) {
      const error = new Error("Passwords do not match");
      error.statusCode = 400;
      return next(error);
    }

    if (password.length < 8) {
      const error = new Error("Password must be at least 8 characters long");
      error.statusCode = 400;
      return next(error);
    }

    // Verify the password reset token
    const decoded = verifyPasswordResetToken(token);

    if (!decoded) {
      const error = new Error("Invalid or expired reset token");
      error.statusCode = 400;
      return next(error);
    }

    // Find user with reset token
    const user = await prisma.user.findFirst({
      where: {
        email: decoded.email,
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
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

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Create security notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "PASSWORD_CHANGED",
        title: "Password Changed",
        content: "Your password has been successfully changed.",
      },
    });

    res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

// Setup 2FA
export const setup2FA = async (req, res, next) => {
  try {
    if (req.user.twoFactorEnabled) {
      const error = new Error("2FA is already enabled");
      error.statusCode = 400;
      return next(error);
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `NuttyFans (${req.user.email})`,
      issuer: "NuttyFans",
      length: 20,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Temporarily store secret (will be confirmed when user verifies)
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        twoFactorSecret: secret.base32,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes: [], // Will be generated after verification
      },
      message:
        "Scan the QR code with your authenticator app and verify to complete setup",
    });
  } catch (error) {
    next(error);
  }
};

// Verify and enable 2FA
export const enable2FA = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      const error = new Error("Verification token is required");
      error.statusCode = 400;
      return next(error);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user.twoFactorSecret) {
      const error = new Error("2FA setup not initiated");
      error.statusCode = 400;
      return next(error);
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 2,
    });

    if (!verified) {
      const error = new Error("Invalid verification token");
      error.statusCode = 400;
      return next(error);
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );

    // Enable 2FA
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        twoFactorEnabled: true,
        backupCodes,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        backupCodes,
      },
      message:
        "2FA has been successfully enabled. Save these backup codes in a safe place.",
    });
  } catch (error) {
    next(error);
  }
};

// Verify 2FA token
export const verify2FA = async (req, res, next) => {
  try {
    const { token, tempToken } = req.body;

    if (!token || !tempToken) {
      const error = new Error("Token and tempToken are required");
      error.statusCode = 400;
      return next(error);
    }

    // Verify temp token
    const tempDecoded = verifyRefreshToken(tempToken);
    if (!tempDecoded || !tempDecoded.temp) {
      const error = new Error("Invalid temporary token");
      error.statusCode = 401;
      return next(error);
    }

    const user = await prisma.user.findUnique({
      where: { id: tempDecoded.id },
      include: {
        profile: true,
      },
    });

    if (!user || !user.twoFactorEnabled) {
      const error = new Error("2FA not enabled for this user");
      error.statusCode = 400;
      return next(error);
    }

    // Verify 2FA token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 2,
    });

    // If TOTP failed, try backup codes
    let usedBackupCode = false;
    if (!verified && user.backupCodes.includes(token.toUpperCase())) {
      usedBackupCode = true;

      // Remove used backup code
      const updatedBackupCodes = user.backupCodes.filter(
        (code) => code !== token.toUpperCase()
      );

      await prisma.user.update({
        where: { id: user.id },
        data: {
          backupCodes: updatedBackupCodes,
        },
      });
    }

    if (!verified && !usedBackupCode) {
      const error = new Error("Invalid 2FA token");
      error.statusCode = 400;
      return next(error);
    }

    // Update user activity
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActiveAt: new Date(),
        isOnline: true,
      },
    });

    // Generate real tokens
    const tokens = generateTokens(user);

    res.status(200).json({
      success: true,
      message: usedBackupCode
        ? "Login successful (backup code used)"
        : "Login successful",
      data: {
        user: cleanUserData(user),
        ...tokens,
        backupCodesRemaining: usedBackupCode
          ? user.backupCodes.length - 1
          : user.backupCodes.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Google Auth URL
export const getGoogleAuthUrl = async (req, res, next) => {
  try {
    const authUrl = googleClient.generateAuthUrl({
      access_type: "offline",
      scope: ["profile", "email"],
      include_granted_scopes: true,
    });

    res.status(200).json({
      success: true,
      data: {
        authUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};
