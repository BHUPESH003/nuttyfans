import express from "express";
import {
    searchAll,
    searchUsers,
    searchPosts,
    searchCategories,
    getTrendingSearches,
    getSearchSuggestions,
} from "../controllers/searchController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Base route: /api/search
router.get("/", searchAll);
router.get("/users", searchUsers);
router.get("/posts", searchPosts);
router.get("/categories", searchCategories);
router.get("/trending", getTrendingSearches);
router.get("/suggestions", protect, getSearchSuggestions);

export default router;
