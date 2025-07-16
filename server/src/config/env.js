import dotenv from "dotenv";

dotenv.config();

export const config = {
  // Server
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  CORS_ORIGINS:
    process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5173",

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRY: parseInt(process.env.JWT_EXPIRY) || 3600, // 1 hour
  JWT_REFRESH_EXPIRY: parseInt(process.env.JWT_REFRESH_EXPIRY) || 604800, // 7 days

  // Email Service - Brevo SMTP
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT) || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM,

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,

  // Square Payment Gateway
  SQUARE_APP_ID: process.env.SQUARE_APP_ID,
  SQUARE_APP_SECRET: process.env.SQUARE_APP_SECRET,
  SQUARE_ACCESS_TOKEN: process.env.SQUARE_ACCESS_TOKEN,
  SQUARE_LOCATION_ID: process.env.SQUARE_LOCATION_ID,
  SQUARE_ENVIRONMENT: process.env.SQUARE_ENVIRONMENT || "sandbox",

  // AWS S3
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
  AWS_S3_REGION:
    process.env.AWS_S3_REGION || process.env.AWS_REGION || "us-east-1",

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB
  MEDIA_DEFAULT_QUALITY: process.env.MEDIA_DEFAULT_QUALITY || "high",

  // Platform Settings
  PLATFORM_FEE_PERCENTAGE:
    parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 20,
};

// Validate required environment variables
const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_S3_BUCKET",
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV !== "test") {
  console.error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  process.exit(1);
}
