# Content Creator Platform API Documentation

This document provides detailed information about the API endpoints available in the Content Creator Platform.

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Authentication Endpoints

#### Register a new user

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:
  ```json
  {
    "username": "ritesh",
    "email": "test@example.com",
    "password": "securepassword",
    "fullName": "Ritesh Kumar"
  }
  ```
- **Success Response**:
  - **Code**: 201
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "user": {
          "id": "uuid",
          "username": "ritesh",
          "email": "test@example.com",
          "fullName": "Ritesh Kumar",
          "role": "USER",
          "createdAt": "2023-01-01T00:00:00.000Z"
        },
        "accessToken": "jwt_token",
        "refreshToken": "refresh_token",
        "expiresIn": 3600
      }
    }
    ```

#### Login

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:
  ```json
  {
    "email": "test@example.com",
    "password": "securepassword"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**: Similar to register response

#### Refresh Access Token

- **URL**: `/api/auth/refresh-token`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:
  ```json
  {
    "refreshToken": "refresh_token"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "new_jwt_token",
        "refreshToken": "new_refresh_token",
        "expiresIn": 3600
      }
    }
    ```

#### Get Current User

- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "id": "uuid",
        "username": "ritesh",
        "email": "test@example.com",
        "fullName": "Ritesh Kumar",
        "role": "USER",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "profile": {
          /* creator profile if exists */
        },
        "_count": {
          "posts": 10,
          "subscribers": 5,
          "subscriptions": 2
        }
      }
    }
    ```

## Media Management

Our platform supports advanced media handling using DigitalOcean Spaces (S3-compatible storage). We offer two approaches for uploading files:

1. **Direct-to-S3 Upload**: Get a pre-signed URL and upload directly from the frontend
2. **Server-Side Upload**: Traditional upload through the server

### Media Endpoints

#### Generate Pre-signed URL for Direct Upload

- **URL**: `/api/media/presigned-url`
- **Method**: `POST`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "fileName": "my-image.jpg",
    "contentType": "image/jpeg",
    "folder": "posts",
    "maxSize": 10485760 // Optional, max 10MB
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "presignedUrl": "https://bucket.endpoint.com/uploads/123/abc.jpg?signature...",
        "key": "posts/user123/abcdef123456.jpg",
        "publicUrl": "https://bucket.endpoint.com/posts/user123/abcdef123456.jpg",
        "mediaId": "uuid",
        "metadata": {
          "originalFilename": "my-image.jpg",
          "contentType": "image/jpeg",
          "folder": "posts",
          "userId": "user123"
        }
      },
      "message": "Upload URL generated successfully. Upload directly from frontend."
    }
    ```

#### Confirm Media Upload Completion

- **URL**: `/api/media/:mediaId/confirm`
- **Method**: `PUT`
- **Auth Required**: Yes
- **URL Params**: `mediaId=[string]`
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "id": "uuid",
        "key": "posts/user123/abcdef123456.jpg",
        "url": "https://bucket.endpoint.com/posts/user123/abcdef123456.jpg",
        "fileName": "my-image.jpg",
        "contentType": "image/jpeg",
        "mediaType": "IMAGE",
        "uploadStatus": "COMPLETED",
        "userId": "user123",
        "folder": "posts",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:01:00.000Z"
      },
      "message": "Media upload confirmed"
    }
    ```

#### Server-side Media Upload

- **URL**: `/api/media/upload`
- **Method**: `POST`
- **Auth Required**: Yes
- **Headers**: `Content-Type: multipart/form-data`
- **Body**:
  - `file`: The file to upload
  - `folder`: Folder to store the file in (e.g., "posts", "profile", "messages")
  - `generateThumbnail`: Whether to generate a thumbnail (true/false)
- **Success Response**:
  - **Code**: 201
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "id": "uuid",
        "key": "posts/abcdef123456.jpg",
        "url": "https://bucket.endpoint.com/posts/abcdef123456.jpg",
        "fileName": "my-image.jpg",
        "contentType": "image/jpeg",
        "mediaType": "IMAGE",
        "uploadStatus": "COMPLETED",
        "userId": "user123",
        "folder": "posts",
        "metadata": {
          "size": 1234567,
          "quality": "high",
          "hasThumbnail": true
        },
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    }
    ```

#### Update Existing Media

- **URL**: `/api/media/:mediaId`
- **Method**: `PUT`
- **Auth Required**: Yes
- **URL Params**: `mediaId=[string]`
- **Headers**: `Content-Type: multipart/form-data`
- **Body**:
  - `file`: The new file to replace the existing one
  - `generateThumbnail`: Whether to generate a thumbnail (true/false)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "id": "uuid",
        "key": "posts/efghij789012.jpg",
        "url": "https://bucket.endpoint.com/posts/efghij789012.jpg",
        "fileName": "updated-image.jpg",
        "contentType": "image/jpeg",
        "mediaType": "IMAGE",
        "uploadStatus": "COMPLETED",
        "userId": "user123",
        "folder": "posts",
        "metadata": {
          "size": 2345678,
          "quality": "high",
          "hasThumbnail": true,
          "updatedAt": "2023-01-02T00:00:00.000Z"
        },
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-02T00:00:00.000Z"
      },
      "message": "Media updated successfully"
    }
    ```

#### Delete Media

- **URL**: `/api/media/:mediaId`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **URL Params**: `mediaId=[string]`
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "message": "Media deleted successfully"
    }
    ```

#### Get User's Media

- **URL**: `/api/media`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Params**:
  - `page=[number]` - Page number (default: 1)
  - `limit=[number]` - Items per page (default: 20)
  - `mediaType=[string]` - Filter by media type (IMAGE, VIDEO, AUDIO, DOCUMENT)
  - `folder=[string]` - Filter by folder
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "media": [
          {
            "id": "uuid",
            "key": "posts/abcdef123456.jpg",
            "url": "https://bucket.endpoint.com/posts/abcdef123456.jpg",
            "fileName": "my-image.jpg",
            "contentType": "image/jpeg",
            "mediaType": "IMAGE",
            "uploadStatus": "COMPLETED",
            "userId": "user123",
            "folder": "posts",
            "metadata": {
              "size": 1234567,
              "quality": "high",
              "hasThumbnail": true
            },
            "createdAt": "2023-01-01T00:00:00.000Z",
            "updatedAt": "2023-01-01T00:00:00.000Z"
          }
          // more media items...
        ],
        "pagination": {
          "page": 1,
          "limit": 20,
          "totalCount": 45,
          "totalPages": 3
        }
      }
    }
    ```

#### Get Media Details

- **URL**: `/api/media/:mediaId`
- **Method**: `GET`
- **Auth Required**: Yes
- **URL Params**: `mediaId=[string]`
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "id": "uuid",
        "key": "posts/abcdef123456.jpg",
        "url": "https://bucket.endpoint.com/posts/abcdef123456.jpg",
        "fileName": "my-image.jpg",
        "contentType": "image/jpeg",
        "mediaType": "IMAGE",
        "uploadStatus": "COMPLETED",
        "userId": "user123",
        "folder": "posts",
        "metadata": {
          "size": 1234567,
          "quality": "high",
          "hasThumbnail": true
        },
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    }
    ```

## Messages

### Message Endpoints

#### Send Message

- **URL**: `/api/messages`
- **Method**: `POST`
- **Auth Required**: Yes
- **Headers**: `Content-Type: multipart/form-data` (if sending media)
- **Body**:
  - `receiverId`: ID of the user to send the message to
  - `content`: Text content of the message
  - `media`: Media file to attach (optional)
- **Success Response**:
  - **Code**: 201
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "id": "uuid",
        "content": "Hello there!",
        "mediaUrl": "https://bucket.endpoint.com/messages/abcdef123456.jpg",
        "mediaType": "IMAGE",
        "senderId": "user123",
        "receiverId": "user456",
        "isRead": false,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "sender": {
          "id": "user123",
          "username": "ritesh",
          "avatarUrl": "https://example.com/avatar.jpg"
        }
      }
    }
    ```

#### Get Conversations

- **URL**: `/api/messages/conversations`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": [
        {
          "userId": "user456",
          "username": "janedoe",
          "avatarUrl": "https://example.com/avatar2.jpg",
          "lastMessageAt": "2023-01-01T00:00:00.000Z",
          "unreadCount": 2,
          "lastMessage": {
            "id": "uuid",
            "content": "Hello there!",
            "mediaUrl": null,
            "createdAt": "2023-01-01T00:00:00.000Z",
            "senderId": "user456"
          }
        }
        // more conversations...
      ]
    }
    ```

#### Get Conversation with User

- **URL**: `/api/messages/conversations/:userId`
- **Method**: `GET`
- **Auth Required**: Yes
- **URL Params**: `userId=[string]`
- **Query Params**:
  - `page=[number]` - Page number (default: 1)
  - `limit=[number]` - Items per page (default: 20)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "user": {
          "id": "user456",
          "username": "janedoe",
          "avatarUrl": "https://example.com/avatar2.jpg"
        },
        "messages": [
          {
            "id": "uuid",
            "content": "Hi John!",
            "mediaUrl": null,
            "mediaType": null,
            "senderId": "user456",
            "receiverId": "user123",
            "isRead": true,
            "createdAt": "2023-01-01T00:00:00.000Z",
            "sender": {
              "id": "user456",
              "username": "janedoe",
              "avatarUrl": "https://example.com/avatar2.jpg"
            }
          }
          // more messages...
        ],
        "pagination": {
          "page": 1,
          "limit": 20,
          "totalCount": 45,
          "totalPages": 3
        }
      }
    }
    ```

#### Mark Message as Read

- **URL**: `/api/messages/read/:messageId`
- **Method**: `PUT`
- **Auth Required**: Yes
- **URL Params**: `messageId=[string]`
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "message": "Message marked as read"
    }
    ```

#### Mark All Messages from User as Read

- **URL**: `/api/messages/read-all/:userId`
- **Method**: `PUT`
- **Auth Required**: Yes
- **URL Params**: `userId=[string]`
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "message": "5 messages marked as read",
      "count": 5
    }
    ```

## Posts

### Post Endpoints

#### Create Post

- **URL**: `/api/posts`
- **Method**: `POST`
- **Auth Required**: Yes
- **Headers**: `Content-Type: multipart/form-data` (if uploading files)
- **Body**:
  - `title`: Post title (optional)
  - `content`: Post content (optional)
  - `isPremium`: Whether the post is premium (true/false)
  - `price`: Price for PPV content (required if isPremium is true)
  - `categories`: Array of category IDs
  - `files`: Array of files to upload (optional)
- **Success Response**:
  - **Code**: 201
  - **Content**:
    ```json
    {
      "success": true,
      "data": {
        "id": "uuid",
        "title": "My first post",
        "content": "Hello world!",
        "isPremium": false,
        "mediaUrls": ["https://bucket.endpoint.com/posts/abcdef123456.jpg"],
        "mediaType": ["IMAGE"],
        "userId": "user123",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    }
    ```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": {
    "message": "Error message here",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

### Common Error Codes

- **400** - Bad Request (invalid input)
- **401** - Unauthorized (authentication required)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **409** - Conflict (resource already exists)
- **422** - Unprocessable Entity (validation errors)
- **500** - Internal Server Error

## Pagination

Endpoints that return lists of items support pagination with the following parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default varies by endpoint)

Response format includes pagination metadata:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 45,
    "totalPages": 3
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- Authentication endpoints: 10 requests per minute
- General endpoints: 60 requests per minute
- Media upload endpoints: 30 requests per 5 minutes

When rate limit is exceeded, the server responds with a 429 status code:

```json
{
  "success": false,
  "error": {
    "message": "Too many requests, please try again later",
    "code": "RATE_LIMIT_EXCEEDED",
    "statusCode": 429,
    "retryAfter": 60
  }
}
```

## Frontend Integration Guidelines

### Direct-to-S3 Upload Implementation

To implement direct-to-S3 uploads from the frontend:

1. Request a pre-signed URL from `/api/media/presigned-url`
2. Use the URL to upload the file directly from the browser:

```javascript
// Example JavaScript implementation
async function uploadDirectToS3(file) {
  // Step 1: Get pre-signed URL
  const response = await fetch("/api/media/presigned-url", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      folder: "posts",
    }),
  });

  const { data } = await response.json();

  // Step 2: Upload directly to S3
  await fetch(data.presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  // Step 3: Confirm upload completion
  await fetch(`/api/media/${data.mediaId}/confirm`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data.publicUrl;
}
```
