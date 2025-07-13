import express from "express";
import {
  becomeCreator,
  updateCreatorProfile,
  getCreators,
  getCreatorStats,
  getCreatorProfile,
  getCreatorsByCategory,
  getPopularCreators,
  getVerifiedCreators,
} from "../controllers/creatorController.js";
import {
  protect,
  requireCreator,
  requireVerifiedEmail,
  optionalAuth,
} from "../middlewares/authMiddleware.js";
import { validate } from "../utils/validation.js";
import { creatorProfileSchema } from "../utils/validation.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Creators
 *   description: Creator management and discovery endpoints
 */

/**
 * @swagger
 * /api/creators:
 *   get:
 *     summary: Get all creators with pagination and filters
 *     tags: [Creators]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of creators per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *         description: Filter verified creators only
 *     responses:
 *       200:
 *         description: Creators retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 creators:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Creator'
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
 */
router.get("/", getCreators);

/**
 * @swagger
 * /api/creators/popular:
 *   get:
 *     summary: Get popular creators
 *     tags: [Creators]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of creators to return
 *     responses:
 *       200:
 *         description: Popular creators retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 creators:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Creator'
 */
router.get("/popular", getPopularCreators);

/**
 * @swagger
 * /api/creators/verified:
 *   get:
 *     summary: Get verified creators
 *     tags: [Creators]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of creators to return
 *     responses:
 *       200:
 *         description: Verified creators retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 creators:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Creator'
 */
router.get("/verified", getVerifiedCreators);

/**
 * @swagger
 * /api/creators/category/{categoryId}:
 *   get:
 *     summary: Get creators by category
 *     tags: [Creators]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of creators per page
 *     responses:
 *       200:
 *         description: Creators in category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 creators:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Creator'
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/category/:categoryId", getCreatorsByCategory);

/**
 * @swagger
 * /api/creators/{username}:
 *   get:
 *     summary: Get creator profile by username
 *     tags: [Creators]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Creator username
 *         example: "jane_creator"
 *     responses:
 *       200:
 *         description: Creator profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 creator:
 *                   $ref: '#/components/schemas/Creator'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     subscribersCount:
 *                       type: number
 *                     postsCount:
 *                       type: number
 *                     totalEarnings:
 *                       type: number
 *       404:
 *         description: Creator not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:username", getCreatorProfile);

// Protected routes
router.post("/", protect, validate(creatorProfileSchema), becomeCreator);
router.put(
  "/",
  protect,
  creator,
  validate(creatorProfileSchema),
  updateCreatorProfile
);

router.get("/stats", protect, creator, getCreatorStats);

export default router;
