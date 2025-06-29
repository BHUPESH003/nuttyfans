import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { config } from "../config/env.js";
import prisma from "../config/prisma.js";
import {
  uploadToSpaces,
  deleteFromSpaces,
  generatePresignedUrl,
  getKeyFromUrl,
  getMediaTypeFromFilename,
} from "./digitalOceanService.js";

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (filePath, folder = "") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });

    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting local file:", err);
    });

    return result;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Failed to upload file");
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw new Error("Failed to delete file");
  }
};

export const getMediaTypeFromFilename = (filename) => {
  const ext = path.extname(filename).toLowerCase();

  if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
    return "IMAGE";
  } else if ([".mp4", ".mov", ".avi", ".webm"].includes(ext)) {
    return "VIDEO";
  } else if ([".mp3", ".wav", ".ogg"].includes(ext)) {
    return "AUDIO";
  } else {
    return "DOCUMENT";
  }
};

export const getPublicIdFromUrl = (url) => {
  if (!url) return null;

  try {
    const parts = url.split("/");
    const uploadIndex = parts.findIndex((part) => part === "upload");

    if (uploadIndex === -1) return null;

    const afterUpload = parts.slice(uploadIndex + 1);
    const fileName = afterUpload[afterUpload.length - 1];
    const fileNameWithoutExt = fileName.split(".")[0];

    const result = [...afterUpload.slice(0, -1), fileNameWithoutExt].join("/");

    return result;
  } catch (error) {
    console.error("Error extracting public ID from URL:", error);
    return null;
  }
};

export const uploadMedia = async (filePath, folder, userId, options = {}) => {
  try {
    // Upload to DigitalOcean Spaces
    const uploadResult = await uploadToSpaces(filePath, folder, {
      quality: options.quality || "high",
      generateThumbnail: options.generateThumbnail || false,
    });

    // Get media type from filename
    const mediaType = getMediaTypeFromFilename(filePath);

    // Save media record to database
    const media = await prisma.media.create({
      data: {
        key: uploadResult.key,
        url: uploadResult.url,
        fileName: options.originalName || path.basename(filePath),
        contentType: uploadResult.contentType,
        mediaType: mediaType,
        uploadStatus: "COMPLETED",
        userId: userId,
        folder: folder,
        metadata: {
          size: uploadResult.size,
          quality: options.quality || "high",
          uploadDate: new Date().toISOString(),
        },
      },
    });

    return media;
  } catch (error) {
    console.error("Error uploading media:", error);
    throw new Error(`Failed to upload media: ${error.message}`);
  }
};

export const deleteMedia = async (mediaId, userId) => {
  try {
    // Get media record
    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        userId: userId,
      },
    });

    if (!media) {
      throw new Error("Media not found or not authorized");
    }

    // Delete from DigitalOcean Spaces
    await deleteFromSpaces(media.key);

    // Delete from database
    await prisma.media.delete({
      where: { id: mediaId },
    });

    return { success: true, message: "Media deleted successfully" };
  } catch (error) {
    console.error("Error deleting media:", error);
    throw new Error(`Failed to delete media: ${error.message}`);
  }
};

export const getMediaById = async (mediaId, userId) => {
  try {
    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        userId: userId,
      },
    });

    if (!media) {
      throw new Error("Media not found or not authorized");
    }

    return media;
  } catch (error) {
    console.error("Error getting media:", error);
    throw new Error(`Failed to get media: ${error.message}`);
  }
};

export const getUserMedia = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 20, mediaType, folder } = options;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: userId,
      uploadStatus: "COMPLETED",
    };

    if (mediaType) {
      where.mediaType = mediaType;
    }

    if (folder) {
      where.folder = folder;
    }

    const media = await prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    const totalCount = await prisma.media.count({ where });

    return {
      media,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    };
  } catch (error) {
    console.error("Error getting user media:", error);
    throw new Error(`Failed to get user media: ${error.message}`);
  }
};

export const generateUploadUrl = async (
  fileName,
  contentType,
  folder,
  userId
) => {
  try {
    const result = await generatePresignedUrl({
      fileName,
      contentType,
      folder,
      userId,
    });

    // Create pending media record
    const mediaType = getMediaTypeFromFilename(fileName);

    const media = await prisma.media.create({
      data: {
        key: result.key,
        url: result.publicUrl,
        fileName: fileName,
        contentType: contentType,
        mediaType: mediaType,
        uploadStatus: "PENDING",
        userId: userId,
        folder: folder,
        metadata: {
          presignedUrl: result.presignedUrl,
          uploadDate: new Date().toISOString(),
        },
      },
    });

    return {
      ...result,
      mediaId: media.id,
    };
  } catch (error) {
    console.error("Error generating upload URL:", error);
    throw new Error(`Failed to generate upload URL: ${error.message}`);
  }
};

export const confirmUpload = async (mediaId, userId) => {
  try {
    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        userId: userId,
        uploadStatus: "PENDING",
      },
    });

    if (!media) {
      throw new Error("Media not found or already confirmed");
    }

    // Update upload status
    const updatedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: {
        uploadStatus: "COMPLETED",
        metadata: {
          ...media.metadata,
          completedAt: new Date().toISOString(),
        },
      },
    });

    return updatedMedia;
  } catch (error) {
    console.error("Error confirming upload:", error);
    throw new Error(`Failed to confirm upload: ${error.message}`);
  }
};

export default {
  uploadMedia,
  deleteMedia,
  getMediaById,
  getUserMedia,
  generateUploadUrl,
  confirmUpload,
};
