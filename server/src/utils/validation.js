import Joi from "joi";

// ==========================================
// AUTHENTICATION VALIDATION SCHEMAS
// ==========================================

// Registration schema - email only (passwordless)
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
  name: Joi.string().min(1).max(100).optional().allow(""),
  fullName: Joi.string().min(1).max(100).optional().allow(""),
});

// Login schema - email only (magic link)
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
});

// Magic link verification schema
export const magicLinkVerificationSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Login token is required",
  }),
});

// Email verification schema
export const emailVerificationSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Verification token is required",
  }),
});

// Email schema (for resending verification)
export const emailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
});

// Refresh token schema
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    "any.required": "Refresh token is required",
  }),
});

// ==========================================
// USER MANAGEMENT VALIDATION SCHEMAS
// ==========================================

// Update user profile schema (comprehensive)
export const updateUserProfileSchema = Joi.object({
  fullName: Joi.string().min(1).max(100).optional().allow(""),
  firstName: Joi.string().min(1).max(50).optional().allow(""),
  lastName: Joi.string().min(1).max(50).optional().allow(""),
  bio: Joi.string().max(500).optional().allow(""),
  username: Joi.string().alphanum().min(3).max(30).optional(),
  email: Joi.string().email().optional(),
  currentPassword: Joi.string().min(8).optional(),
  newPassword: Joi.string().min(8).optional(),
  location: Joi.string().max(100).optional().allow(""),
  website: Joi.string().uri().optional().allow(""),
  dateOfBirth: Joi.date().optional().allow(null),
  gender: Joi.string()
    .valid("MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY")
    .optional(),
  isPrivateProfile: Joi.boolean().optional(),
  emailNotifications: Joi.boolean().optional(),
  pushNotifications: Joi.boolean().optional(),
}).messages({
  "string.email": "Please enter a valid email address",
  "string.uri": "Please enter a valid website URL",
  "string.alphanum": "Username must contain only letters and numbers",
  "string.min": "Field must be at least {#limit} characters long",
  "string.max": "Field cannot exceed {#limit} characters",
});

// Password update schema
export const passwordUpdateSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Current password is required",
  }),
  newPassword: Joi.string().min(8).required().messages({
    "any.required": "New password is required",
    "string.min": "New password must be at least 8 characters long",
  }),
});

// Update profile schema
export const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(1).max(100).optional().allow(""),
  bio: Joi.string().max(500).optional().allow(""),
  avatarUrl: Joi.string().uri().optional().allow(""),
  coverImageUrl: Joi.string().uri().optional().allow(""),
  isPrivateProfile: Joi.boolean().optional(),
  emailNotifications: Joi.boolean().optional(),
  language: Joi.string()
    .valid("en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko")
    .optional(),
});

// ==========================================
// CONTENT VALIDATION SCHEMAS
// ==========================================

// Post creation schema
export const createPostSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional().allow(""),
  content: Joi.string().min(1).max(5000).optional().allow(""),
  isPremium: Joi.boolean().default(false),
  price: Joi.number().min(0).optional().allow(null),
  mediaUrls: Joi.array().items(Joi.string().uri()).optional().default([]),
  categoryIds: Joi.array().items(Joi.string().uuid()).optional().default([]),
});

// Comment creation schema
export const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required().messages({
    "string.min": "Comment cannot be empty",
    "string.max": "Comment cannot exceed 1000 characters",
    "any.required": "Comment content is required",
  }),
  parentId: Joi.string().uuid().optional().allow(null),
});

// ==========================================
// CREATOR VALIDATION SCHEMAS
// ==========================================

// Creator profile setup schema
export const createCreatorProfileSchema = Joi.object({
  monthlyPrice: Joi.number().min(0.99).max(999.99).required().messages({
    "number.min": "Monthly price must be at least $0.99",
    "number.max": "Monthly price cannot exceed $999.99",
    "any.required": "Monthly price is required",
  }),
  displayName: Joi.string().min(1).max(100).optional().allow(""),
  tagline: Joi.string().max(200).optional().allow(""),
  about: Joi.string().max(2000).optional().allow(""),
  categoryIds: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .required()
    .messages({
      "array.min": "At least one category is required",
      "any.required": "Categories are required",
    }),
});

// Creator profile schema (for both create and update)
export const creatorProfileSchema = Joi.object({
  monthlyPrice: Joi.number().min(0.99).max(999.99).optional().messages({
    "number.min": "Monthly price must be at least $0.99",
    "number.max": "Monthly price cannot exceed $999.99",
  }),
  categories: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .optional()
    .messages({
      "array.min": "At least one category is required",
    }),
  socialLinks: Joi.object({
    twitter: Joi.string().uri().optional().allow(""),
    instagram: Joi.string().uri().optional().allow(""),
    youtube: Joi.string().uri().optional().allow(""),
    tiktok: Joi.string().uri().optional().allow(""),
    onlyfans: Joi.string().uri().optional().allow(""),
    website: Joi.string().uri().optional().allow(""),
  }).optional(),
  displayName: Joi.string().min(1).max(100).optional().allow(""),
  tagline: Joi.string().max(200).optional().allow(""),
  about: Joi.string().max(2000).optional().allow(""),
  isAcceptingTips: Joi.boolean().optional(),
  tipMinAmount: Joi.number().min(1).max(1000).optional(),
  contentRating: Joi.string().valid("GENERAL", "MATURE", "EXPLICIT").optional(),
}).messages({
  "string.uri": "Please enter a valid URL",
  "string.min": "Field must be at least {#limit} characters long",
  "string.max": "Field cannot exceed {#limit} characters",
});

// ==========================================
// MESSAGING VALIDATION SCHEMAS
// ==========================================

// Send message schema
export const sendMessageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required().messages({
    "string.min": "Message cannot be empty",
    "string.max": "Message cannot exceed 2000 characters",
    "any.required": "Message content is required",
  }),
  receiverId: Joi.string().uuid().required().messages({
    "any.required": "Receiver ID is required",
  }),
  mediaUrl: Joi.string().uri().optional().allow(""),
});

// Alias for sendMessageSchema
export const messageSchema = sendMessageSchema;

// ==========================================
// SEARCH VALIDATION SCHEMAS
// ==========================================

// Search schema
export const searchSchema = Joi.object({
  query: Joi.string().min(1).max(100).required().messages({
    "string.min": "Search query cannot be empty",
    "string.max": "Search query cannot exceed 100 characters",
    "any.required": "Search query is required",
  }),
  type: Joi.string().valid("all", "users", "creators", "posts").default("all"),
  limit: Joi.number().integer().min(1).max(50).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

// ==========================================
// PAGINATION VALIDATION SCHEMA
// ==========================================

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

// ==========================================
// VALIDATION MIDDLEWARE
// ==========================================

export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      const validationError = new Error(errorMessage);
      validationError.statusCode = 400;
      validationError.type = "VALIDATION_ERROR";
      return next(validationError);
    }

    req.body = value;
    next();
  };
};

// Query validation middleware
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      const validationError = new Error(errorMessage);
      validationError.statusCode = 400;
      validationError.type = "VALIDATION_ERROR";
      return next(validationError);
    }

    req.query = value;
    next();
  };
};

// Params validation middleware
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      const validationError = new Error(errorMessage);
      validationError.statusCode = 400;
      validationError.type = "VALIDATION_ERROR";
      return next(validationError);
    }

    req.params = value;
    next();
  };
};
