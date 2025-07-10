import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NuttyFans API",
      version: "1.0.0",
      description:
        "Complete API documentation for NuttyFans - OnlyFans-like Platform",
      contact: {
        name: "NuttyFans API Support",
        email: "support@nuttyfans.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: process.env.BASE_URL || "http://localhost:4000",
        description: "Development server",
      },
      {
        url: "https://bichance-production-a30f.up.railway.app",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token in the format: Bearer <token>",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", description: "User unique identifier" },
            username: { type: "string", description: "User username" },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            displayName: { type: "string", description: "User display name" },
            bio: { type: "string", description: "User biography" },
            avatar: { type: "string", description: "Avatar image URL" },
            coverImage: { type: "string", description: "Cover image URL" },
            isCreator: {
              type: "boolean",
              description: "Whether user is a creator",
            },
            isVerified: {
              type: "boolean",
              description: "Whether user is verified",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Post: {
          type: "object",
          properties: {
            id: { type: "string", description: "Post unique identifier" },
            title: { type: "string", description: "Post title" },
            description: { type: "string", description: "Post description" },
            content: { type: "string", description: "Post content" },
            media: {
              type: "array",
              items: { $ref: "#/components/schemas/Media" },
              description: "Post media files",
            },
            price: {
              type: "number",
              description: "Post price (for premium content)",
            },
            isPremium: {
              type: "boolean",
              description: "Whether post is premium",
            },
            likes: { type: "number", description: "Number of likes" },
            comments: { type: "number", description: "Number of comments" },
            creatorId: { type: "string", description: "Creator who posted" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Media: {
          type: "object",
          properties: {
            id: { type: "string", description: "Media unique identifier" },
            url: { type: "string", description: "Media file URL" },
            type: {
              type: "string",
              enum: ["image", "video"],
              description: "Media type",
            },
            filename: { type: "string", description: "Original filename" },
            size: { type: "number", description: "File size in bytes" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Comment: {
          type: "object",
          properties: {
            id: { type: "string", description: "Comment unique identifier" },
            content: { type: "string", description: "Comment content" },
            postId: {
              type: "string",
              description: "Post ID the comment belongs to",
            },
            userId: { type: "string", description: "User who commented" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Category: {
          type: "object",
          properties: {
            id: { type: "string", description: "Category unique identifier" },
            name: { type: "string", description: "Category name" },
            description: {
              type: "string",
              description: "Category description",
            },
            icon: { type: "string", description: "Category icon URL" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Creator: {
          type: "object",
          properties: {
            id: { type: "string", description: "Creator unique identifier" },
            userId: { type: "string", description: "Associated user ID" },
            categoryId: { type: "string", description: "Creator category" },
            subscriptionPrice: {
              type: "number",
              description: "Monthly subscription price",
            },
            description: { type: "string", description: "Creator description" },
            socialLinks: {
              type: "object",
              description: "Creator social media links",
            },
            subscribersCount: {
              type: "number",
              description: "Number of subscribers",
            },
            postsCount: { type: "number", description: "Number of posts" },
            totalEarnings: { type: "number", description: "Total earnings" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string", description: "Error message" },
            status: { type: "number", description: "HTTP status code" },
            error: { type: "string", description: "Error type" },
          },
        },
        Success: {
          type: "object",
          properties: {
            message: { type: "string", description: "Success message" },
            data: { type: "object", description: "Response data" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js"],
};

const specs = swaggerJSDoc(options);

export default specs;
