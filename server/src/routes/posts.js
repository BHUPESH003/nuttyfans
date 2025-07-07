import express from "express";
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  uploadMedia,
  deleteMedia,
  bookmarkPost,
  unbookmarkPost,
  getBookmarkedPosts,
} from "../controllers/postController.js";
import {
  createComment,
  getComments,
} from "../controllers/commentController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  uploadMultiple,
  handleUploadError,
  setMediaQuality,
} from "../middlewares/upload.js";

const router = express.Router();

// Base route: /api/posts

// Bookmarks routes (should be before parameterized routes)
router.get("/bookmarks", protect, getBookmarkedPosts);

// Post CRUD routes
router.post(
  "/",
  protect,
  uploadMultiple("files", 5),
  handleUploadError,
  setMediaQuality("high"),
  createPost
);
router.get("/", getPosts);
router.get("/:id", getPost);
router.put(
  "/:id",
  protect,
  uploadMultiple("files", 5),
  handleUploadError,
  setMediaQuality("high"),
  updatePost
);
router.delete("/:id", protect, deletePost);

// Like routes
router.post("/:id/like", protect, likePost);
router.delete("/:id/like", protect, unlikePost);

// Bookmark routes (for specific posts)
router.post("/:id/bookmark", protect, bookmarkPost);
router.delete("/:id/bookmark", protect, unbookmarkPost);

// Comment routes
router.post("/:postId/comments", protect, createComment);
router.get("/:postId/comments", getComments);

// Media routes (for post-specific media management)
router.post(
  "/:id/media",
  protect,
  uploadMultiple("files", 5),
  handleUploadError,
  setMediaQuality("high"),
  uploadMedia
);
router.delete("/:id/media/:index", protect, deleteMedia);

export default router;
