# Routes Validation & Fixes

This document summarizes the route configurations and fixes applied to ensure proper media upload handling.

## ✅ Fixed Issues

### 1. **Posts Routes (`/src/routes/posts.js`)**

**Problems Fixed:**

- ❌ Duplicate multer configuration instead of using upload middleware
- ❌ Bookmarks route incorrectly placed after parameterized routes
- ❌ Missing error handling middleware
- ❌ No media quality setting

**Solutions Applied:**

- ✅ Removed duplicate multer configuration
- ✅ Used proper upload middleware (`uploadMultiple`, `handleUploadError`, `setMediaQuality`)
- ✅ Moved bookmarks route before parameterized routes
- ✅ Added proper error handling and cleanup

### 2. **Upload Middleware (`/src/middlewares/upload.js`)**

**Problems Fixed:**

- ❌ No cleanup of temp files on upload errors

**Solutions Applied:**

- ✅ Enhanced `handleUploadError` to cleanup temp files
- ✅ Added cleanup for both single and multiple file uploads
- ✅ Proper error logging

## 📋 Current Route Structure

### Posts Routes (`/api/posts`)

```
GET    /api/posts/bookmarks              - Get user's bookmarked posts
POST   /api/posts                        - Create new post (with media upload)
GET    /api/posts                        - Get posts (with filters)
GET    /api/posts/:id                    - Get specific post
PUT    /api/posts/:id                    - Update post (with media upload)
DELETE /api/posts/:id                    - Delete post (with media cleanup)

POST   /api/posts/:id/like               - Like a post
DELETE /api/posts/:id/like               - Unlike a post

POST   /api/posts/:id/bookmark           - Bookmark a post
DELETE /api/posts/:id/bookmark           - Remove bookmark

POST   /api/posts/:postId/comments       - Add comment to post
GET    /api/posts/:postId/comments       - Get post comments

POST   /api/posts/:id/media              - Add media to existing post
DELETE /api/posts/:id/media/:index       - Remove specific media from post
```

### Media Routes (`/api/media`)

```
POST   /api/media/presigned-url          - Get presigned upload URL
PUT    /api/media/:mediaId/confirm       - Confirm media upload
POST   /api/media/upload                 - Direct media upload
PUT    /api/media/:mediaId               - Update media file
DELETE /api/media/:mediaId               - Delete media file
GET    /api/media                        - Get user's media files
GET    /api/media/:mediaId               - Get specific media details

GET    /api/media/admin/failed           - [Admin] Get failed uploads
DELETE /api/media/admin/cleanup          - [Admin] Cleanup orphaned media
```

## 🔧 Middleware Configuration

### Upload Middleware

```javascript
// For single file uploads
uploadSingle("fieldName");
handleUploadError;
setMediaQuality("high");

// For multiple file uploads (max 5)
uploadMultiple("files", 5);
handleUploadError;
setMediaQuality("high");
```

### Authentication

```javascript
protect; // Requires authentication
admin; // Requires admin role
```

## 📁 File Upload Flow

### 1. **Post Creation with Media**

```
POST /api/posts
├── uploadMultiple("files", 5)
├── handleUploadError (cleanup on multer errors)
├── setMediaQuality("high")
└── createPost (upload to Digital Ocean + cleanup)
```

### 2. **Direct Media Upload**

```
POST /api/media/upload
├── uploadSingle("file")
├── handleUploadError (cleanup on multer errors)
├── setMediaQuality("high")
└── uploadMedia (upload to Digital Ocean + cleanup)
```

## 🚨 Error Handling

### Middleware Level

- **Upload Errors**: Temp files cleaned up immediately by `handleUploadError`
- **File Type Errors**: Rejected with proper error message
- **File Size Errors**: Rejected with proper error message

### Controller Level

- **Digital Ocean Upload Errors**: Temp files cleaned up + rollback
- **Database Errors**: Both temp and uploaded files cleaned up
- **General Errors**: Complete cleanup of all temp files

## 🔄 Route Dependencies

### Required Services

- ✅ Digital Ocean Spaces configuration
- ✅ Prisma database connection
- ✅ JWT authentication
- ✅ Multer file upload

### Required Directories

- ✅ `public/uploads/temp` (auto-created)
- ✅ Scheduled cleanup tasks

## 🧪 Testing Routes

### Manual Testing

```bash
# Test post creation with images
curl -X POST http://localhost:4000/api/posts \
  -H "Authorization: Bearer <token>" \
  -F "title=Test Post" \
  -F "content=Test content" \
  -F "files=@image1.jpg" \
  -F "files=@image2.png"

# Test post deletion (should cleanup media)
curl -X DELETE http://localhost:4000/api/posts/<post-id> \
  -H "Authorization: Bearer <token>"

# Test bookmarks
curl -X GET http://localhost:4000/api/posts/bookmarks \
  -H "Authorization: Bearer <token>"
```

### Expected Behaviors

- ✅ Files upload to Digital Ocean Spaces
- ✅ Temp files are cleaned up
- ✅ Error responses include proper cleanup
- ✅ Post deletion removes media from storage
- ✅ Bookmarks route accessible

## 🔐 Security Considerations

- ✅ File type validation
- ✅ File size limits (from env.js)
- ✅ Authentication required for all upload endpoints
- ✅ User ownership validation for media operations
- ✅ Admin-only access for cleanup operations

## 📊 Monitoring

### What to Monitor

- Temp directory size (should stay small)
- Failed uploads in logs
- Digital Ocean Spaces usage
- Database orphaned records
- Scheduled task execution

### Log Messages to Watch

- `"Cleaned up temp file after upload error"`
- `"Failed to cleanup uploaded file"`
- `"Media cleanup completed"`
- `"Temp files cleanup completed"`
