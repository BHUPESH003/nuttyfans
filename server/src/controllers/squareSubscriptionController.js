import prisma from "../config/prisma.js";
import {
  paymentsApi,
  customersApi,
  formatMoney,
  formatMoneyFromSquare,
  handleSquareError,
  SQUARE_CONFIG,
} from "../config/square.js";
import { config } from "../config/env.js";
import crypto from "crypto";

export const subscribeToCreator = async (req, res, next) => {
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
    if (req.user.id === creatorId) {
      const error = new Error("You cannot subscribe to yourself");
      error.statusCode = 400;
      return next(error);
    }

    // Check for existing active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        subscriberId: req.user.id,
        creatorId,
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

    // Create Square customer if not exists
    let squareCustomerId = req.user.squareCustomerId;
    if (!squareCustomerId) {
      const createCustomerRequest = {
        givenName: req.user.fullName?.split(" ")[0] || req.user.username,
        familyName: req.user.fullName?.split(" ").slice(1).join(" ") || "",
        emailAddress: req.user.email,
        referenceId: req.user.id,
      };

      const customerResponse = await customersApi.createCustomer(
        createCustomerRequest
      );

      if (customerResponse.result.errors) {
        throw new Error(
          `Customer creation failed: ${customerResponse.result.errors
            .map((e) => e.detail)
            .join(", ")}`
        );
      }

      squareCustomerId = customerResponse.result.customer.id;

      // Update user with Square customer ID
      await prisma.user.update({
        where: { id: req.user.id },
        data: { squareCustomerId },
      });
    }

    // Create payment for subscription
    const paymentRequest = {
      sourceId: sourceId,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: formatMoney(monthlyPrice),
      appFeeMoney: formatMoney(platformFee),
      note: `Monthly subscription to ${creator.username}`,
    };

    const paymentResponse = await paymentsApi.createPayment(paymentRequest);

    if (paymentResponse.result.errors) {
      throw new Error(
        `Payment failed: ${paymentResponse.result.errors
          .map((e) => e.detail)
          .join(", ")}`
      );
    }

    const payment = paymentResponse.result.payment;

    // Create subscription record
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        subscriberId: req.user.id,
        creatorId,
        status: "ACTIVE",
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

    // Create notification for creator
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
    console.error("Subscription error:", error);
    next(error);
  }
};

export const getUserSubscriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status = "ACTIVE" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      subscriberId: req.user.id,
    };

    if (status !== "ALL") {
      if (status === "ACTIVE") {
        where.status = "ACTIVE";
        where.currentPeriodEnd = { gte: new Date() };
      } else if (status === "EXPIRED") {
        where.OR = [
          { status: "CANCELED" },
          { currentPeriodEnd: { lt: new Date() } },
        ];
      }
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
            profile: {
              select: {
                monthlyPrice: true,
                categories: true,
              },
            },
          },
        },
      },
    });

    const totalCount = await prisma.subscription.count({ where });

    res.status(200).json({
      success: true,
      data: {
        subscriptions,
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

export const getCreatorSubscribers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!creatorProfile) {
      const error = new Error("Creator profile not found");
      error.statusCode = 404;
      return next(error);
    }

    const subscribers = await prisma.subscription.findMany({
      where: {
        creatorId: req.user.id,
        status: "ACTIVE",
        currentPeriodEnd: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
      include: {
        subscriber: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
    });

    const totalCount = await prisma.subscription.count({
      where: {
        creatorId: req.user.id,
        status: "ACTIVE",
        currentPeriodEnd: { gte: new Date() },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        subscribers,
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

export const cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscription.findFirst({
      where: {
        id,
        subscriberId: req.user.id,
      },
      include: {
        creator: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      return next(error);
    }

    // Update subscription status to canceled
    await prisma.subscription.update({
      where: { id },
      data: {
        status: "CANCELED",
        cancelAtPeriodEnd: true,
      },
    });

    // Create notification for creator
    await prisma.notification.create({
      data: {
        userId: subscription.creatorId,
        type: "SUBSCRIPTION_CANCELED",
        title: "Subscription Canceled",
        content: `${req.user.username} has canceled their subscription`,
        relatedId: req.user.id,
        relatedType: "User",
      },
    });

    res.status(200).json({
      success: true,
      message: `Subscription to ${
        subscription.creator.username
      } canceled successfully. You'll have access until ${subscription.currentPeriodEnd.toLocaleDateString()}`,
    });
  } catch (error) {
    next(error);
  }
};

// Function to process subscription renewals (called by scheduled task)
export const processSubscriptionRenewal = async (subscriptionId) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        subscriber: true,
        creator: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!subscription || subscription.status !== "ACTIVE") {
      console.error(`Subscription ${subscriptionId} not found or not active`);
      return;
    }

    const monthlyPrice = subscription.creator.profile.monthlyPrice;
    const platformFeePercent = config.PLATFORM_FEE_PERCENTAGE;
    const platformFee = (monthlyPrice * platformFeePercent) / 100;
    const creatorAmount = monthlyPrice - platformFee;

    // Try to charge the customer for renewal
    // Note: In a real implementation, you'd need to store the payment method
    // and use it for recurring charges

    const paymentRequest = {
      sourceId: "STORED_PAYMENT_METHOD", // This would be the stored payment method
      idempotencyKey: crypto.randomUUID(),
      amountMoney: formatMoney(monthlyPrice),
      appFeeMoney: formatMoney(platformFee),
      note: `Subscription renewal to ${subscription.creator.username}`,
      referenceId: `renewal_${subscription.id}`,
    };

    try {
      const paymentResponse = await paymentsApi.createPayment(paymentRequest);

      if (paymentResponse.result.errors) {
        throw new Error(
          `Renewal payment failed: ${paymentResponse.result.errors
            .map((e) => e.detail)
            .join(", ")}`
        );
      }

      const payment = paymentResponse.result.payment;

      // Update subscription for next period
      const newPeriodStart = new Date();
      const newPeriodEnd = new Date();
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd,
          squarePaymentId: payment.id,
        },
      });

      // Create wallet transactions for renewal
      await Promise.all([
        prisma.walletTransaction.create({
          data: {
            userId: subscription.subscriberId,
            amount: -monthlyPrice,
            type: "SUBSCRIPTION_PAYMENT",
            status: "COMPLETED",
            squarePaymentId: payment.id,
            description: `Subscription renewal to ${subscription.creator.username}`,
          },
        }),
        prisma.walletTransaction.create({
          data: {
            userId: subscription.creatorId,
            amount: creatorAmount,
            type: "SUBSCRIPTION_EARNING",
            status: "COMPLETED",
            squarePaymentId: payment.id,
            description: `Subscription renewal from ${subscription.subscriber.username}`,
          },
        }),
      ]);

      console.log(`Subscription ${subscriptionId} renewed successfully`);

      // Send notifications
      await Promise.all([
        prisma.notification.create({
          data: {
            userId: subscription.subscriberId,
            type: "SUBSCRIPTION_RENEWED",
            title: "Subscription Renewed",
            content: `Your subscription to ${subscription.creator.username} has been renewed`,
            relatedId: subscription.creatorId,
            relatedType: "User",
          },
        }),
        prisma.notification.create({
          data: {
            userId: subscription.creatorId,
            type: "SUBSCRIPTION_RENEWED",
            title: "Subscription Renewed",
            content: `${subscription.subscriber.username} has renewed their subscription`,
            relatedId: subscription.subscriberId,
            relatedType: "User",
          },
        }),
      ]);

      return payment;
    } catch (paymentError) {
      console.error(
        `Payment failed for subscription ${subscriptionId}:`,
        paymentError
      );

      // Mark subscription as past due
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "PAST_DUE",
        },
      });

      // Notify subscriber about failed payment
      await prisma.notification.create({
        data: {
          userId: subscription.subscriberId,
          type: "PAYMENT_FAILED",
          title: "Payment Failed",
          content: `Your subscription payment to ${subscription.creator.username} failed. Please update your payment method.`,
          relatedId: subscription.creatorId,
          relatedType: "User",
        },
      });

      throw paymentError;
    }
  } catch (error) {
    console.error(`Error renewing subscription ${subscriptionId}:`, error);
    throw error;
  }
};
