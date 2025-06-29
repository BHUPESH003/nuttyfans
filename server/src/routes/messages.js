import express from "express";
import {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  markAllAsRead,
} from "../controllers/messageController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  uploadSingle,
  handleUploadError,
  setMediaQuality,
} from "../middlewares/upload.js";
import { validate } from "../utils/validation.js";
import { messageSchema } from "../utils/validation.js";

const router = express.Router();

router.post(
  "/",
  protect,
  uploadSingle("media"),
  handleUploadError,
  setMediaQuality("high"), // Default to high quality
  validate(messageSchema),
  sendMessage
);

router.get("/conversations", protect, getConversations);

router.get("/conversations/:userId", protect, getConversation);

router.put("/read/:messageId", protect, markAsRead);

router.put("/read-all/:userId", protect, markAllAsRead);

export default router;
