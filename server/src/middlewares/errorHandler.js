import { config } from "../config/env.js";

// Error types for better categorization
const ErrorTypes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR: "NOT_FOUND_ERROR",
  CONFLICT_ERROR: "CONFLICT_ERROR",
  RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
  PAYMENT_ERROR: "PAYMENT_ERROR",
  UPLOAD_ERROR: "UPLOAD_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
};

// Custom error classes
export class AppError extends Error {
  constructor(
    message,
    statusCode,
    errorType = ErrorTypes.INTERNAL_SERVER_ERROR,
    errors = null
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = null) {
    super(message, 400, ErrorTypes.VALIDATION_ERROR, errors);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, ErrorTypes.AUTHENTICATION_ERROR);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, 403, ErrorTypes.AUTHORIZATION_ERROR);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, ErrorTypes.NOT_FOUND_ERROR);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, 409, ErrorTypes.CONFLICT_ERROR);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, ErrorTypes.RATE_LIMIT_ERROR);
  }
}

export class PaymentError extends AppError {
  constructor(message = "Payment processing failed") {
    super(message, 402, ErrorTypes.PAYMENT_ERROR);
  }
}

export class UploadError extends AppError {
  constructor(message = "File upload failed") {
    super(message, 400, ErrorTypes.UPLOAD_ERROR);
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database operation failed") {
    super(message, 500, ErrorTypes.DATABASE_ERROR);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = "External service unavailable") {
    super(message, 503, ErrorTypes.EXTERNAL_SERVICE_ERROR);
  }
}

// Helper function to determine error type based on error properties
const determineErrorType = (error) => {
  if (error.errorType) return error.errorType;

  // Prisma errors
  if (error.code === "P2002") return ErrorTypes.CONFLICT_ERROR;
  if (error.code === "P2025") return ErrorTypes.NOT_FOUND_ERROR;
  if (error.code?.startsWith("P")) return ErrorTypes.DATABASE_ERROR;

  // Multer errors
  if (error.code === "LIMIT_FILE_SIZE") return ErrorTypes.UPLOAD_ERROR;
  if (error.code === "LIMIT_FILE_COUNT") return ErrorTypes.UPLOAD_ERROR;
  if (error.code === "LIMIT_UNEXPECTED_FILE") return ErrorTypes.UPLOAD_ERROR;

  // JWT errors
  if (error.name === "JsonWebTokenError")
    return ErrorTypes.AUTHENTICATION_ERROR;
  if (error.name === "TokenExpiredError")
    return ErrorTypes.AUTHENTICATION_ERROR;
  if (error.name === "NotBeforeError") return ErrorTypes.AUTHENTICATION_ERROR;

  // Validation errors
  if (error.name === "ValidationError") return ErrorTypes.VALIDATION_ERROR;
  if (error.details && Array.isArray(error.details))
    return ErrorTypes.VALIDATION_ERROR;

  // Square payment errors
  if (error.category === "PAYMENT_METHOD_ERROR")
    return ErrorTypes.PAYMENT_ERROR;
  if (error.category === "REFUND_ERROR") return ErrorTypes.PAYMENT_ERROR;

  // Default
  return ErrorTypes.INTERNAL_SERVER_ERROR;
};

// Helper function to get user-friendly error message
const getUserFriendlyMessage = (error, errorType) => {
  // Return custom message if available
  if (error.message && error.isOperational) {
    return error.message;
  }

  // Handle specific error types
  switch (errorType) {
    case ErrorTypes.VALIDATION_ERROR:
      return "Please check your input and try again";

    case ErrorTypes.AUTHENTICATION_ERROR:
      if (error.name === "TokenExpiredError") {
        return "Your session has expired. Please log in again";
      }
      if (error.name === "JsonWebTokenError") {
        return "Invalid authentication token";
      }
      return "Authentication required";

    case ErrorTypes.AUTHORIZATION_ERROR:
      return "You do not have permission to perform this action";

    case ErrorTypes.NOT_FOUND_ERROR:
      return "The requested resource was not found";

    case ErrorTypes.CONFLICT_ERROR:
      if (error.code === "P2002") {
        const field = error.meta?.target?.[0] || "field";
        return `This ${field} is already in use`;
      }
      return "A conflict occurred with existing data";

    case ErrorTypes.RATE_LIMIT_ERROR:
      return "Too many requests. Please try again later";

    case ErrorTypes.PAYMENT_ERROR:
      return "Payment processing failed. Please check your payment details";

    case ErrorTypes.UPLOAD_ERROR:
      if (error.code === "LIMIT_FILE_SIZE") {
        return "File is too large";
      }
      if (error.code === "LIMIT_FILE_COUNT") {
        return "Too many files uploaded";
      }
      return "File upload failed";

    case ErrorTypes.DATABASE_ERROR:
      return "A database error occurred. Please try again";

    case ErrorTypes.EXTERNAL_SERVICE_ERROR:
      return "External service is temporarily unavailable";

    default:
      return "An unexpected error occurred";
  }
};

// Helper function to extract validation errors
const extractValidationErrors = (error) => {
  if (error.errors && Array.isArray(error.errors)) {
    return error.errors;
  }

  if (error.details && Array.isArray(error.details)) {
    return error.details.map((detail) => ({
      field: detail.path?.join(".") || detail.context?.key || "unknown",
      message: detail.message,
    }));
  }

  // Prisma validation errors
  if (error.code === "P2002" && error.meta?.target) {
    return [
      {
        field: error.meta.target[0],
        message: `${error.meta.target[0]} must be unique`,
      },
    ];
  }

  return null;
};

// Main error handler middleware
export const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  const errorType = determineErrorType(error);
  let message = getUserFriendlyMessage(error, errorType);
  let errors = extractValidationErrors(error);

  // Override status code based on error type
  switch (errorType) {
    case ErrorTypes.VALIDATION_ERROR:
      statusCode = 400;
      break;
    case ErrorTypes.AUTHENTICATION_ERROR:
      statusCode = 401;
      break;
    case ErrorTypes.AUTHORIZATION_ERROR:
      statusCode = 403;
      break;
    case ErrorTypes.NOT_FOUND_ERROR:
      statusCode = 404;
      break;
    case ErrorTypes.CONFLICT_ERROR:
      statusCode = 409;
      break;
    case ErrorTypes.RATE_LIMIT_ERROR:
      statusCode = 429;
      break;
    case ErrorTypes.PAYMENT_ERROR:
      statusCode = 402;
      break;
    case ErrorTypes.UPLOAD_ERROR:
      statusCode = 400;
      break;
    case ErrorTypes.DATABASE_ERROR:
      statusCode = 500;
      break;
    case ErrorTypes.EXTERNAL_SERVICE_ERROR:
      statusCode = 503;
      break;
    default:
      statusCode = 500;
  }

  // Log error for debugging
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    userId: req.user?.id,
    statusCode,
    errorType,
    message: error.message,
    stack: error.stack,
  };

  // Log based on severity
  if (statusCode >= 500) {
    console.error("🚨 Server Error:", logData);
  } else if (statusCode >= 400) {
    console.warn("⚠️  Client Error:", logData);
  }

  // Prepare response
  const errorResponse = {
    success: false,
    error: {
      type: errorType,
      message,
      statusCode,
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  // Add validation errors if present
  if (errors && errors.length > 0) {
    errorResponse.error.errors = errors;
  }

  // Add error details in development
  if (config.NODE_ENV === "development") {
    errorResponse.error.details = error.message;
    errorResponse.error.stack = error.stack;
  }

  // Add request ID if available
  if (req.requestId) {
    errorResponse.requestId = req.requestId;
  }

  // Special handling for specific errors
  if (errorType === ErrorTypes.RATE_LIMIT_ERROR && error.headers) {
    // Add rate limit headers
    Object.entries(error.headers).forEach(([key, value]) => {
      res.set(key, value);
    });
  }

  if (errorType === ErrorTypes.AUTHENTICATION_ERROR) {
    // Clear invalid tokens
    res.clearCookie("token");
    res.clearCookie("refreshToken");
  }

  res.status(statusCode).json(errorResponse);
};

// Async error handler wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for routes not found
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Unhandled promise rejection handler
export const handleUnhandledRejection = () => {
  process.on("unhandledRejection", (reason, promise) => {
    console.error("🚨 Unhandled Promise Rejection:", reason);
    console.error("Promise:", promise);

    // Graceful shutdown
    process.exit(1);
  });
};

// Uncaught exception handler
export const handleUncaughtException = () => {
  process.on("uncaughtException", (error) => {
    console.error("🚨 Uncaught Exception:", error);

    // Graceful shutdown
    process.exit(1);
  });
};

export default errorHandler;
