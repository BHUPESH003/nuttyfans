import express from "express";
import {
  createSquareCustomer,
  createPayment,
  getPaymentHistory,
  getWalletBalance,
  handleWebhook,
} from "../controllers/squarePaymentController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Base route: /api/payments

// Square Payment Routes
router.post("/customer", protect, createSquareCustomer);
router.post("/create", protect, createPayment);
router.get("/history", protect, getPaymentHistory);
router.get("/wallet", protect, getWalletBalance);

// Webhook for Square payments
router.post("/webhook", handleWebhook);

export default router;
