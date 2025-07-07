# NuttyFans API Documentation

## Table of Contents

- [Authentication Endpoints](#authentication-endpoints)
- [User Management Endpoints](#user-management-endpoints)
- [Avatar & Media Endpoints](#avatar--media-endpoints)
- [Social Features Endpoints](#social-features-endpoints)
- [Error Handling](#error-handling)
- [Data Models](#data-models)
- [Authentication Flow Examples](#authentication-flow-examples)

---

## Authentication Endpoints

### Base URL: `/api/auth`

#### 1. Register User

```http
POST /api/auth/register
```

**Request Body:**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Registration successful! Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "fullName": "John Doe",
      "isEmailVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "requiresEmailVerification": true
  }
}
```

#### 2. Login with Email/Password

```http
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "fullName": "John Doe",
      "avatarUrl": "https://cdn.example.com/avatar.jpg",
      "isEmailVerified": true,
      "twoFactorEnabled": false
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

**Response with 2FA (200):**

```json
{
  "success": true,
  "message": "2FA required",
  "requiresTwoFactor": true,
  "tempToken": "temporary_jwt_token"
}
```

#### 3. Request OTP (Passwordless Login)

```http
POST /api/auth/request-otp
```

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login code sent to your email"
}
```

#### 4. Verify OTP

```http
POST /api/auth/verify-otp
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      /* user object */
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### 5. Google OAuth Login

```http
POST /api/auth/google/login
```

**Request Body:**

```json
{
  "credential": "google_id_token",
  "clientId": "google_client_id"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      /* user object */
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "isNewUser": false
  }
}
```

#### 6. Email Verification

```http
POST /api/auth/verify-email
```

**Request Body:**

```json
{
  "token": "verification_token"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Email verified successfully! Welcome to the platform.",
  "data": {
    "user": {
      /* user object */
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### 7. Resend Email Verification

```http
POST /api/auth/resend-verification
```

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

#### 8. Forgot Password

```http
POST /api/auth/forgot-password
```

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

#### 9. Reset Password

```http
POST /api/auth/reset-password
```

**Request Body:**

```json
{
  "token": "reset_token",
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

#### 10. Refresh Token

```http
POST /api/auth/refresh-token
```

**Request Body:**

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

#### 11. Get Current User (Protected)

```http
GET /api/auth/me
Authorization: Bearer {access_token}
```

#### 12. Logout (Protected)

```http
POST /api/auth/logout
Authorization: Bearer {access_token}
```

#### 13. Setup 2FA (Protected)

```http
POST /api/auth/2fa/setup
Authorization: Bearer {access_token}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "secret": "2fa_secret",
    "qrCode": "data:image/png;base64,qr_code_data",
    "backupCodes": []
  },
  "message": "Scan the QR code with your authenticator app and verify to complete setup"
}
```

#### 14. Enable 2FA (Protected)

```http
POST /api/auth/2fa/enable
Authorization: Bearer {access_token}
```

**Request Body:**

```json
{
  "token": "123456"
}
```

#### 15. Verify 2FA

```http
POST /api/auth/verify-2fa
```

**Request Body:**

```json
{
  "token": "123456",
  "tempToken": "temporary_jwt_token"
}
```

---

## User Management Endpoints

### Base URL: `/api/users`

#### 1. Get User Profile by Username

```http
GET /api/users/{username}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "john_doe",
    "fullName": "John Doe",
    "bio": "Creator and entrepreneur",
    "avatarUrl": "https://cdn.example.com/avatar.jpg",
    "coverImageUrl": "https://cdn.example.com/cover.jpg",
    "isOnline": true,
    "lastActiveAt": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "location": "New York, NY",
    "website": "https://johndoe.com",
    "isPrivateProfile": false,
    "profile": {
      "monthlyPrice": 9.99,
      "isVerified": true,
      "displayName": "John Doe Official",
      "tagline": "Creating amazing content",
      "about": "Welcome to my profile!"
    },
    "_count": {
      "posts": 25,
      "subscribers": 150,
      "followers": 200,
      "following": 50
    },
    "isSubscribed": false,
    "isFollowing": true,
    "canViewFullProfile": true,
    "recentPosts": [
      /* array of posts */
    ]
  }
}
```

#### 2. Update Profile (Protected)

```http
PUT /api/users/profile
Authorization: Bearer {access_token}
```

**Request Body:**

```json
{
  "fullName": "John Doe Updated",
  "bio": "Updated bio",
  "location": "San Francisco, CA",
  "website": "https://newwebsite.com",
  "isPrivateProfile": false,
  "emailNotifications": true,
  "pushNotifications": true
}
```

#### 3. Upload Avatar (Protected)

```http
POST /api/users/avatar
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Form Data:**

- `avatar`: Image file (max 5MB, JPEG/PNG/GIF/WebP)

**Response (200):**

```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatarUrl": "https://cdn.example.com/new-avatar.jpg"
  }
}
```

#### 4. Delete Avatar (Protected)

```http
DELETE /api/users/avatar
Authorization: Bearer {access_token}
```

#### 5. Upload Cover Image (Protected)

```http
POST /api/users/cover
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Form Data:**

- `cover`: Image file (max 10MB, JPEG/PNG/GIF/WebP)

#### 6. Delete Cover Image (Protected)

```http
DELETE /api/users/cover
Authorization: Bearer {access_token}
```

#### 7. Update Password (Protected)

```http
PUT /api/users/password
Authorization: Bearer {access_token}
```

**Request Body:**

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

---

## Social Features Endpoints

#### 1. Follow User (Protected)

```http
POST /api/users/{userId}/follow
Authorization: Bearer {access_token}
```

#### 2. Unfollow User (Protected)

```http
DELETE /api/users/{userId}/follow
Authorization: Bearer {access_token}
```

#### 3. Get User Followers

```http
GET /api/users/{userId}/followers?page=1&limit=20
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "followers": [
      {
        "id": "uuid",
        "username": "follower1",
        "fullName": "Follower One",
        "avatarUrl": "https://cdn.example.com/avatar1.jpg",
        "isOnline": true,
        "profile": {
          "isVerified": false
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 150,
      "totalPages": 8
    }
  }
}
```

#### 4. Get User Following

```http
GET /api/users/{userId}/following?page=1&limit=20
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Please check your input and try again",
    "statusCode": 400,
    "errors": [
      {
        "field": "email",
        "message": "Please enter a valid email address"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/auth/register"
}
```

### Error Types

- `VALIDATION_ERROR` (400): Input validation failed
- `AUTHENTICATION_ERROR` (401): Authentication required or failed
- `AUTHORIZATION_ERROR` (403): Insufficient permissions
- `NOT_FOUND_ERROR` (404): Resource not found
- `CONFLICT_ERROR` (409): Resource conflict (e.g., email already exists)
- `RATE_LIMIT_ERROR` (429): Too many requests
- `PAYMENT_ERROR` (402): Payment processing failed
- `UPLOAD_ERROR` (400): File upload failed
- `DATABASE_ERROR` (500): Database operation failed
- `EXTERNAL_SERVICE_ERROR` (503): External service unavailable
- `INTERNAL_SERVER_ERROR` (500): Unexpected server error

---

## Data Models

### User Model

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  isEmailVerified: boolean;
  isOnline: boolean;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
  location?: string;
  website?: string;
  dateOfBirth?: Date;
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  isPrivateProfile: boolean;
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  role: "USER" | "ADMIN" | "MODERATOR";
  isActive: boolean;
}
```

### Creator Profile Model

```typescript
interface CreatorProfile {
  id: string;
  userId: string;
  monthlyPrice: number;
  displayName?: string;
  tagline?: string;
  about?: string;
  isVerified: boolean;
  verificationLevel: "NONE" | "BASIC" | "PREMIUM" | "ELITE";
  profileImageUrl?: string;
  bannerImageUrl?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    website?: string;
    facebook?: string;
    linkedin?: string;
    discord?: string;
    telegram?: string;
  };
  customWelcomeMessage?: string;
  isAcceptingTips: boolean;
  tipMinAmount?: number;
  contentRating: "ALL_AGES" | "TEEN" | "MATURE" | "ADULT";
  allowComments: boolean;
  requireApproval: boolean;
  subscriberCount: number;
  postCount: number;
}
```

---

## Authentication Flow Examples

### 1. Standard Email/Password Registration & Login

```javascript
// 1. Register
const registerResponse = await fetch("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "john_doe",
    email: "john@example.com",
    password: "SecurePass123!",
    confirmPassword: "SecurePass123!",
    fullName: "John Doe",
  }),
});

// 2. User receives email verification
// 3. Verify email
const verifyResponse = await fetch("/api/auth/verify-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    token: "verification_token_from_email",
  }),
});

// 4. Login
const loginResponse = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "john@example.com",
    password: "SecurePass123!",
  }),
});

const { data } = await loginResponse.json();
const { accessToken, refreshToken } = data;
```

### 2. Passwordless OTP Login

```javascript
// 1. Request OTP
const otpResponse = await fetch("/api/auth/request-otp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "john@example.com",
  }),
});

// 2. User receives OTP via email
// 3. Verify OTP
const verifyOtpResponse = await fetch("/api/auth/verify-otp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "john@example.com",
    otp: "123456",
  }),
});

const { data } = await verifyOtpResponse.json();
const { accessToken, refreshToken } = data;
```

### 3. Google OAuth Login

```javascript
// Frontend: Use Google Sign-In library to get credential
// Then send to backend
const googleLoginResponse = await fetch("/api/auth/google/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    credential: google_credential_from_frontend,
  }),
});

const { data } = await googleLoginResponse.json();
const { accessToken, refreshToken, isNewUser } = data;
```

### 4. Two-Factor Authentication Setup

```javascript
// 1. Setup 2FA
const setup2FAResponse = await fetch("/api/auth/2fa/setup", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
});

const { data: setupData } = await setup2FAResponse.json();
const { qrCode, secret } = setupData;

// 2. User scans QR code with authenticator app
// 3. Enable 2FA with token from app
const enable2FAResponse = await fetch("/api/auth/2fa/enable", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    token: "123456", // From authenticator app
  }),
});

const { data: enableData } = await enable2FAResponse.json();
const { backupCodes } = enableData;
```

### 5. Login with 2FA

```javascript
// 1. Login normally
const loginResponse = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "john@example.com",
    password: "SecurePass123!",
  }),
});

const loginData = await loginResponse.json();

if (loginData.requiresTwoFactor) {
  const { tempToken } = loginData;

  // 2. Verify 2FA token
  const verify2FAResponse = await fetch("/api/auth/verify-2fa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: "123456", // From authenticator app
      tempToken,
    }),
  });

  const { data } = await verify2FAResponse.json();
  const { accessToken, refreshToken } = data;
}
```

### 6. Avatar Upload

```javascript
const formData = new FormData();
formData.append("avatar", fileInput.files[0]);

const uploadResponse = await fetch("/api/users/avatar", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
  body: formData,
});

const { data } = await uploadResponse.json();
const { avatarUrl } = data;
```

### 7. Token Refresh

```javascript
const refreshResponse = await fetch("/api/auth/refresh-token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    refreshToken: stored_refresh_token,
  }),
});

if (refreshResponse.ok) {
  const { data } = await refreshResponse.json();
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data;
  // Update stored tokens
} else {
  // Redirect to login
}
```

---

## Request/Response Headers

### Authentication Headers

```http
Authorization: Bearer {access_token}
```

### Common Response Headers

```http
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

### File Upload Headers

```http
Content-Type: multipart/form-data
```

---

## Rate Limiting

- Authentication endpoints: 5 requests per minute per IP
- Avatar upload: 3 requests per minute per user
- Password reset: 3 requests per hour per IP
- Email verification: 5 requests per hour per email
- General API: 100 requests per minute per user

---

## Security Features

1. **Password Requirements**: Minimum 8 characters with uppercase, lowercase, number, and special character
2. **JWT Tokens**: Access tokens expire in 15 minutes, refresh tokens in 7 days
3. **Rate Limiting**: Prevents brute force attacks
4. **Email Verification**: Required for new accounts
5. **Two-Factor Authentication**: Optional TOTP-based 2FA
6. **Secure File Upload**: File type and size validation
7. **CORS Protection**: Configured for allowed origins
8. **Input Validation**: Comprehensive validation on all endpoints
9. **Error Handling**: Detailed error responses without exposing sensitive data
10. **Logging**: Comprehensive logging for security monitoring
