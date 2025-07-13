import express from "express";
import {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  uploadCoverImage,
  deleteAvatar,
  deleteCoverImage,
  followUser,
  unfollowUser,
  getUserFollowers,
  getUserFollowing,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getCurrentUserProfile,
  getMyPosts,
  getMySubscribers,
  getMySubscriptions,
  getProfileStats,
  updatePassword,
  deleteAccount,
} from "../controllers/userController.js";
import {
  protect,
  requireVerifiedEmail,
  requireSelfOrAdmin,
  rateLimit,
} from "../middlewares/authMiddleware.js";
import { validate } from "../utils/validation.js";
import {
  updateUserProfileSchema,
  passwordUpdateSchema,
  followUserSchema,
} from "../utils/validation.js";
import {
  uploadSingle,
  handleUploadError,
  setMediaQuality,
} from "../middlewares/upload.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and profile endpoints
 */

// ==========================================
// PUBLIC ROUTES (No Authentication Required)
// ==========================================

/**
 * @swagger
 * /api/users/{username}:
 *   get:
 *     summary: Get user profile by username
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user
 *         example: "john_doe"
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     followersCount:
 *                       type: number
 *                     followingCount:
 *                       type: number
 *                     postsCount:
 *                       type: number
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:username", getUserProfile);

// Get user followers and following (public but may be limited based on privacy)
router.get("/:userId/followers", getUserFollowers);
router.get("/:userId/following", getUserFollowing);

// ==========================================
// PROTECTED ROUTES (Authentication Required)
// ==========================================

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 example: "John Doe Updated"
 *               bio:
 *                 type: string
 *                 example: "Updated bio about myself"
 *               website:
 *                 type: string
 *                 example: "https://johndoe.com"
 *               location:
 *                 type: string
 *                 example: "New York, USA"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/profile",
  protect,
  validate(updateUserProfileSchema),
  updateProfile
);

/**
 * @swagger
 * /api/users/me/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/me/profile", protect, getCurrentUserProfile);
router.get("/me/stats", protect, getProfileStats);

// Password management (for non-OAuth users)
router.put(
  "/password",
  protect,
  requireVerifiedEmail,
  rateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  validate(passwordUpdateSchema),
  updatePassword
);

// Avatar and cover image management
router.post(
  "/avatar",
  protect,
  uploadSingle("avatar"),
  setMediaQuality("high"),
  handleUploadError,
  uploadAvatar
);
router.delete("/avatar", protect, deleteAvatar);

router.post(
  "/cover",
  protect,
  uploadSingle("cover"),
  setMediaQuality("high"),
  handleUploadError,
  uploadCoverImage
);
router.delete("/cover", protect, deleteCoverImage);

// Social following system
router.post("/:userId/follow", protect, requireVerifiedEmail, followUser);
router.delete("/:userId/follow", protect, requireVerifiedEmail, unfollowUser);

// User content and subscriptions
router.get("/me/posts", protect, getMyPosts);
router.get("/me/subscribers", protect, getMySubscribers);
router.get("/me/subscriptions", protect, getMySubscriptions);

// Notifications
router.get("/notifications", protect, getNotifications);
router.put("/notifications/:id/read", protect, markNotificationRead);
router.put("/notifications/read-all", protect, markAllNotificationsRead);

// Account deletion
router.delete("/account", protect, deleteAccount);

export default router;
