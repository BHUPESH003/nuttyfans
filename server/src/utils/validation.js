import Joi from "joi";

// ==========================================
// AUTHENTICATION VALIDATION SCHEMAS
// ==========================================

// Registration schema
export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    "string.alphanum": "Username must contain only letters and numbers",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username cannot exceed 30 characters",
    "any.required": "Username is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string()
    .min(8)
    .optional()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
      )
    )
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base":
        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .when("password", {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      "any.only": "Passwords do not match",
      "any.required":
        "Password confirmation is required when password is provided",
    }),
  firstName: Joi.string().min(1).max(50).optional().allow(""),
  lastName: Joi.string().min(1).max(50).optional().allow(""),
  fullName: Joi.string().min(1).max(100).optional().allow(""),
});

// Login schema - passwordless login request
export const loginSchema = Joi.object({
  email: Joi.string().email().optional().messages({
    "string.email": "Please enter a valid email address",
  }),
  username: Joi.string().optional(),
})
  .xor("email", "username")
  .messages({
    "object.xor": "Please provide either email or username",
  });

// Legacy password login schema (for users who still want to use passwords)
export const passwordLoginSchema = Joi.object({
  email: Joi.string().email().optional().messages({
    "string.email": "Please enter a valid email address",
  }),
  username: Joi.string().optional(),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
})
  .xor("email", "username")
  .messages({
    "object.xor": "Please provide either email or username",
  });

// Email schema (for various email-based operations)
export const emailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
});

// OTP verification schema
export const otpVerificationSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.length": "OTP must be exactly 6 digits",
      "string.pattern.base": "OTP must contain only numbers",
      "any.required": "OTP is required",
    }),
});

// Google login schema
export const googleLoginSchema = Joi.object({
  credential: Joi.string().required().messages({
    "any.required": "Google credential is required",
  }),
  clientId: Joi.string().optional(),
});

// Email verification schema
export const emailVerificationSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Verification token is required",
  }),
});

// Refresh token schema
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    "any.required": "Refresh token is required",
  }),
});

// Password reset request schema
export const passwordResetSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
});

// New password schema (for reset)
export const newPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Reset token is required",
  }),
  password: Joi.string()
    .min(8)
    .required()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
      )
    )
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base":
        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
      "any.required": "Password is required",
    }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
    "any.required": "Password confirmation is required",
  }),
});

// Two-factor authentication setup schema
export const twoFactorSetupSchema = Joi.object({
  token: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.length": "2FA token must be exactly 6 digits",
      "string.pattern.base": "2FA token must contain only numbers",
      "any.required": "2FA token is required",
    }),
});

// Two-factor authentication verification schema
export const twoFactorVerificationSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "2FA token is required",
  }),
  tempToken: Joi.string().required().messages({
    "any.required": "Temporary token is required",
  }),
});

// Login verification schema (for verifying login tokens)
export const loginVerificationSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Login token is required",
  }),
});

// Magic link login schema
export const magicLinkLoginSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Magic link token is required",
  }),
});

// Enhanced OTP verification schema with additional validation
export const enhancedOTPVerificationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.length": "OTP must be exactly 6 digits",
      "string.pattern.base": "OTP must contain only numbers",
      "any.required": "OTP is required",
    }),
  rememberDevice: Joi.boolean().default(false),
});

// Account recovery schema
export const accountRecoverySchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
  recoveryMethod: Joi.string()
    .valid("email", "sms", "backup_codes")
    .default("email")
    .messages({
      "any.only": "Invalid recovery method",
    }),
});

// Device management schema
export const deviceManagementSchema = Joi.object({
  deviceName: Joi.string().max(100).required().messages({
    "string.max": "Device name cannot exceed 100 characters",
    "any.required": "Device name is required",
  }),
  deviceType: Joi.string()
    .valid("desktop", "mobile", "tablet", "other")
    .default("other"),
  trustDevice: Joi.boolean().default(false),
});

// ==========================================
// USER PROFILE VALIDATION SCHEMAS
// ==========================================

// Update user profile schema
export const updateUserProfileSchema = Joi.object({
  fullName: Joi.string().min(1).max(100).optional().allow(""),
  firstName: Joi.string().min(1).max(50).optional().allow(""),
  lastName: Joi.string().min(1).max(50).optional().allow(""),
  bio: Joi.string().max(500).optional().allow(""),
  username: Joi.string().alphanum().min(3).max(30).optional(),
  email: Joi.string().email().optional(),
  location: Joi.string().max(100).optional().allow(""),
  website: Joi.string().uri().optional().allow(""),
  dateOfBirth: Joi.date().max("now").optional().allow(null),
  gender: Joi.string()
    .valid("MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY")
    .optional(),
  isPrivateProfile: Joi.boolean().optional(),
  emailNotifications: Joi.boolean().optional(),
  pushNotifications: Joi.boolean().optional(),
  currentPassword: Joi.string()
    .when("newPassword", {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      "any.required": "Current password is required to change password",
    }),
  newPassword: Joi.string()
    .min(8)
    .optional()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
      )
    )
    .messages({
      "string.min": "New password must be at least 8 characters long",
      "string.pattern.base":
        "New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
    }),
});

// Password update schema (separate endpoint)
export const passwordUpdateSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Current password is required",
  }),
  newPassword: Joi.string()
    .min(8)
    .required()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
      )
    )
    .messages({
      "string.min": "New password must be at least 8 characters long",
      "string.pattern.base":
        "New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
      "any.required": "New password is required",
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
      "any.required": "Password confirmation is required",
    }),
});

// Follow user schema
export const followUserSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    "string.uuid": "Invalid user ID format",
    "any.required": "User ID is required",
  }),
});

// ==========================================
// CREATOR PROFILE VALIDATION SCHEMAS
// ==========================================

// Creator profile schema
export const creatorProfileSchema = Joi.object({
  monthlyPrice: Joi.number().positive().required().messages({
    "number.positive": "Monthly price must be a positive number",
    "any.required": "Monthly price is required",
  }),
  displayName: Joi.string().min(1).max(100).optional().allow(""),
  tagline: Joi.string().max(200).optional().allow(""),
  about: Joi.string().max(2000).optional().allow(""),
  categories: Joi.array().items(Joi.string().uuid()).optional(),
  socialLinks: Joi.object({
    twitter: Joi.string().uri().optional().allow(""),
    instagram: Joi.string().uri().optional().allow(""),
    youtube: Joi.string().uri().optional().allow(""),
    tiktok: Joi.string().uri().optional().allow(""),
    website: Joi.string().uri().optional().allow(""),
    facebook: Joi.string().uri().optional().allow(""),
    linkedin: Joi.string().uri().optional().allow(""),
    discord: Joi.string().optional().allow(""),
    telegram: Joi.string().optional().allow(""),
  }).optional(),
  customWelcomeMessage: Joi.string().max(500).optional().allow(""),
  isAcceptingTips: Joi.boolean().optional(),
  tipMinAmount: Joi.number().positive().optional(),
  contentRating: Joi.string()
    .valid("ALL_AGES", "TEEN", "MATURE", "ADULT")
    .optional(),
  allowComments: Joi.boolean().optional(),
  requireApproval: Joi.boolean().optional(),
});

// ==========================================
// CONTENT VALIDATION SCHEMAS
// ==========================================

// Post validation schemas
export const createPostSchema = Joi.object({
  title: Joi.string().max(200).optional().allow(""),
  content: Joi.string().max(10000).optional().allow(""),
  isPremium: Joi.boolean().default(false),
  price: Joi.when("isPremium", {
    is: true,
    then: Joi.number().positive().required(),
    otherwise: Joi.number().optional().allow(null),
  }).messages({
    "number.positive": "Price must be a positive number",
    "any.required": "Price is required for premium posts",
  }),
  categories: Joi.array().items(Joi.string().uuid()).optional(),
});

export const updatePostSchema = Joi.object({
  title: Joi.string().max(200).optional().allow(""),
  content: Joi.string().max(10000).optional().allow(""),
  isPremium: Joi.boolean().optional(),
  price: Joi.when("isPremium", {
    is: true,
    then: Joi.number().positive().required(),
    otherwise: Joi.number().optional().allow(null),
  }),
  isArchived: Joi.boolean().optional(),
  categories: Joi.array().items(Joi.string().uuid()).optional(),
});

// Comment validation schemas
export const commentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required().messages({
    "string.min": "Comment cannot be empty",
    "string.max": "Comment cannot exceed 1000 characters",
    "any.required": "Comment content is required",
  }),
  parentId: Joi.string().uuid().optional(),
});

// Message validation schemas
export const messageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required().messages({
    "string.min": "Message cannot be empty",
    "string.max": "Message cannot exceed 2000 characters",
    "any.required": "Message content is required",
  }),
  receiverId: Joi.string().uuid().required().messages({
    "string.uuid": "Invalid receiver ID format",
    "any.required": "Receiver ID is required",
  }),
  mediaId: Joi.string().uuid().optional(),
});

// ==========================================
// PAYMENT VALIDATION SCHEMAS
// ==========================================

// Subscription validation schemas
export const subscriptionSchema = Joi.object({
  creatorId: Joi.string().uuid().required().messages({
    "string.uuid": "Invalid creator ID format",
    "any.required": "Creator ID is required",
  }),
  planType: Joi.string()
    .valid("MONTHLY", "QUARTERLY", "YEARLY", "LIFETIME")
    .default("MONTHLY"),
  paymentMethodId: Joi.string().optional(),
});

// Payment validation schemas
export const paymentMethodSchema = Joi.object({
  squarePaymentMethodId: Joi.string().required().messages({
    "any.required": "Payment method ID is required",
  }),
  isDefault: Joi.boolean().optional(),
});

export const purchaseSchema = Joi.object({
  postId: Joi.string().uuid().required().messages({
    "string.uuid": "Invalid post ID format",
    "any.required": "Post ID is required",
  }),
  paymentMethodId: Joi.string().optional(),
});

// Tip schema
export const tipSchema = Joi.object({
  creatorId: Joi.string().uuid().required().messages({
    "string.uuid": "Invalid creator ID format",
    "any.required": "Creator ID is required",
  }),
  amount: Joi.number().positive().min(1).required().messages({
    "number.positive": "Tip amount must be positive",
    "number.min": "Minimum tip amount is $1",
    "any.required": "Tip amount is required",
  }),
  message: Joi.string().max(500).optional().allow(""),
  paymentMethodId: Joi.string().optional(),
});

// ==========================================
// VALIDATION MIDDLEWARE
// ==========================================

// Middleware for validation
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all validation errors
      stripUnknown: true, // Remove unknown fields
      convert: true, // Convert types where possible
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      const customError = new Error("Validation failed");
      customError.statusCode = 400;
      customError.errors = errors;
      customError.details = errors.map((err) => err.message).join(", ");

      return next(customError);
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Validate query parameters
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      const customError = new Error("Query validation failed");
      customError.statusCode = 400;
      customError.errors = errors;
      customError.details = errors.map((err) => err.message).join(", ");

      return next(customError);
    }

    req.query = value;
    next();
  };
};

// Validate URL parameters
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      const customError = new Error("Parameter validation failed");
      customError.statusCode = 400;
      customError.errors = errors;
      customError.details = errors.map((err) => err.message).join(", ");

      return next(customError);
    }

    req.params = value;
    next();
  };
};
