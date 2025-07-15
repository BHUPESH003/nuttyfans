import express from "express";
import {
  register,
  login,
  verifyMagicLink,
  verifyEmail,
  resendVerificationEmail,
  refreshToken,
  getCurrentUser,
  logout,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../utils/validation.js";
import {
  registerSchema,
  loginSchema,
  magicLinkVerificationSchema,
  emailVerificationSchema,
  emailSchema,
  refreshTokenSchema,
} from "../utils/validation.js";

const router = express.Router();

// ==========================================
// PUBLIC AUTH ROUTES (Passwordless)
// ==========================================

// Register new user (email only)
router.post("/register", validate(registerSchema), register);

// Request login link (email only)
router.post("/login", validate(loginSchema), login);

// Verify magic link and complete login
router.post(
  "/verify-magic-link",
  validate(magicLinkVerificationSchema),
  verifyMagicLink
);

// Verify email
router.post("/verify-email", validate(emailVerificationSchema), verifyEmail);

// Resend verification email
router.post(
  "/resend-verification",
  validate(emailSchema),
  resendVerificationEmail
);

// Refresh access token
router.post("/refresh-token", validate(refreshTokenSchema), refreshToken);

// ==========================================
// PROTECTED AUTH ROUTES
// ==========================================

// Get current user
router.get("/me", protect, getCurrentUser);

// Logout
router.post("/logout", protect, logout);

export default router;
