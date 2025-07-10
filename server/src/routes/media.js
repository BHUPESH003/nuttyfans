import express from "express";
import {
  getPresignedUrl,
  confirmMediaUpload,
  uploadMedia,
  updateMedia,
  deleteMedia,
  getUserMedia,
  getMediaDetails,
  getFailedUploads,
  cleanupOrphanedMedia,
} from "../controllers/mediaController.js";
import { protect, admin } from "../middlewares/authMiddleware.js";
import {
  uploadSingle,
  handleUploadError,
  setMediaQuality,
} from "../middlewares/upload.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Media upload and management endpoints
 */

/**
 * @swagger
 * /api/media/presigned-url:
 *   post:
 *     summary: Get presigned URL for direct S3 upload
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - contentType
 *             properties:
 *               filename:
 *                 type: string
 *                 example: "my-video.mp4"
 *               contentType:
 *                 type: string
 *                 example: "video/mp4"
 *               size:
 *                 type: number
 *                 example: 1048576
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploadUrl:
 *                   type: string
 *                   example: "https://s3.amazonaws.com/bucket/file?..."
 *                 mediaId:
 *                   type: string
 *                   example: "media-id-123"
 *                 fields:
 *                   type: object
 *                   description: "Form fields for multipart upload"
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
router.post("/presigned-url", protect, getPresignedUrl);

/**
 * @swagger
 * /api/media/{mediaId}/confirm:
 *   put:
 *     summary: Confirm media upload completion
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID to confirm
 *     responses:
 *       200:
 *         description: Media upload confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Media upload confirmed"
 *                 media:
 *                   $ref: '#/components/schemas/Media'
 *       404:
 *         description: Media not found
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
router.put("/:mediaId/confirm", protect, confirmMediaUpload);

router.post(
  "/upload",
  protect,
  uploadSingle("file"),
  handleUploadError,
  setMediaQuality("high"), // Default to high quality
  uploadMedia
);

router.put(
  "/:mediaId",
  protect,
  uploadSingle("file"),
  handleUploadError,
  setMediaQuality("high"),
  updateMedia
);

router.delete("/:mediaId", protect, deleteMedia);

router.get("/", protect, getUserMedia);

router.get("/:mediaId", protect, getMediaDetails);

/**
 * Admin routes
 */

router.get("/admin/failed", protect, admin, getFailedUploads);

router.delete("/admin/cleanup", protect, admin, cleanupOrphanedMedia);

export default router;
