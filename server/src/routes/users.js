import express from "express";
import {
  getUserProfile,
  updateProfile,
  updatePassword,
  uploadAvatar,
  uploadCover,
  deleteAccount,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getCurrentUserProfile,
  getMyPosts,
  getMySubscribers,
  getMySubscriptions,
  getProfileStats,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../utils/validation.js";
import { updateUserSchema } from "../utils/validation.js";
import { uploadSingle, handleUploadError } from "../middlewares/upload.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Public routes
router.get("/:username", getUserProfile);

// Protected routes
router.put("/profile", protect, validate(updateUserSchema), updateProfile);
router.put("/password", protect, updatePassword);
router.post(
  "/avatar",
  protect,
  uploadSingle("avatar"),
  handleUploadError,
  uploadAvatar
);
router.post(
  "/cover",
  protect,
  uploadSingle("cover"),
  handleUploadError,
  uploadCover
);
router.delete("/account", protect, deleteAccount);

// Profile management routes
router.get("/me/profile", protect, getCurrentUserProfile);
router.get("/me/posts", protect, getMyPosts);
router.get("/me/subscribers", protect, getMySubscribers);
router.get("/me/subscriptions", protect, getMySubscriptions);
router.get("/me/stats", protect, getProfileStats);

router.get("/notifications", protect, getNotifications);
router.put("/notifications/:id/read", protect, markNotificationRead);
router.put("/notifications/read-all", protect, markAllNotificationsRead);

export default router;
