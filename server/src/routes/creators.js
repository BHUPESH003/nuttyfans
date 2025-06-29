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
import { protect, creator } from "../middlewares/authMiddleware.js";
import { validate } from "../utils/validation.js";
import { creatorProfileSchema } from "../utils/validation.js";

const router = express.Router();

// Public routes
router.get("/", getCreators);
router.get("/popular", getPopularCreators);
router.get("/verified", getVerifiedCreators);
router.get("/category/:categoryId", getCreatorsByCategory);
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
