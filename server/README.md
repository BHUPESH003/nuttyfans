# OnlyFans-like Platform API

A complete API for an OnlyFans-like platform that allows content creators to monetize their content through subscriptions and one-time purchases.

## Features

- User authentication (register, login, JWT tokens)
- Creator profiles
- Content management (posts, comments, likes)
- Subscription management
- Payment processing with Stripe
- Real-time messaging and notifications
- Media upload and storage
- Admin features

## Tech Stack

- Node.js with ES6 modules
- Express.js
- PostgreSQL with Prisma ORM
- Stripe for payments
- Cloudinary for media storage
- Socket.io for real-time features
- JWT for authentication

## Setup

### Prerequisites

- Node.js (v14+)
- PostgreSQL
- Stripe account
- Cloudinary account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/riteshk-007/nf-server.git
cd nf-server
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory and add the following variables:

```
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/nfplatform?schema=public"

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Platform Settings
PLATFORM_FEE_PERCENTAGE=20

# DigitalOcean Spaces Configuration
DO_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_ACCESS_KEY=your_access_key
DO_SPACES_SECRET_KEY=your_secret_key
DO_SPACES_BUCKET=content-platform

# Media Upload Options
MEDIA_DEFAULT_QUALITY=high  # Options: high, medium, low
MAX_FILE_SIZE=52428800      # 50MB in bytes
```

4. Set up the database:

```bash
npx prisma migrate dev --name init
```

5. Start the development server:

```bash
npm run dev
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### User Endpoints

- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/avatar` - Upload avatar
- `POST /api/users/cover` - Upload cover image
- `GET /api/users/notifications` - Get user notifications
- `PUT /api/users/notifications/:id/read` - Mark notification as read
- `PUT /api/users/notifications/read-all` - Mark all notifications as read

### Creator Endpoints

- `GET /api/creators` - List creators
- `POST /api/creators` - Become a creator
- `PUT /api/creators` - Update creator profile
- `GET /api/creators/stripe-account` - Get Stripe onboarding link
- `GET /api/creators/stats` - Get creator statistics

### Post Endpoints

- `POST /api/posts` - Create post
- `GET /api/posts` - List posts
- `GET /api/posts/:id` - Get post details
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like post
- `DELETE /api/posts/:id/like` - Unlike post
- `POST /api/posts/:id/comments` - Add comment
- `GET /api/posts/:id/comments` - List comments

### Subscription Endpoints

- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions` - List user's subscriptions
- `GET /api/subscriptions/subscribers` - List creator's subscribers
- `DELETE /api/subscriptions/:id` - Cancel subscription

### Payment Endpoints

- `POST /api/payments/methods` - Add payment method
- `GET /api/payments/methods` - List payment methods
- `DELETE /api/payments/methods/:id` - Remove payment method
- `POST /api/payments/purchase` - Purchase content
- `GET /api/payments/transactions` - List transactions
- `POST /api/payments/payout` - Request payout

### Message Endpoints

- `GET /api/messages` - List conversations
- `GET /api/messages/:userId` - Get conversation
- `POST /api/messages/:userId` - Send message

## Deployment

### Production Build

```bash
npm run start
```

### Deployment Recommendations

- Use a process manager like PM2
- Set up NGINX as a reverse proxy
- Use a dedicated PostgreSQL instance
- Set up proper SSL

## License

This project is licensed under the MIT License
