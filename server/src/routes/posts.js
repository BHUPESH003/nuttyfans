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
import multer from "multer";
import path from "path";

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/temp");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
  },
});

// Filter files by type
const fileFilter = (req, file, cb) => {
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "video/mp4",
    "audio/mpeg",
  ];
  if (validTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, MP4, and MP3 files are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter,
});

// Base route: /api/posts
router.post("/", protect, upload.array("files", 5), createPost);
router.get("/", getPosts);
router.get("/:id", getPost);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

// Like routes
router.post("/:id/like", protect, likePost);
router.delete("/:id/like", protect, unlikePost);

// Bookmark routes
router.post("/:id/bookmark", protect, bookmarkPost);
router.delete("/:id/bookmark", protect, unbookmarkPost);
router.get("/bookmarks", protect, getBookmarkedPosts);

// Comment routes
router.post("/:postId/comments", protect, createComment);
router.get("/:postId/comments", getComments);

// Media routes
router.post("/:id/media", protect, upload.array("files", 5), uploadMedia);
router.delete("/:id/media/:index", protect, deleteMedia);

export default router;
