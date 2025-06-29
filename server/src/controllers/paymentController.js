import prisma from "../config/prisma.js";
import {
  paymentsApi,
  customersApi,
  formatMoney,
  formatMoneyFromSquare,
  handleSquareError,
} from "../config/square.js";
import { config } from "../config/env.js";

export const createPaymentMethod = async (req, res, next) => {
  try {
    const { cardNonce, verificationToken } = req.body;

    if (!cardNonce) {
      const error = new Error("Card nonce is required");
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

    // Create card with Square
    try {
      const cardRequest = {
        sourceId: cardNonce,
        card: {
          customerId: squareCustomerId,
        },
      };

      if (verificationToken) {
        cardRequest.verificationToken = verificationToken;
      }

      const { result } = await paymentsApi.createCard({
        body: cardRequest,
      });

      const card = result.card;

      const existingMethods = await prisma.paymentMethod.count({
        where: { userId: req.user.id },
      });

      const newPaymentMethod = await prisma.paymentMethod.create({
        data: {
          userId: req.user.id,
          squarePaymentMethodId: card.id,
          cardId: card.id,
          brand: card.cardBrand,
          last4: card.last4,
          expMonth: card.expMonth,
          expYear: card.expYear,
          isDefault: existingMethods === 0,
        },
      });

      if (newPaymentMethod.isDefault) {
        await prisma.paymentMethod.updateMany({
          where: {
            userId: req.user.id,
            id: { not: newPaymentMethod.id },
          },
          data: {
            isDefault: false,
          },
        });
      }

      res.status(201).json({
        success: true,
        data: newPaymentMethod,
      });
    } catch (squareError) {
      console.error("Square card creation error:", squareError);
      const errorDetails = handleSquareError(squareError);
      const error = new Error(errorDetails.message);
      error.statusCode = 400;
      return next(error);
    }
  } catch (error) {
    next(error);
  }
};

export const getPaymentMethods = async (req, res, next) => {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: [
        {
          isDefault: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: paymentMethods,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;

    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!paymentMethod) {
      const error = new Error("Payment method not found");
      error.statusCode = 404;
      return next(error);
    }

    if (paymentMethod.isDefault) {
      const otherMethods = await prisma.paymentMethod.findMany({
        where: {
          userId: req.user.id,
          id: { not: id },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      });

      if (otherMethods.length > 0) {
        await prisma.paymentMethod.update({
          where: { id: otherMethods[0].id },
          data: { isDefault: true },
        });
      }
    }

    // Delete card from Square
    try {
      await paymentsApi.disableCard({
        cardId: paymentMethod.cardId,
      });
    } catch (squareError) {
      console.error("Square card deletion error:", squareError);
      // Continue with local deletion even if Square deletion fails
    }

    await prisma.paymentMethod.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const setDefaultPaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;

    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!paymentMethod) {
      const error = new Error("Payment method not found");
      error.statusCode = 404;
      return next(error);
    }

    await prisma.paymentMethod.updateMany({
      where: {
        userId: req.user.id,
      },
      data: {
        isDefault: false,
      },
    });

    await prisma.paymentMethod.update({
      where: { id },
      data: { isDefault: true },
    });

    res.status(200).json({
      success: true,
      message: "Default payment method updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactionHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
    };

    if (type) {
      where.type = type;
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

export const createPayment = async (req, res, next) => {
  try {
    const { amount, paymentMethodId, description, receiverId } = req.body;

    if (!amount || !paymentMethodId) {
      const error = new Error("Amount and payment method are required");
      error.statusCode = 400;
      return next(error);
    }

    let squareCustomerId = req.user.squareCustomerId;

    if (!squareCustomerId) {
      const error = new Error(
        "Square customer not found. Please add a payment method first."
      );
      error.statusCode = 400;
      return next(error);
    }

    try {
      const paymentRequest = {
        sourceId: paymentMethodId,
        amountMoney: formatMoney(amount),
        idempotencyKey: `payment-${req.user.id}-${Date.now()}`,
        note: description || "Payment",
        customerId: squareCustomerId,
      };

      const { result } = await paymentsApi.createPayment({
        body: paymentRequest,
      });

      // Create wallet transaction for sender
      await prisma.walletTransaction.create({
        data: {
          userId: req.user.id,
          amount: -amount,
          type: "WITHDRAWAL",
          status: "COMPLETED",
          description: description || "Payment",
          squarePaymentId: result.payment.id,
        },
      });

      // Create wallet transaction for receiver if specified
      if (receiverId) {
        const platformFee = amount * (config.PLATFORM_FEE_PERCENTAGE / 100);
        const receiverAmount = amount - platformFee;

        await prisma.walletTransaction.create({
          data: {
            userId: receiverId,
            amount: receiverAmount,
            type: "DEPOSIT",
            status: "COMPLETED",
            description: `Payment from ${req.user.username}`,
            squarePaymentId: result.payment.id,
          },
        });
      }

      res.status(201).json({
        success: true,
        data: {
          paymentId: result.payment.id,
          amount: formatMoneyFromSquare(result.payment.amountMoney),
          status: result.payment.status,
        },
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

export const webhookHandler = async (req, res) => {
  try {
    const signature = req.headers["square-signature"];
    const body = req.body;

    // In a real implementation, you would verify the webhook signature
    // For now, we'll just process the webhook

    const { type, data } = body;

    switch (type) {
      case "payment.updated":
        await handlePaymentUpdated(data.object.payment);
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

const handlePaymentUpdated = async (payment) => {
  try {
    await prisma.walletTransaction.updateMany({
      where: { squarePaymentId: payment.id },
      data: {
        status: payment.status === "COMPLETED" ? "COMPLETED" : "FAILED",
      },
    });
  } catch (error) {
    console.error("Error handling payment update:", error);
  }
};

export const purchasePost = async (req, res, next) => {
  try {
    const { postId, paymentMethodId } = req.body;

    if (!postId || !paymentMethodId) {
      const error = new Error("Post ID and payment method are required");
      error.statusCode = 400;
      return next(error);
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      return next(error);
    }

    if (!post.isPremium || !post.price) {
      const error = new Error("This post is not available for purchase");
      error.statusCode = 400;
      return next(error);
    }

    if (post.userId === req.user.id) {
      const error = new Error("You cannot purchase your own post");
      error.statusCode = 400;
      return next(error);
    }

    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        userId: req.user.id,
        postId,
        status: "COMPLETED",
      },
    });

    if (existingPurchase) {
      const error = new Error("You have already purchased this post");
      error.statusCode = 400;
      return next(error);
    }

    let squareCustomerId = req.user.squareCustomerId;

    if (!squareCustomerId) {
      const error = new Error(
        "Square customer not found. Please add a payment method first."
      );
      error.statusCode = 400;
      return next(error);
    }

    try {
      const platformFee = post.price * (config.PLATFORM_FEE_PERCENTAGE / 100);
      const creatorAmount = post.price - platformFee;

      const paymentRequest = {
        sourceId: paymentMethodId,
        amountMoney: formatMoney(post.price),
        idempotencyKey: `purchase-${req.user.id}-${postId}-${Date.now()}`,
        note: `Purchase: ${post.title || "Post"}`,
        customerId: squareCustomerId,
      };

      const { result } = await paymentsApi.createPayment({
        body: paymentRequest,
      });

      const purchase = await prisma.purchase.create({
        data: {
          userId: req.user.id,
          postId,
          amount: post.price,
          squarePaymentId: result.payment.id,
          status: "COMPLETED",
        },
      });

      // Create wallet transactions
      await Promise.all([
        prisma.walletTransaction.create({
          data: {
            userId: req.user.id,
            amount: -post.price,
            type: "CONTENT_PURCHASE_PAYMENT",
            status: "COMPLETED",
            description: `Purchased: ${post.title || "Post"}`,
            squarePaymentId: result.payment.id,
          },
        }),
        prisma.walletTransaction.create({
          data: {
            userId: post.userId,
            amount: creatorAmount,
            type: "CONTENT_PURCHASE_EARNING",
            status: "COMPLETED",
            description: `Sale: ${post.title || "Post"}`,
            squarePaymentId: result.payment.id,
          },
        }),
      ]);

      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: "NEW_PURCHASE",
          title: "New Purchase",
          content: `${req.user.username} purchased your post`,
          relatedId: postId,
          relatedType: "Post",
        },
      });

      res.status(201).json({
        success: true,
        data: purchase,
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

    const totalEarnings = await prisma.walletTransaction.aggregate({
      where: {
        userId: req.user.id,
        type: {
          in: ["SUBSCRIPTION_EARNING", "CONTENT_PURCHASE_EARNING"],
        },
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    });

    const totalSpent = await prisma.walletTransaction.aggregate({
      where: {
        userId: req.user.id,
        type: {
          in: ["SUBSCRIPTION_PAYMENT", "CONTENT_PURCHASE_PAYMENT"],
        },
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        currentBalance: balance._sum.amount || 0,
        totalEarnings: totalEarnings._sum.amount || 0,
        totalSpent: Math.abs(totalSpent._sum.amount || 0),
      },
    });
  } catch (error) {
    next(error);
  }
};
