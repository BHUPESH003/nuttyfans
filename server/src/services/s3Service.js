import { S3 } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { config } from "../config/env.js";
import sharp from "sharp";
import crypto from "crypto";

// AWS S3 Client configuration
const s3Client = new S3({
    region: config.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
});

const AWS_S3_BUCKET = config.AWS_S3_BUCKET;

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
        const key = `${folder}/${userId}/${uniqueId}${fileExtension}`; const command = new PutObjectCommand({
            Bucket: AWS_S3_BUCKET,
            Key: key,
            ContentType: contentType,
            ACL: "public-read",
            Metadata: {
                "original-filename": fileName,
                "user-id": userId,
                "max-size": String(maxSize),
            },
        });

        const uploadUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600, // 1 hour
        });

        return {
            uploadUrl,
            key,
            publicUrl: `https://${AWS_S3_BUCKET}.s3.${config.AWS_REGION}.amazonaws.com/${key}`,
        };
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        throw new Error("Failed to generate upload URL");
    }
};

export const uploadToS3 = async (filePath, folder, options = {}) => {
    try {
        const { quality = "high", userId } = options;

        if (!fs.existsSync(filePath)) {
            throw new Error("File does not exist");
        }

        const fileName = path.basename(filePath);
        const fileExtension = path.extname(fileName).toLowerCase();
        const contentType = getContentType(fileExtension);

        validateFileType(fileName, contentType);

        // Generate unique file name
        const uniqueId = crypto.randomBytes(16).toString("hex");
        const key = `${folder}/${userId || 'uploads'}/${uniqueId}${fileExtension}`;

        let fileBuffer;

        // Process images with sharp for optimization
        if (contentType.startsWith("image/")) {
            fileBuffer = await processImage(filePath, quality);
        } else {
            // For videos and other files, read as-is
            fileBuffer = fs.readFileSync(filePath);
        }    // Upload to S3
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: AWS_S3_BUCKET,
                Key: key,
                Body: fileBuffer,
                ContentType: contentType,
                ACL: "public-read",
                Metadata: {
                    "original-filename": fileName,
                    "user-id": userId || "anonymous",
                    "quality": quality,
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
        } const publicUrl = `https://${AWS_S3_BUCKET}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;

        return {
            url: publicUrl,
            key: key,
            bucket: AWS_S3_BUCKET,
            contentType: contentType,
            size: fileBuffer.length,
        };
    } catch (error) {
        console.error("Error uploading to S3:", error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }
};

export const deleteFromS3 = async (key) => {
    try {
        if (!key) {
            throw new Error("Key is required for deletion");
        } const command = new DeleteObjectCommand({
            Bucket: AWS_S3_BUCKET,
            Key: key,
        });

        await s3Client.send(command);
        return { success: true, message: "File deleted successfully" };
    } catch (error) {
        console.error("Error deleting from S3:", error);
        throw new Error(`Failed to delete file: ${error.message}`);
    }
};

export const getSignedDownloadUrl = async (key, expiresIn = 3600) => {
    try {
        const command = new GetObjectCommand({
            Bucket: AWS_S3_BUCKET,
            Key: key,
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
        return signedUrl;
    } catch (error) {
        console.error("Error generating signed download URL:", error);
        throw new Error("Failed to generate download URL");
    }
};

export const getKeyFromUrl = (url) => {
    try {
        if (!url) return null;

        // Extract key from S3 URL
        // Format: https://bucket-name.s3.region.amazonaws.com/key
        const urlParts = url.split('.amazonaws.com/');
        if (urlParts.length === 2) {
            return urlParts[1];
        }
        // Alternative format: https://s3.region.amazonaws.com/bucket-name/key
        const altFormat = url.split(`/${AWS_S3_BUCKET}/`);
        if (altFormat.length === 2) {
            return altFormat[1];
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
    const videoExtensions = [".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm", ".mkv"];

    if (imageExtensions.includes(extension)) {
        return "image";
    } else if (videoExtensions.includes(extension)) {
        return "video";
    } else {
        return "other";
    }
};

const getContentType = (extension) => {
    const contentTypes = {
        // Images
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
        '.svg': 'image/svg+xml',

        // Videos
        '.mp4': 'video/mp4',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.wmv': 'video/x-ms-wmv',
        '.flv': 'video/x-flv',
        '.webm': 'video/webm',
        '.mkv': 'video/x-matroska',

        // Audio
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',

        // Documents
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    return contentTypes[extension] || 'application/octet-stream';
};

const validateFileType = (fileName, contentType) => {
    const allowedTypes = [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
        // Videos
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'
    ];

    if (!allowedTypes.includes(contentType)) {
        throw new Error(`File type ${contentType} is not allowed`);
    }

    const maxFileSize = 100 * 1024 * 1024; // 100MB
    // Note: File size validation should be done during upload, not here
};

const processImage = async (filePath, quality) => {
    try {
        let sharpImage = sharp(filePath);

        // Get image metadata
        const metadata = await sharpImage.metadata();

        // Optimize based on quality setting
        switch (quality) {
            case "low":
                sharpImage = sharpImage
                    .resize(800, 600, { fit: "inside", withoutEnlargement: true })
                    .jpeg({ quality: 60 });
                break;
            case "medium":
                sharpImage = sharpImage
                    .resize(1200, 900, { fit: "inside", withoutEnlargement: true })
                    .jpeg({ quality: 75 });
                break;
            case "high":
            default:
                sharpImage = sharpImage
                    .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
                    .jpeg({ quality: 85 });
                break;
        }

        return await sharpImage.toBuffer();
    } catch (error) {
        console.error("Error processing image:", error);
        // Fallback to original file if processing fails
        return fs.readFileSync(filePath);
    }
};

export const getMediaStats = async () => {
    try {
        // This would require additional S3 operations to get stats
        // For now, return basic stats structure
        return {
            totalFiles: 0,
            totalSize: 0,
            imageCount: 0,
            videoCount: 0,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error("Error getting media stats:", error);
        throw new Error("Failed to get media statistics");
    }
};

/**
 * Check if a file exists in S3
 * @param {string} key - The S3 key of the file
 * @returns {Promise<boolean>} - Whether the file exists
 */
export const fileExists = async (key) => {
    try {
        await s3Client.send(new HeadObjectCommand({
            Bucket: AWS_S3_BUCKET,
            Key: key
        }));
        return true;
    } catch (error) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        throw error;
    }
};

/**
 * Update an existing file in S3 (delete old, upload new)
 * @param {string} oldKey - The current S3 key of the file
 * @param {string} filePath - Path to the new file
 * @param {string} folder - Folder name for organization
 * @param {Object} options - Upload options (quality, generateThumbnail, etc.)
 * @returns {Promise<Object>} - Upload result with new key and URL
 */
export const updateFile = async (oldKey, filePath, folder, options = {}) => {
    try {
        // Upload the new file first
        const uploadResult = await uploadToS3(filePath, folder, options);

        // If upload successful, delete the old file
        if (oldKey && oldKey !== uploadResult.key) {
            try {
                await deleteFromS3(oldKey);
            } catch (deleteError) {
                console.error(`Warning: Failed to delete old file ${oldKey}:`, deleteError.message);
            }
        }

        return uploadResult;
    } catch (error) {
        console.error("Error updating file:", error);
        throw error;
    }
};

// Backward compatibility exports (keeping old function names)
export const uploadToSpaces = uploadToS3;
export const deleteFromSpaces = deleteFromS3;

export default {
    uploadToS3,
    deleteFromS3,
    generatePresignedUrl,
    getSignedDownloadUrl,
    getKeyFromUrl,
    getMediaTypeFromFilename,
    getMediaStats,
    // Backward compatibility
    uploadToSpaces: uploadToS3,
    deleteFromSpaces: deleteFromS3,
};
