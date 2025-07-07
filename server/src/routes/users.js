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
import { protect } from "../middlewares/authMiddleware.js";
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

// ==========================================
// PUBLIC ROUTES (No Authentication Required)
// ==========================================

// Get user profile by username
router.get("/:username", getUserProfile);

// Get user followers and following (public but may be limited based on privacy)
router.get("/:userId/followers", getUserFollowers);
router.get("/:userId/following", getUserFollowing);

// ==========================================
// PROTECTED ROUTES (Authentication Required)
// ==========================================

// Profile management
router.put(
  "/profile",
  protect,
  validate(updateUserProfileSchema),
  updateProfile
);
router.get("/me/profile", protect, getCurrentUserProfile);
router.get("/me/stats", protect, getProfileStats);

// Password management (for non-OAuth users)
router.put(
  "/password",
  protect,
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
router.post("/:userId/follow", protect, followUser);
router.delete("/:userId/follow", protect, unfollowUser);

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
