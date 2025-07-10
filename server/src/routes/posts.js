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

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management, likes, bookmarks, and comments
 */

// Base route: /api/posts

/**
 * @swagger
 * /api/posts/bookmarks:
 *   get:
 *     summary: Get user's bookmarked posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of posts per page
 *     responses:
 *       200:
 *         description: Bookmarked posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *                     pages:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/bookmarks", protect, getBookmarkedPosts);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: "My First Post"
 *               content:
 *                 type: string
 *                 example: "This is the content of my post"
 *               description:
 *                 type: string
 *                 example: "Brief description of the post"
 *               price:
 *                 type: number
 *                 example: 9.99
 *                 description: "Price for premium content"
 *               isPremium:
 *                 type: boolean
 *                 example: false
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: "Media files (max 5)"
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post created successfully"
 *                 post:
 *                   $ref: '#/components/schemas/Post'
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
