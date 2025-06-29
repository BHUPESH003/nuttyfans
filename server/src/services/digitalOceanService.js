import { S3 } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { config } from "../config/env.js";
import sharp from "sharp";
import crypto from "crypto";

// DigitalOcean Spaces Client (S3-compatible)
const spacesClient = new S3({
  endpoint: config.DO_SPACES_ENDPOINT,
  region: config.DO_SPACES_REGION,
  credentials: {
    accessKeyId: config.DO_SPACES_ACCESS_KEY,
    secretAccessKey: config.DO_SPACES_SECRET_KEY,
  },
});

export const generatePresignedUrl = async (options) => {
  try {
    const {
      fileName,
      contentType,
      folder,
      userId,
      maxSize = config.MAX_FILE_SIZE,
    } = options;

    if (!fileName || !contentType || !folder || !userId) {
      throw new Error("Missing required parameters");
    }

    validateFileType(fileName, contentType);

    // Generate a unique file name
    const fileExtension = path.extname(fileName);
    const uniqueId = crypto.randomBytes(16).toString("hex");
    const key = `${folder}/${userId}/${uniqueId}${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: config.DO_SPACES_BUCKET,
      Key: key,
      ContentType: contentType,
      ACL: "public-read",
      Metadata: {
        "original-filename": fileName,
        "user-id": userId,
        "max-size": String(maxSize),
      },
    });

    const presignedUrl = await getSignedUrl(spacesClient, command, {
      expiresIn: 600, // 10 minutes
    });

    // Construct public URL for DigitalOcean Spaces
    const publicUrl = `https://${config.DO_SPACES_BUCKET}.${config.DO_SPACES_REGION}.digitaloceanspaces.com/${key}`;

    return {
      presignedUrl,
      key,
      publicUrl,
      metadata: {
        originalFilename: fileName,
        contentType,
        folder,
        userId,
      },
    };
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    throw error;
  }
};

export const validateFileType = (fileName, contentType) => {
  const ext = path.extname(fileName).toLowerCase();
  const allowedImageTypes = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const allowedVideoTypes = [".mp4", ".mov", ".webm"];
  const allowedAudioTypes = [".mp3", ".wav", ".ogg"];
  const allowedDocTypes = [".pdf", ".doc", ".docx"];

  const allowedTypes = [
    ...allowedImageTypes,
    ...allowedVideoTypes,
    ...allowedAudioTypes,
    ...allowedDocTypes,
  ];

  if (!allowedTypes.includes(ext)) {
    throw new Error(`File type ${ext} is not allowed`);
  }

  const imageContentTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const videoContentTypes = ["video/mp4", "video/quicktime", "video/webm"];
  const audioContentTypes = ["audio/mpeg", "audio/wav", "audio/ogg"];
  const docContentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const allowedContentTypes = [
    ...imageContentTypes,
    ...videoContentTypes,
    ...audioContentTypes,
    ...docContentTypes,
  ];

  if (!allowedContentTypes.includes(contentType)) {
    throw new Error(`Content type ${contentType} is not allowed`);
  }

  if (
    allowedImageTypes.includes(ext) &&
    !imageContentTypes.includes(contentType)
  ) {
    throw new Error(
      `Content type ${contentType} does not match image extension ${ext}`
    );
  }

  if (
    allowedVideoTypes.includes(ext) &&
    !videoContentTypes.includes(contentType)
  ) {
    throw new Error(
      `Content type ${contentType} does not match video extension ${ext}`
    );
  }

  if (
    allowedAudioTypes.includes(ext) &&
    !audioContentTypes.includes(contentType)
  ) {
    throw new Error(
      `Content type ${contentType} does not match audio extension ${ext}`
    );
  }

  if (allowedDocTypes.includes(ext) && !docContentTypes.includes(contentType)) {
    throw new Error(
      `Content type ${contentType} does not match document extension ${ext}`
    );
  }
};

export const uploadToSpaces = async (filePath, folder = "", options = {}) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("File does not exist");
    }

    const fileName = path.basename(filePath);
    const extname = path.extname(fileName).toLowerCase();
    const isImage = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(
      extname
    );
    const isVideo = [".mp4", ".mov", ".avi", ".webm"].includes(extname);

    const uniqueId = crypto.randomBytes(16).toString("hex");
    const key = `${folder}/${uniqueId}${extname}`;
    let fileBuffer = null;
    let contentType = "";

    if (isImage) {
      contentType = `image/${extname.replace(".", "")}`;
      if (extname === ".jpg" || extname === ".jpeg") contentType = "image/jpeg";
      if (extname === ".png") contentType = "image/png";

      const quality = options.quality || "high";
      const qualityMap = {
        high: 85,
        medium: 70,
        low: 50,
      };

      // Process image with Sharp
      fileBuffer = await sharp(filePath)
        .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: qualityMap[quality] })
        .toBuffer();

      // Generate thumbnail if requested
      if (options.generateThumbnail) {
        const thumbnailBuffer = await sharp(filePath)
          .resize({ width: 300, height: 300, fit: "cover" })
          .jpeg({ quality: 70 })
          .toBuffer();

        const thumbnailKey = `${folder}/thumbnails/${uniqueId}${extname}`;

        const upload = new Upload({
          client: spacesClient,
          params: {
            Bucket: config.DO_SPACES_BUCKET,
            Key: thumbnailKey,
            Body: thumbnailBuffer,
            ContentType: contentType,
            ACL: "public-read",
          },
        });

        await upload.done();
      }
    } else if (isVideo) {
      contentType = "video/mp4";
      if (extname === ".mov") contentType = "video/quicktime";
      if (extname === ".webm") contentType = "video/webm";

      fileBuffer = fs.readFileSync(filePath);
    } else {
      // Handle other file types
      fileBuffer = fs.readFileSync(filePath);
      contentType = getContentType(extname);
    }

    // Upload to DigitalOcean Spaces
    const upload = new Upload({
      client: spacesClient,
      params: {
        Bucket: config.DO_SPACES_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: "public-read",
        Metadata: {
          "original-filename": fileName,
          "upload-date": new Date().toISOString(),
        },
      },
    });

    const result = await upload.done();

    // Clean up local file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.warn("Failed to clean up local file:", cleanupError);
    }

    // Construct public URL
    const publicUrl = `https://${config.DO_SPACES_BUCKET}.${config.DO_SPACES_REGION}.digitaloceanspaces.com/${key}`;

    return {
      url: publicUrl,
      key: key,
      bucket: config.DO_SPACES_BUCKET,
      contentType: contentType,
      size: fileBuffer.length,
    };
  } catch (error) {
    console.error("Error uploading to Spaces:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

export const deleteFromSpaces = async (key) => {
  try {
    if (!key) {
      throw new Error("Key is required for deletion");
    }

    const command = new DeleteObjectCommand({
      Bucket: config.DO_SPACES_BUCKET,
      Key: key,
    });

    await spacesClient.send(command);
    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    console.error("Error deleting from Spaces:", error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

export const fileExists = async (key) => {
  try {
    await spacesClient.send(
      new HeadObjectCommand({
        Bucket: config.DO_SPACES_BUCKET,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
};

export const updateFile = async (oldKey, filePath, folder, options = {}) => {
  try {
    // Upload the new file first
    const uploadResult = await uploadToSpaces(filePath, folder, options);

    // If upload successful, delete the old file
    if (oldKey && oldKey !== uploadResult.key) {
      try {
        await deleteFromSpaces(oldKey);
      } catch (deleteError) {
        console.error(
          `Warning: Failed to delete old file ${oldKey}:`,
          deleteError.message
        );
      }
    }

    return uploadResult;
  } catch (error) {
    console.error("Error updating file:", error);
    throw error;
  }
};

export const getKeyFromUrl = (url) => {
  try {
    if (!url) return null;

    // Extract key from DigitalOcean Spaces URL
    // Format: https://bucket-name.region.digitaloceanspaces.com/key
    const urlParts = url.split(".digitaloceanspaces.com/");
    if (urlParts.length === 2) {
      return urlParts[1];
    }

    return null;
  } catch (error) {
    console.error("Error extracting key from URL:", error);
    return null;
  }
};

export const getMediaTypeFromFilename = (filename) => {
  const extension = path.extname(filename).toLowerCase();
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
  const videoExtensions = [
    ".mp4",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".webm",
    ".mkv",
  ];
  const audioExtensions = [".mp3", ".wav", ".ogg"];

  if (imageExtensions.includes(extension)) {
    return "IMAGE";
  } else if (videoExtensions.includes(extension)) {
    return "VIDEO";
  } else if (audioExtensions.includes(extension)) {
    return "AUDIO";
  } else {
    return "DOCUMENT";
  }
};

const getContentType = (extension) => {
  const contentTypes = {
    // Images
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",

    // Videos
    ".mp4": "video/mp4",
    ".avi": "video/x-msvideo",
    ".mov": "video/quicktime",
    ".wmv": "video/x-ms-wmv",
    ".flv": "video/x-flv",
    ".webm": "video/webm",
    ".mkv": "video/x-matroska",

    // Audio
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",

    // Documents
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  return contentTypes[extension] || "application/octet-stream";
};

// Export main functions for use in media service
export default {
  uploadToSpaces,
  deleteFromSpaces,
  generatePresignedUrl,
  getKeyFromUrl,
  getMediaTypeFromFilename,
  fileExists,
  updateFile,
};
