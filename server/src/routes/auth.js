import express from "express";
import {
  register,
  login,
  refreshToken,
  getCurrentUser,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  googleLogin,
  getGoogleAuthUrl,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../utils/validation.js";
import { registerSchema, loginSchema } from "../utils/validation.js";

const router = express.Router();

// Public routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Email verification routes
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

// Google OAuth routes
router.get("/google/url", getGoogleAuthUrl);
router.post("/google/login", googleLogin);

// Protected routes
router.get("/me", protect, getCurrentUser);
router.post("/logout", protect, logout);

export default router;
