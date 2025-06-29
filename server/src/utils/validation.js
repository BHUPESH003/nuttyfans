import Joi from "joi";

// Validation schemas
export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
  }),
  name: Joi.string().min(2).max(100).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const updateUserSchema = Joi.object({
  fullName: Joi.string(),
  bio: Joi.string().allow("", null),
  email: Joi.string().email(),
  currentPassword: Joi.string().when("email", {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

export const creatorProfileSchema = Joi.object({
  monthlyPrice: Joi.number().positive().required(),
  categories: Joi.array().items(Joi.string().required()),
  socialLinks: Joi.object({
    twitter: Joi.string().uri().allow("", null),
    instagram: Joi.string().uri().allow("", null),
    youtube: Joi.string().uri().allow("", null),
    tiktok: Joi.string().uri().allow("", null),
    website: Joi.string().uri().allow("", null),
  }).allow(null),
});

// Post validation schemas
export const createPostSchema = Joi.object({
  title: Joi.string().allow("", null),
  content: Joi.string().allow("", null),
  isPremium: Joi.boolean().default(false),
  price: Joi.when("isPremium", {
    is: true,
    then: Joi.number().min(1).required(),
    otherwise: Joi.number().allow(null),
  }),
  categories: Joi.array().items(Joi.string()),
});

export const updatePostSchema = Joi.object({
  title: Joi.string().allow("", null),
  content: Joi.string().allow("", null),
  isPremium: Joi.boolean(),
  price: Joi.when("isPremium", {
    is: true,
    then: Joi.number().min(1).required(),
    otherwise: Joi.number().allow(null),
  }),
  isArchived: Joi.boolean(),
  categories: Joi.array().items(Joi.string()),
});

// Comment validation schemas
export const commentSchema = Joi.object({
  content: Joi.string().required(),
  parentId: Joi.string().uuid().allow(null),
});

// Message validation schemas
export const messageSchema = Joi.object({
  content: Joi.string().required(),
  receiverId: Joi.string().uuid().required(),
});

// Subscription validation schemas
export const subscriptionSchema = Joi.object({
  creatorId: Joi.string().uuid().required(),
  paymentMethodId: Joi.string(),
});

// Payment validation schemas
export const paymentMethodSchema = Joi.object({
  paymentMethodId: Joi.string().required(),
});

export const purchaseSchema = Joi.object({
  postId: Joi.string().uuid().required(),
  paymentMethodId: Joi.string(),
});

// Middleware for validation
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const customError = new Error(
        error.details.map((err) => err.message).join(", ")
      );
      customError.statusCode = 400;
      return next(customError);
    }
    next();
  };
};
