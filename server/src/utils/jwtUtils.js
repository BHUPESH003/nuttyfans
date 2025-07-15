import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../config/env.js";

/**
 * Generate secure random string for token ID
 * @returns {string} - Random string
 */
const generateTokenId = () => {
  return crypto.randomBytes(16).toString("hex");
};

/**
 * Generate access token with comprehensive user information
 * @param {object} user - User object from database
 * @param {object} options - Token options
 * @returns {string} - JWT access token
 */
export const generateAccessToken = (user, options = {}) => {
  const {
    temp = false,
    purpose = "access",
    expiresIn = config.JWT_EXPIRY,
  } = options;

  const payload = {
    sub: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    jti: generateTokenId(),
    iat: Math.floor(Date.now() / 1000),
    type: "access",
    purpose,
    temp,
  };

  // Add creator info if user is a creator
  if (user.profile && user.profile.isCreator) {
    payload.isCreator = true;
    payload.creatorId = user.profile.id;
    payload.isVerified = user.profile.isVerified;
  }

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: temp ? "10m" : expiresIn, // Temporary tokens expire in 10 minutes
    issuer: "nuttyfans-api",
    audience: "nuttyfans-client",
  });
};

/**
 * Generate refresh token
 * @param {object} user - User object from database
 * @returns {string} - JWT refresh token
 */
export const generateRefreshToken = (user) => {
  const payload = {
    sub: user.id,
    jti: generateTokenId(),
    iat: Math.floor(Date.now() / 1000),
    type: "refresh",
    tokenFamily: crypto.randomBytes(16).toString("hex"), // For token family validation
  };

  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRY,
    issuer: "nuttyfans-api",
    audience: "nuttyfans-client",
  });
};

/**
 * Generate OTP token for passwordless login
 * @param {object} user - User object from database
 * @returns {string} - JWT OTP token
 */
export const generateOTPToken = (user) => {
  const payload = {
    sub: user.id,
    email: user.email,
    type: "otp",
    jti: generateTokenId(),
    iat: Math.floor(Date.now() / 1000),
    purpose: "login",
  };

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: "10m", // OTP tokens expire in 10 minutes
    issuer: "nuttyfans-api",
    audience: "nuttyfans-client",
  });
};

/**
 * Generate email verification token
 * @param {object} user - User object from database
 * @returns {string} - JWT email verification token
 */
export const generateEmailVerificationToken = (user) => {
  const payload = {
    sub: user.id,
    email: user.email,
    type: "email_verification",
    jti: generateTokenId(),
    iat: Math.floor(Date.now() / 1000),
    purpose: "verify_email",
  };

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: "24h", // Email verification tokens expire in 24 hours
    issuer: "nuttyfans-api",
    audience: "nuttyfans-client",
  });
};

/**
 * Generate password reset token
 * @param {object} user - User object from database
 * @returns {string} - JWT password reset token
 */
export const generatePasswordResetToken = (user) => {
  const payload = {
    sub: user.id,
    email: user.email,
    type: "password_reset",
    jti: generateTokenId(),
    iat: Math.floor(Date.now() / 1000),
    purpose: "reset_password",
  };

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: "1h", // Password reset tokens expire in 1 hour
    issuer: "nuttyfans-api",
    audience: "nuttyfans-client",
  });
};

/**
 * Generate magic link token for passwordless authentication
 * @param {object} user - User object from database
 * @returns {string} - JWT magic link token
 */
export const generateMagicLinkToken = (user) => {
  const payload = {
    sub: user.id,
    email: user.email,
    type: "magic_link",
    jti: generateTokenId(),
    iat: Math.floor(Date.now() / 1000),
    purpose: "magic_link_login",
  };

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: "15m", // Magic link tokens expire in 15 minutes
    issuer: "nuttyfans-api",
    audience: "nuttyfans-client",
  });
};

/**
 * Generate temporary token for 2FA verification
 * @param {object} user - User object from database
 * @returns {string} - JWT temporary token
 */
export const generateTempToken = (user) => {
  return generateAccessToken(user, { temp: true, purpose: "2fa_verification" });
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @param {string} secret - Secret to use for verification
 * @returns {object|null} - Decoded token payload or null if invalid
 */
export const verifyToken = (token, secret = config.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret, {
      issuer: "nuttyfans-api",
      audience: "nuttyfans-client",
    });
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
};

/**
 * Verify refresh token specifically
 * @param {string} token - Refresh token to verify
 * @returns {object|null} - Decoded token payload or null if invalid
 */
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET, {
      issuer: "nuttyfans-api",
      audience: "nuttyfans-client",
    });

    // Ensure it's actually a refresh token
    if (decoded.type !== "refresh") {
      throw new Error("Invalid token type");
    }

    return decoded;
  } catch (error) {
    console.error("Refresh token verification failed:", error.message);
    return null;
  }
};

/**
 * Verify OTP token specifically
 * @param {string} token - OTP token to verify
 * @returns {object|null} - Decoded token payload or null if invalid
 */
export const verifyOTPToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: "nuttyfans-api",
      audience: "nuttyfans-client",
    });

    // Ensure it's actually an OTP token
    if (decoded.type !== "otp") {
      throw new Error("Invalid token type");
    }

    return decoded;
  } catch (error) {
    console.error("OTP token verification failed:", error.message);
    return null;
  }
};

/**
 * Verify email verification token specifically
 * @param {string} token - Email verification token to verify
 * @returns {object|null} - Decoded token payload or null if invalid
 */
export const verifyEmailVerificationToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: "nuttyfans-api",
      audience: "nuttyfans-client",
    });

    // Ensure it's actually an email verification token
    if (decoded.type !== "email_verification") {
      throw new Error("Invalid token type");
    }

    return decoded;
  } catch (error) {
    console.error(
      "Email verification token verification failed:",
      error.message
    );
    return null;
  }
};

/**
 * Verify password reset token specifically
 * @param {string} token - Password reset token to verify
 * @returns {object|null} - Decoded token payload or null if invalid
 */
export const verifyPasswordResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: "nuttyfans-api",
      audience: "nuttyfans-client",
    });

    // Ensure it's actually a password reset token
    if (decoded.type !== "password_reset") {
      throw new Error("Invalid token type");
    }

    return decoded;
  } catch (error) {
    console.error("Password reset token verification failed:", error.message);
    return null;
  }
};

/**
 * Verify magic link token specifically
 * @param {string} token - Magic link token to verify
 * @returns {object|null} - Decoded token payload or null if invalid
 */
export const verifyMagicLinkToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: "nuttyfans-api",
      audience: "nuttyfans-client",
    });

    // Ensure it's actually a magic link token
    if (decoded.type !== "magic_link") {
      throw new Error("Invalid token type");
    }

    return decoded;
  } catch (error) {
    console.error("Magic link token verification failed:", error.message);
    return null;
  }
};

/**
 * Decode JWT token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {object|null} - Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error("Token decoding failed:", error.message);
    return null;
  }
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {number|null} - Expiration timestamp or null if invalid
 */
export const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded ? decoded.exp : null;
  } catch (error) {
    console.error("Failed to get token expiration:", error.message);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if expired, false otherwise
 */
export const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;

    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    console.error("Failed to check token expiration:", error.message);
    return true;
  }
};

/**
 * Generate both access and refresh tokens
 * @param {object} user - User object from database
 * @param {object} options - Token options
 * @returns {object} - Object containing both tokens and metadata
 */
export const generateTokens = (user, options = {}) => {
  const accessToken = generateAccessToken(user, options);
  const refreshToken = generateRefreshToken(user);

  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn: config.JWT_EXPIRY,
    expiresAt: Math.floor(Date.now() / 1000) + config.JWT_EXPIRY,
    refreshExpiresIn: config.JWT_REFRESH_EXPIRY,
    refreshExpiresAt: Math.floor(Date.now() / 1000) + config.JWT_REFRESH_EXPIRY,
  };
};

/**
 * Create token response object for API responses
 * @param {object} user - User object from database
 * @param {object} tokens - Token object from generateTokens
 * @returns {object} - Formatted token response
 */
export const createTokenResponse = (user, tokens) => {
  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      profile: user.profile,
    },
    tokens,
    loginMethod: "email", // This can be updated based on login method
    loginAt: new Date().toISOString(),
  };
};

/**
 * Revoke token (for logout functionality)
 * Note: This is a placeholder for future implementation with token blacklisting
 * @param {string} token - Token to revoke
 * @returns {boolean} - Success status
 */
export const revokeToken = (token) => {
  // TODO: Implement token blacklisting with Redis or database
  console.log("Token revoked:", token.substring(0, 20) + "...");
  return true;
};

/**
 * Clean sensitive data from user object for token payload
 * @param {object} user - User object from database
 * @returns {object} - Cleaned user object
 */
export const cleanUserDataForToken = (user) => {
  const {
    password,
    otpToken,
    otpExpires,
    emailVerificationToken,
    emailVerificationExpires,
    passwordResetToken,
    passwordResetExpires,
    twoFactorSecret,
    backupCodes,
    googleId,
    squareCustomerId,
    ...cleanUser
  } = user;

  return cleanUser;
};
