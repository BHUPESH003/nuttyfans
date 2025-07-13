/**
 * Enhanced Error Handler Middleware
 * Provides comprehensive error handling with proper logging and user-friendly responses
 */

/**
 * Format error response for different error types
 * @param {Error} error - The error object
 * @returns {object} - Formatted error response
 */
const formatErrorResponse = (error) => {
  const response = {
    success: false,
    message: error.message || "Internal server error",
    timestamp: new Date().toISOString(),
  };

  // Add error details for development environment
  if (process.env.NODE_ENV === "development") {
    response.stack = error.stack;
    response.details = error.details || null;
  }

  // Add validation errors if present
  if (error.errors) {
    response.errors = error.errors;
  }

  return response;
};

/**
 * Log error details
 * @param {Error} error - The error object
 * @param {Request} req - Express request object
 */
const logError = (error, req) => {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.user?.id || null,
    error: {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode || 500,
    },
  };

  // Log based on error severity
  if (error.statusCode && error.statusCode < 500) {
    console.warn("Client Error:", JSON.stringify(logData, null, 2));
  } else {
    console.error("Server Error:", JSON.stringify(logData, null, 2));
  }
};

/**
 * Handle authentication-specific errors
 * @param {Error} error - The error object
 * @returns {object} - Authentication error response
 */
const handleAuthError = (error) => {
  const authErrorMessages = {
    JsonWebTokenError: "Invalid authentication token",
    TokenExpiredError: "Authentication token has expired",
    NotBeforeError: "Authentication token is not valid yet",
    "invalid signature": "Invalid authentication token",
    "jwt malformed": "Malformed authentication token",
    "jwt must be provided": "Authentication token is required",
  };

  const message =
    authErrorMessages[error.name] ||
    authErrorMessages[error.message] ||
    "Authentication failed";

  return {
    success: false,
    message,
    error: "AUTHENTICATION_ERROR",
    timestamp: new Date().toISOString(),
  };
};

/**
 * Handle validation errors
 * @param {Error} error - The validation error object
 * @returns {object} - Validation error response
 */
const handleValidationError = (error) => {
  return {
    success: false,
    message: "Validation failed",
    error: "VALIDATION_ERROR",
    errors: error.errors || [],
    timestamp: new Date().toISOString(),
  };
};

/**
 * Handle database errors
 * @param {Error} error - The database error object
 * @returns {object} - Database error response
 */
const handleDatabaseError = (error) => {
  // Common Prisma error codes
  const prismaErrorMessages = {
    P2002: "A record with this information already exists",
    P2025: "Record not found",
    P2003: "Foreign key constraint failed",
    P2004: "Database constraint failed",
    P2014: "Invalid ID provided",
    P2016: "Query interpretation error",
    P2017: "Records for relation not connected",
    P2018: "Required connected records not found",
    P2019: "Input error",
    P2020: "Value out of range",
    P2021: "Table does not exist",
    P2022: "Column does not exist",
  };

  const message =
    prismaErrorMessages[error.code] || "Database operation failed";

  return {
    success: false,
    message,
    error: "DATABASE_ERROR",
    timestamp: new Date().toISOString(),
  };
};

/**
 * Handle rate limiting errors
 * @param {Error} error - The rate limiting error object
 * @returns {object} - Rate limiting error response
 */
const handleRateLimitError = (error) => {
  return {
    success: false,
    message: "Too many requests. Please try again later.",
    error: "RATE_LIMIT_ERROR",
    retryAfter: error.retryAfter || 60,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Handle file upload errors
 * @param {Error} error - The file upload error object
 * @returns {object} - File upload error response
 */
const handleFileUploadError = (error) => {
  const fileErrorMessages = {
    "File too large": "File size exceeds the maximum allowed limit",
    "Invalid file type": "File type is not supported",
    "No file provided": "Please select a file to upload",
    "Upload failed": "File upload failed. Please try again.",
  };

  const message =
    fileErrorMessages[error.message] || "File upload error occurred";

  return {
    success: false,
    message,
    error: "FILE_UPLOAD_ERROR",
    timestamp: new Date().toISOString(),
  };
};

/**
 * Main error handler middleware
 * @param {Error} error - The error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (error, req, res, next) => {
  // Log the error
  logError(error, req);

  // Set default status code
  let statusCode = error.statusCode || 500;
  let errorResponse;

  // Handle different error types
  switch (true) {
    // Authentication errors
    case error.name === "JsonWebTokenError":
    case error.name === "TokenExpiredError":
    case error.name === "NotBeforeError":
    case error.message?.includes("jwt"):
    case error.message?.includes("token"):
      statusCode = 401;
      errorResponse = handleAuthError(error);
      break;

    // Validation errors
    case error.message === "Validation failed":
    case error.statusCode === 400 && error.errors:
      statusCode = 400;
      errorResponse = handleValidationError(error);
      break;

    // Database errors
    case error.code?.startsWith("P20"):
    case error.name === "PrismaClientKnownRequestError":
    case error.name === "PrismaClientUnknownRequestError":
    case error.name === "PrismaClientValidationError":
      statusCode = error.code === "P2025" ? 404 : 400;
      errorResponse = handleDatabaseError(error);
      break;

    // Rate limiting errors
    case error.statusCode === 429:
      statusCode = 429;
      errorResponse = handleRateLimitError(error);
      break;

    // File upload errors
    case error.message?.includes("File"):
    case error.message?.includes("upload"):
      statusCode = 400;
      errorResponse = handleFileUploadError(error);
      break;

    // Default case
    default:
      errorResponse = formatErrorResponse(error);
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 errors for undefined routes
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

/**
 * Async error handler wrapper
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function with error handling
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global unhandled promise rejection handler
 */
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Promise Rejection:", reason);
  console.error("Promise:", promise);

  // In production, you might want to exit the process
  if (process.env.NODE_ENV === "production") {
    console.error("Shutting down due to unhandled promise rejection");
    process.exit(1);
  }
});

/**
 * Global uncaught exception handler
 */
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);

  // In production, you should exit the process
  if (process.env.NODE_ENV === "production") {
    console.error("Shutting down due to uncaught exception");
    process.exit(1);
  }
});

export default errorHandler;
