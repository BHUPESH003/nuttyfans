import express from "express";
import {
  subscribeToCreator,
  getUserSubscriptions,
  getCreatorSubscribers,
  cancelSubscription,
} from "../controllers/subscriptionController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Base route: /api/subscriptions
router.post("/", protect, subscribeToCreator);
router.get("/", protect, getUserSubscriptions);
router.get("/subscribers", protect, getCreatorSubscribers);
router.delete("/:id", protect, cancelSubscription);

export default router;
