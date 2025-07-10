# NuttyFans API - Comprehensive Documentation

## 📖 API Documentation Overview

Welcome to the NuttyFans API documentation! This API powers a complete OnlyFans-like platform with user authentication, content creation, subscriptions, and media management.

## 🚀 Getting Started

### Swagger UI Documentation

Access the interactive API documentation at: **`/docs`**

- **Local Development**: http://localhost:4000/docs
- **Production**: https://bichance-production-a30f.up.railway.app/docs

### Base URL

- **Development**: `http://localhost:4000`
- **Production**: `https://bichance-production-a30f.up.railway.app`

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting Started Authentication Flow

1. **Register a new account**:

   ```
   POST /api/auth/register
   {
     "username": "john_doe",
     "email": "john@example.com",
     "password": "password123",
     "displayName": "John Doe"
   }
   ```

2. **Login to get your token**:

   ```
   POST /api/auth/login
   {
     "identifier": "john@example.com",
     "password": "password123"
   }
   ```

3. **Use the token for protected endpoints**:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 📑 API Endpoint Categories

### 🔑 Authentication (/api/auth)

- **User Registration & Login**
- **OAuth Integration (Google)**
- **OTP-based Passwordless Login**
- **2FA Setup and Verification**
- **Password Reset**
- **Email Verification**

### 👤 Users (/api/users)

- **Profile Management**
- **Avatar & Cover Image Upload**
- **Follow/Unfollow System**
- **User Stats & Analytics**
- **Notification Management**

### 🎨 Creators (/api/creators)

- **Creator Registration**
- **Creator Profile Management**
- **Creator Discovery (Popular, Verified)**
- **Category-based Creator Filtering**
- **Creator Analytics**

### 📝 Posts (/api/posts)

- **Create, Read, Update, Delete Posts**
- **Media Upload (Images/Videos)**
- **Like/Unlike Posts**
- **Bookmark Posts**
- **Comment System**
- **Premium Content Management**

### 🏷️ Categories (/api/categories)

- **Category Management (Admin)**
- **Category Listing**
- **Creator Categorization**

### 📸 Media (/api/media)

- **Direct S3 Upload with Presigned URLs**
- **Media Management**
- **Image/Video Processing**
- **Media Cleanup (Admin)**

### 💳 Additional Modules

- **Subscriptions** (/api/subscriptions)
- **Payments** (/api/payments)
- **Messages** (/api/messages)
- **Notifications** (/api/notifications)
- **Search** (/api/search)

## 💡 Example Usage Scenarios

### Scenario 1: New User Registration & Profile Setup

```bash
# 1. Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jane_creator",
    "email": "jane@example.com",
    "password": "securepass123",
    "displayName": "Jane Creator"
  }'

# 2. Update Profile
curl -X PUT http://localhost:4000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Content creator specializing in fitness",
    "website": "https://janefitness.com",
    "location": "Los Angeles, CA"
  }'

# 3. Upload Avatar
curl -X POST http://localhost:4000/api/users/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@/path/to/avatar.jpg"
```

### Scenario 2: Becoming a Creator & Creating Content

```bash
# 1. Become a Creator
curl -X POST http://localhost:4000/api/creators \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "fitness-category-id",
    "subscriptionPrice": 19.99,
    "description": "Professional fitness trainer and nutritionist"
  }'

# 2. Create a Post with Media
curl -X POST http://localhost:4000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=My First Workout Video" \
  -F "content=Check out this amazing workout routine!" \
  -F "isPremium=false" \
  -F "files=@/path/to/workout-video.mp4" \
  -F "files=@/path/to/thumbnail.jpg"
```

### Scenario 3: User Interaction Flow

```bash
# 1. Get Popular Creators
curl -X GET "http://localhost:4000/api/creators/popular?limit=10"

# 2. Follow a Creator
curl -X POST http://localhost:4000/api/users/creator-user-id/follow \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Like a Post
curl -X POST http://localhost:4000/api/posts/post-id/like \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Bookmark a Post
curl -X POST http://localhost:4000/api/posts/post-id/bookmark \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Add a Comment
curl -X POST http://localhost:4000/api/posts/post-id/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great content! Keep it up!"
  }'
```

## 🛡️ Security Features

- **JWT Authentication** with refresh tokens
- **Role-based Access Control** (User, Creator, Admin)
- **Rate Limiting** on sensitive endpoints
- **Input Validation** using Joi schemas
- **File Upload Security** with type and size restrictions
- **2FA Support** for enhanced security

## 📱 Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "message": "Error description",
  "status": 400,
  "error": "ValidationError"
}
```

## 🔧 Development Tools

### Using Swagger UI

1. Navigate to `/docs` endpoint
2. Click "Authorize" button
3. Enter your JWT token as: `Bearer <token>`
4. Test endpoints directly in the browser

### Postman Collection

Import the API into Postman using the OpenAPI specification available at `/docs/swagger.json`

## 📞 Support

For API support and questions:

- Email: support@nuttyfans.com
- Documentation: Available at `/docs`
- Status: Check `/health` endpoint

## 🚦 Rate Limits

- **Authentication endpoints**: 5 requests per minute
- **File upload endpoints**: 10 requests per hour
- **General endpoints**: 100 requests per minute
- **Admin endpoints**: 50 requests per minute

## 📊 Monitoring

- **Health Check**: `GET /health`
- **API Status**: Monitor response times and error rates
- **Usage Analytics**: Track API usage patterns

---

**Happy coding! 🚀**

> For detailed endpoint specifications, request/response schemas, and interactive testing, visit the Swagger UI documentation at `/docs`
