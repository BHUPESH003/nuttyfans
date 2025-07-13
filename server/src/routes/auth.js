import express from "express";
import {
  register,
  login,
  passwordLogin,
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
  sendMagicLink,
  verifyMagicLink,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../utils/validation.js";
import {
  registerSchema,
  loginSchema,
  passwordLoginSchema,
  emailSchema,
  otpVerificationSchema,
  googleLoginSchema,
  emailVerificationSchema,
  refreshTokenSchema,
  passwordResetSchema,
  newPasswordSchema,
  twoFactorSetupSchema,
  twoFactorVerificationSchema,
  magicLinkLoginSchema,
  loginVerificationSchema,
} from "../utils/validation.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization endpoints
 */

// ==========================================
// PUBLIC ROUTES (No Authentication Required)
// ==========================================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               displayName:
 *                 type: string
 *                 example: "John Doe"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/register", validate(registerSchema), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Passwordless login - initiate login process
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *     responses:
 *       200:
 *         description: Login code sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login code sent to your email"
 *                 data:
 *                   type: object
 *                   properties:
 *                     loginMethod:
 *                       type: string
 *                       example: "email"
 *                     sentTo:
 *                       type: string
 *                       example: "john@example.com"
 *                     expiresIn:
 *                       type: string
 *                       example: "10 minutes"
 *       403:
 *         description: Account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", validate(loginSchema), login);

/**
 * @swagger
 * /api/auth/password-login:
 *   post:
 *     summary: Legacy password-based login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     loginMethod:
 *                       type: string
 *                       example: "password"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/password-login", validate(passwordLoginSchema), passwordLogin);

/**
 * @swagger
 * /api/auth/request-otp:
 *   post:
 *     summary: Request OTP for passwordless login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP sent to your email"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/request-otp", validate(emailSchema), requestLoginOTP);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP for passwordless login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/verify-otp", validate(otpVerificationSchema), verifyLoginOTP);

/**
 * @swagger
 * /api/auth/google/url:
 *   get:
 *     summary: Get Google OAuth authorization URL
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Google OAuth URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: "https://accounts.google.com/oauth/authorize?..."
 */
router.get("/google/url", getGoogleAuthUrl);

/**
 * @swagger
 * /api/auth/google/login:
 *   post:
 *     summary: Login with Google OAuth
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: string
 *                 description: Google OAuth credential token
 *                 example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Google login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Google login successful"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid Google credential
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/me", protect, getCurrentUser);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/logout", protect, logout);

// Two-Factor Authentication management
router.post("/2fa/setup", protect, setup2FA);
router.post("/2fa/enable", protect, validate(twoFactorSetupSchema), enable2FA);

export default router;
