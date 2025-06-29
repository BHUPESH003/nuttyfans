import prisma from "../config/prisma.js";
import {
  paymentsApi,
  customersApi,
  formatMoney,
  formatMoneyFromSquare,
  handleSquareError,
} from "../config/square.js";
import { config } from "../config/env.js";

export const subscribeToCreator = async (req, res, next) => {
  try {
    const { creatorId, paymentMethodId } = req.body;

    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      include: { profile: true },
    });

    if (!creator || !creator.profile || !creator.profile.isVerified) {
      const error = new Error("Creator not found or not verified");
      error.statusCode = 404;
      return next(error);
    }

    if (req.user.id === creatorId) {
      const error = new Error("You cannot subscribe to yourself");
      error.statusCode = 400;
      return next(error);
    }

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

    let squareCustomerId = req.user.squareCustomerId;

    // Create Square customer if not exists
    if (!squareCustomerId) {
      try {
        const customerRequest = {
          givenName: req.user.fullName || req.user.username,
          emailAddress: req.user.email,
          referenceId: req.user.id,
        };

        const { result } = await customersApi.createCustomer({
          body: customerRequest,
        });

        squareCustomerId = result.customer.id;

        await prisma.user.update({
          where: { id: req.user.id },
          data: { squareCustomerId },
        });
      } catch (squareError) {
        console.error("Square customer creation error:", squareError);
        const error = new Error("Failed to create customer account");
        error.statusCode = 500;
        return next(error);
      }
    }

    const monthlyPrice = creator.profile.monthlyPrice;
    const platformFeePercent = parseFloat(config.PLATFORM_FEE_PERCENTAGE) || 20;
    const applicationFee = monthlyPrice * (platformFeePercent / 100);

    // Create payment with Square
    try {
      const paymentRequest = {
        sourceId: paymentMethodId,
        amountMoney: formatMoney(monthlyPrice),
        idempotencyKey: `subscription-${
          req.user.id
        }-${creatorId}-${Date.now()}`,
        note: `Monthly subscription to ${creator.username}`,
        customerId: squareCustomerId,
        referenceId: `sub-${req.user.id}-${creatorId}`,
      };

      const { result } = await paymentsApi.createPayment({
        body: paymentRequest,
      });

      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

      const subscription = await prisma.subscription.create({
        data: {
          subscriberId: req.user.id,
          creatorId,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd,
          squarePaymentId: result.payment.id,
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

      // Create wallet transaction for creator earnings
      await prisma.walletTransaction.create({
        data: {
          userId: creatorId,
          amount: monthlyPrice - applicationFee,
          type: "SUBSCRIPTION_EARNING",
          status: "COMPLETED",
          description: `Subscription from ${req.user.username}`,
          squarePaymentId: result.payment.id,
        },
      });

      // Create wallet transaction for subscriber payment
      await prisma.walletTransaction.create({
        data: {
          userId: req.user.id,
          amount: -monthlyPrice,
          type: "SUBSCRIPTION_PAYMENT",
          status: "COMPLETED",
          description: `Subscription to ${creator.username}`,
          squarePaymentId: result.payment.id,
        },
      });

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
      });
    } catch (squareError) {
      console.error("Square payment error:", squareError);
      const errorDetails = handleSquareError(squareError);
      const error = new Error(errorDetails.message);
      error.statusCode = 400;
      return next(error);
    }
  } catch (error) {
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

    if (subscription.status === "CANCELED") {
      const error = new Error("Subscription is already canceled");
      error.statusCode = 400;
      return next(error);
    }

    await prisma.subscription.update({
      where: { id },
      data: {
        status: "CANCELED",
        cancelAtPeriodEnd: true,
      },
    });

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

    if (subscription.cancelAtPeriodEnd) {
      // Cancel the subscription as requested
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "CANCELED",
        },
      });

      await prisma.notification.create({
        data: {
          userId: subscription.subscriberId,
          type: "SUBSCRIPTION_EXPIRED",
          title: "Subscription Expired",
          content: `Your subscription to ${subscription.creator.username} has ended`,
          relatedId: subscription.creatorId,
          relatedType: "User",
        },
      });

      return;
    }

    const monthlyPrice = subscription.creator.profile.monthlyPrice;
    const platformFeePercent = parseFloat(config.PLATFORM_FEE_PERCENTAGE) || 20;
    const applicationFee = monthlyPrice * (platformFeePercent / 100);

    // Process renewal payment
    try {
      const paymentRequest = {
        sourceId: subscription.squarePaymentId, // Use stored payment method
        amountMoney: formatMoney(monthlyPrice),
        idempotencyKey: `renewal-${subscriptionId}-${Date.now()}`,
        note: `Monthly subscription renewal to ${subscription.creator.username}`,
        customerId: subscription.subscriber.squareCustomerId,
        referenceId: `renewal-${subscriptionId}`,
      };

      const { result } = await paymentsApi.createPayment({
        body: paymentRequest,
      });

      const newPeriodStart = new Date();
      const newPeriodEnd = new Date();
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd,
          squarePaymentId: result.payment.id,
        },
      });

      // Create wallet transactions
      await Promise.all([
        prisma.walletTransaction.create({
          data: {
            userId: subscription.creatorId,
            amount: monthlyPrice - applicationFee,
            type: "SUBSCRIPTION_EARNING",
            status: "COMPLETED",
            description: `Subscription renewal from ${subscription.subscriber.username}`,
            squarePaymentId: result.payment.id,
          },
        }),
        prisma.walletTransaction.create({
          data: {
            userId: subscription.subscriberId,
            amount: -monthlyPrice,
            type: "SUBSCRIPTION_PAYMENT",
            status: "COMPLETED",
            description: `Subscription renewal to ${subscription.creator.username}`,
            squarePaymentId: result.payment.id,
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

      return result.payment;
    } catch (squareError) {
      console.error(
        `Error renewing subscription ${subscriptionId}:`,
        squareError
      );

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "PAST_DUE",
        },
      });

      await prisma.notification.create({
        data: {
          userId: subscription.subscriberId,
          type: "PAYMENT_FAILED",
          title: "Payment Failed",
          content: `Failed to renew subscription to ${subscription.creator.username}. Please update your payment method.`,
          relatedId: subscription.creatorId,
          relatedType: "User",
        },
      });

      throw squareError;
    }
  } catch (error) {
    console.error(
      `Error processing subscription renewal ${subscriptionId}:`,
      error
    );
    throw error;
  }
};
