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

router.post("/presigned-url", protect, getPresignedUrl);

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
