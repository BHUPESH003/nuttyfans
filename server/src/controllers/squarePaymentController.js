import prisma from "../config/prisma.js";
import {
  paymentsApi,
  customersApi,
  refundsApi,
  formatMoney,
  formatMoneyFromSquare,
  handleSquareError,
} from "../config/square.js";
import { config } from "../config/env.js";
import crypto from "crypto";

/**
 * Create a Square customer for the user
 */
export const createSquareCustomer = async (req, res, next) => {
  try {
    const user = req.user;

    // Check if user already has a Square customer ID
    if (user.squareCustomerId) {
      return res.status(200).json({
        success: true,
        data: { customerId: user.squareCustomerId },
        message: "Customer already exists",
      });
    }

    // Create Square customer
    const createCustomerRequest = {
      givenName: user.fullName?.split(" ")[0] || user.username,
      familyName: user.fullName?.split(" ").slice(1).join(" ") || "",
      emailAddress: user.email,
      referenceId: user.id,
    };

    const response = await customersApi.createCustomer(createCustomerRequest);

    if (response.result.errors) {
      throw new Error(
        `Square Customer Creation Error: ${response.result.errors
          .map((e) => e.detail)
          .join(", ")}`
      );
    }

    const customer = response.result.customer;

    // Update user with Square customer ID
    await prisma.user.update({
      where: { id: user.id },
      data: { squareCustomerId: customer.id },
    });

    res.status(201).json({
      success: true,
      data: { customerId: customer.id },
      message: "Square customer created successfully",
    });
  } catch (error) {
    handleSquareError(error);
    next(error);
  }
};

/**
 * Create a payment for content purchase
 */
export const createPayment = async (req, res, next) => {
  try {
    const { amount, sourceId, postId, description } = req.body;

    if (!amount || !sourceId) {
      const error = new Error("Amount and payment source are required");
      error.statusCode = 400;
      return next(error);
    }

    // Validate post if postId is provided
    let post = null;
    if (postId) {
      post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          user: {
            include: { profile: true },
          },
        },
      });

      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        return next(error);
      }

      // Check if user is trying to buy their own content
      if (post.userId === req.user.id) {
        const error = new Error("You cannot purchase your own content");
        error.statusCode = 400;
        return next(error);
      }

      // Check if already purchased
      const existingPurchase = await prisma.purchase.findFirst({
        where: {
          userId: req.user.id,
          postId: postId,
          status: "COMPLETED",
        },
      });

      if (existingPurchase) {
        const error = new Error("You have already purchased this content");
        error.statusCode = 400;
        return next(error);
      }
    }

    // Calculate platform fee
    const platformFeePercent = config.PLATFORM_FEE_PERCENTAGE;
    const platformFee = (amount * platformFeePercent) / 100;
    const creatorAmount = amount - platformFee;

    // Create payment request
    const paymentRequest = {
      sourceId: sourceId,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: formatMoney(amount),
      appFeeMoney: formatMoney(platformFee),
      note: description || "Content purchase",
      referenceId: postId || req.user.id,
    };

    // Create payment
    const response = await paymentsApi.createPayment(paymentRequest);

    if (response.result.errors) {
      throw new Error(
        `Payment Error: ${response.result.errors
          .map((e) => e.detail)
          .join(", ")}`
      );
    }

    const payment = response.result.payment;

    // Create purchase record if for a post
    if (postId && post) {
      await prisma.purchase.create({
        data: {
          userId: req.user.id,
          postId: postId,
          amount: amount,
          squarePaymentId: payment.id,
          status: payment.status === "COMPLETED" ? "COMPLETED" : "PENDING",
        },
      });

      // Create wallet transactions
      await Promise.all([
        // Payment transaction for buyer
        prisma.walletTransaction.create({
          data: {
            userId: req.user.id,
            amount: -amount,
            type: "CONTENT_PURCHASE_PAYMENT",
            status: "COMPLETED",
            squarePaymentId: payment.id,
            description: `Purchase: ${post.title || "Content"}`,
          },
        }),
        // Earning transaction for creator
        prisma.walletTransaction.create({
          data: {
            userId: post.userId,
            amount: creatorAmount,
            type: "CONTENT_PURCHASE_EARNING",
            status: "COMPLETED",
            squarePaymentId: payment.id,
            description: `Earning from: ${post.title || "Content"}`,
          },
        }),
      ]);

      // Create notification for creator
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: "NEW_PURCHASE",
          title: "New Purchase",
          content: `${req.user.username} purchased your content`,
          relatedId: postId,
          relatedType: "Post",
        },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        paymentId: payment.id,
        status: payment.status,
        amount: formatMoneyFromSquare(payment.amountMoney),
      },
      message: "Payment processed successfully",
    });
  } catch (error) {
    console.error("Square payment error:", error);
    next(error);
  }
};

/**
 * Create a subscription payment
 */
export const createSubscriptionPayment = async (req, res, next) => {
  try {
    const { creatorId, sourceId } = req.body;

    if (!creatorId || !sourceId) {
      const error = new Error("Creator ID and payment source are required");
      error.statusCode = 400;
      return next(error);
    }

    // Get creator profile
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      include: { profile: true },
    });

    if (!creator || !creator.profile) {
      const error = new Error("Creator not found");
      error.statusCode = 404;
      return next(error);
    }

    // Check if user is trying to subscribe to themselves
    if (creatorId === req.user.id) {
      const error = new Error("You cannot subscribe to yourself");
      error.statusCode = 400;
      return next(error);
    }

    // Check for existing active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        subscriberId: req.user.id,
        creatorId: creatorId,
        status: "ACTIVE",
        currentPeriodEnd: { gte: new Date() },
      },
    });

    if (existingSubscription) {
      const error = new Error("You are already subscribed to this creator");
      error.statusCode = 400;
      return next(error);
    }

    const monthlyPrice = creator.profile.monthlyPrice;
    const platformFeePercent = config.PLATFORM_FEE_PERCENTAGE;
    const platformFee = (monthlyPrice * platformFeePercent) / 100;
    const creatorAmount = monthlyPrice - platformFee;

    // Create payment for subscription
    const paymentRequest = {
      sourceId: sourceId,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: formatMoney(monthlyPrice),
      appFeeMoney: formatMoney(platformFee),
      note: `Monthly subscription to ${creator.username}`,
      referenceId: `sub_${req.user.id}_${creatorId}`,
    };

    const response = await paymentsApi.createPayment(paymentRequest);

    if (response.result.errors) {
      throw new Error(
        `Subscription Payment Error: ${response.result.errors
          .map((e) => e.detail)
          .join(", ")}`
      );
    }

    const payment = response.result.payment;

    // Create subscription record
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        subscriberId: req.user.id,
        creatorId: creatorId,
        status: payment.status === "COMPLETED" ? "ACTIVE" : "PENDING",
        squarePaymentId: payment.id,
        currentPeriodStart,
        currentPeriodEnd,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Create wallet transactions
    await Promise.all([
      // Payment transaction for subscriber
      prisma.walletTransaction.create({
        data: {
          userId: req.user.id,
          amount: -monthlyPrice,
          type: "SUBSCRIPTION_PAYMENT",
          status: "COMPLETED",
          squarePaymentId: payment.id,
          description: `Subscription to ${creator.username}`,
        },
      }),
      // Earning transaction for creator
      prisma.walletTransaction.create({
        data: {
          userId: creatorId,
          amount: creatorAmount,
          type: "SUBSCRIPTION_EARNING",
          status: "COMPLETED",
          squarePaymentId: payment.id,
          description: `Subscription from ${req.user.username}`,
        },
      }),
    ]);

    // Create notifications
    await prisma.notification.create({
      data: {
        userId: creatorId,
        type: "NEW_SUBSCRIBER",
        title: "New Subscriber",
        content: `${req.user.username} has subscribed to your content`,
        relatedId: req.user.id,
        relatedType: "User",
      },
    });

    res.status(201).json({
      success: true,
      data: subscription,
      message: "Subscription created successfully",
    });
  } catch (error) {
    console.error("Square subscription error:", error);
    next(error);
  }
};

/**
 * Get payment history for user
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type = "all" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.user.id };

    if (type !== "all") {
      where.type = type.toUpperCase();
    }

    const transactions = await prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    const totalCount = await prisma.walletTransaction.count({ where });

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process refund
 */
export const processRefund = async (req, res, next) => {
  try {
    const { paymentId, amount, reason } = req.body;

    if (!paymentId) {
      const error = new Error("Payment ID is required");
      error.statusCode = 400;
      return next(error);
    }

    // Find the payment in our database
    const purchase = await prisma.purchase.findFirst({
      where: {
        squarePaymentId: paymentId,
        userId: req.user.id,
      },
      include: { post: true },
    });

    if (!purchase) {
      const error = new Error("Payment not found");
      error.statusCode = 404;
      return next(error);
    }

    // Create refund request
    const refundRequest = {
      idempotencyKey: crypto.randomUUID(),
      amountMoney: amount ? formatMoney(amount) : formatMoney(purchase.amount),
      paymentId: paymentId,
      reason: reason || "Customer requested refund",
    };

    const response = await refundsApi.refundPayment(refundRequest);

    if (response.result.errors) {
      throw new Error(
        `Refund Error: ${response.result.errors
          .map((e) => e.detail)
          .join(", ")}`
      );
    }

    const refund = response.result.refund;

    // Update purchase status
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { status: "REFUNDED" },
    });

    // Create refund transaction
    await prisma.walletTransaction.create({
      data: {
        userId: req.user.id,
        amount: formatMoneyFromSquare(refund.amountMoney),
        type: "REFUND",
        status: "COMPLETED",
        squarePaymentId: refund.id,
        description: `Refund for: ${purchase.post?.title || "Content"}`,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        refundId: refund.id,
        status: refund.status,
        amount: formatMoneyFromSquare(refund.amountMoney),
      },
      message: "Refund processed successfully",
    });
  } catch (error) {
    console.error("Square refund error:", error);
    next(error);
  }
};

/**
 * Get wallet balance
 */
export const getWalletBalance = async (req, res, next) => {
  try {
    const balance = await prisma.walletTransaction.aggregate({
      where: {
        userId: req.user.id,
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    });

    const earnings = await prisma.walletTransaction.aggregate({
      where: {
        userId: req.user.id,
        status: "COMPLETED",
        type: {
          in: ["SUBSCRIPTION_EARNING", "CONTENT_PURCHASE_EARNING"],
        },
      },
      _sum: {
        amount: true,
      },
    });

    const spending = await prisma.walletTransaction.aggregate({
      where: {
        userId: req.user.id,
        status: "COMPLETED",
        type: {
          in: ["SUBSCRIPTION_PAYMENT", "CONTENT_PURCHASE_PAYMENT"],
        },
      },
      _sum: {
        amount: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalBalance: balance._sum.amount || 0,
        totalEarnings: earnings._sum.amount || 0,
        totalSpending: Math.abs(spending._sum.amount || 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Square webhook handler
 */
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-square-signature"];
    const body = req.body;

    // For production, implement proper signature verification
    // const isValid = verifyWebhookSignature(body, signature);
    // if (!isValid) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    const { type, data } = body;

    switch (type) {
      case "payment.updated":
        await handlePaymentUpdated(data.object.payment);
        break;
      case "refund.updated":
        await handleRefundUpdated(data.object.refund);
        break;
      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

// Helper functions for webhook processing
const handlePaymentUpdated = async (payment) => {
  const { id, status } = payment;

  // Update purchase status based on payment status
  await prisma.purchase.updateMany({
    where: { squarePaymentId: id },
    data: {
      status:
        status === "COMPLETED"
          ? "COMPLETED"
          : status === "FAILED"
          ? "FAILED"
          : "PENDING",
    },
  });

  // Update subscription status if it's a subscription payment
  await prisma.subscription.updateMany({
    where: { squarePaymentId: id },
    data: {
      status:
        status === "COMPLETED"
          ? "ACTIVE"
          : status === "FAILED"
          ? "PAST_DUE"
          : "ACTIVE",
    },
  });
};

const handleRefundUpdated = async (refund) => {
  const { id, status, payment_id } = refund;

  if (status === "COMPLETED") {
    // Update purchase to refunded
    await prisma.purchase.updateMany({
      where: { squarePaymentId: payment_id },
      data: { status: "REFUNDED" },
    });
  }
};
