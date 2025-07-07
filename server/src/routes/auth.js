import express from "express";
import {
  register,
  login,
  requestLoginOTP,
  verifyLoginOTP,
  googleLogin,
  verifyEmail,
  resendVerificationEmail,
  refreshToken,
  getCurrentUser,
  logout,
  forgotPassword,
  resetPassword,
  setup2FA,
  enable2FA,
  verify2FA,
  getGoogleAuthUrl,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../utils/validation.js";
import {
  registerSchema,
  loginSchema,
  emailSchema,
  otpVerificationSchema,
  googleLoginSchema,
  emailVerificationSchema,
  refreshTokenSchema,
  passwordResetSchema,
  newPasswordSchema,
  twoFactorSetupSchema,
  twoFactorVerificationSchema,
} from "../utils/validation.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (No Authentication Required)
// ==========================================

// Registration and Login
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// OTP-based passwordless authentication
router.post("/request-otp", validate(emailSchema), requestLoginOTP);
router.post("/verify-otp", validate(otpVerificationSchema), verifyLoginOTP);

// Google OAuth
router.get("/google/url", getGoogleAuthUrl);
router.post("/google/login", validate(googleLoginSchema), googleLogin);

// Email verification
router.post("/verify-email", validate(emailVerificationSchema), verifyEmail);
router.post(
  "/resend-verification",
  validate(emailSchema),
  resendVerificationEmail
);

// Password reset
router.post("/forgot-password", validate(emailSchema), forgotPassword);
router.post("/reset-password", validate(newPasswordSchema), resetPassword);

// Token refresh
router.post("/refresh-token", validate(refreshTokenSchema), refreshToken);

// Two-Factor Authentication verification (used during login)
router.post("/verify-2fa", validate(twoFactorVerificationSchema), verify2FA);

// ==========================================
// PROTECTED ROUTES (Authentication Required)
// ==========================================

// User info and session management
router.get("/me", protect, getCurrentUser);
router.post("/logout", protect, logout);

// Two-Factor Authentication management
router.post("/2fa/setup", protect, setup2FA);
router.post("/2fa/enable", protect, validate(twoFactorSetupSchema), enable2FA);

export default router;
