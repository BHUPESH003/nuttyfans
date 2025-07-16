import {
  generatePresignedUrl,
  uploadToS3,
  deleteFromS3,
  getKeyFromUrl,
  getMediaTypeFromFilename,
  fileExists,
  updateFile,
} from "../services/awsS3Service.js";
import prisma from "../config/prisma.js";
import fs from "fs";

// Helper function to cleanup temp files
const cleanupTempFiles = (files) => {
  if (files && files.length > 0) {
    files.forEach((file) => {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (error) {
        console.warn(
          `Failed to cleanup temp file ${file.path}:`,
          error.message
        );
      }
    });
  }
};

// Helper function to cleanup single temp file
const cleanupTempFile = (filePath) => {
  if (filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`Failed to cleanup temp file ${filePath}:`, error.message);
    }
  }
};

export const getPresignedUrl = async (req, res, next) => {
  try {
    const { fileName, contentType, folder } = req.body;

    if (!fileName || !contentType || !folder) {
      const error = new Error(
        "Missing required fields: fileName, contentType, folder"
      );
      error.statusCode = 400;
      return next(error);
    }

    const urlData = await generatePresignedUrl({
      fileName,
      contentType,
      folder,
      userId: req.user.id,
      maxSize: req.body.maxSize,
    });

    const media = await prisma.media.create({
      data: {
        key: urlData.key,
        url: urlData.publicUrl,
        fileName: fileName,
        contentType: contentType,
        mediaType: getMediaTypeFromFilename(fileName),
        uploadStatus: "PENDING",
        userId: req.user.id,
        folder: folder,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        ...urlData,
        mediaId: media.id,
      },
      message:
        "Upload URL generated successfully. Upload directly from frontend.",
    });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);

    if (
      error.message &&
      (error.message.includes("File type") ||
        error.message.includes("Content type"))
    ) {
      const err = new Error(error.message);
      err.statusCode = 400;
      return next(err);
    }

    next(error);
  }
};

export const confirmMediaUpload = async (req, res, next) => {
  try {
    const { mediaId } = req.params;

    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        userId: req.user.id,
      },
    });

    if (!media) {
      const error = new Error("Media not found");
      error.statusCode = 404;
      return next(error);
    }

    const exists = await fileExists(media.key);

    if (!exists) {
      await prisma.media.update({
        where: { id: mediaId },
        data: {
          uploadStatus: "FAILED",
          statusMessage: "File not found in storage",
        },
      });

      const error = new Error("Upload failed or not completed");
      error.statusCode = 400;
      return next(error);
    }

    const updatedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: {
        uploadStatus: "COMPLETED",
        statusMessage: "Upload confirmed",
      },
    });

    res.status(200).json({
      success: true,
      data: updatedMedia,
      message: "Media upload confirmed",
    });
  } catch (error) {
    next(error);
  }
};

export const uploadMedia = async (req, res, next) => {
  const uploadedFile = req.file; // Store reference for cleanup

  try {
    if (!req.file) {
      const error = new Error("No file uploaded");
      error.statusCode = 400;
      return next(error);
    }

    const { folder } = req.body;

    if (!folder) {
      const error = new Error("Folder parameter is required");
      error.statusCode = 400;
      // Cleanup temp file before throwing error
      cleanupTempFile(uploadedFile?.path);
      return next(error);
    }

    const quality = req.mediaQuality || "high";
    const generateThumbnail = req.body.generateThumbnail === "true";

    let uploadResult;
    try {
      uploadResult = await uploadToS3(req.file.path, folder, {
        quality,
        userId: req.user.id,
        generateThumbnail,
      });
    } catch (uploadError) {
      // Cleanup temp file if upload fails
      cleanupTempFile(uploadedFile?.path);
      throw new Error(`File upload failed: ${uploadError.message}`);
    }

    try {
      const media = await prisma.media.create({
        data: {
          key: uploadResult.key,
          url: uploadResult.url,
          fileName: req.file.originalname,
          contentType: uploadResult.contentType,
          mediaType: getMediaTypeFromFilename(req.file.originalname),
          uploadStatus: "COMPLETED",
          userId: req.user.id,
          folder: folder,
          metadata: {
            size: req.file.size,
            quality,
            hasThumbnail: generateThumbnail,
          },
        },
      });

      res.status(201).json({
        success: true,
        data: media,
      });
    } catch (dbError) {
      // If database operation fails, cleanup uploaded file from AWS S3
      if (uploadResult?.key) {
        try {
          await deleteFromS3(uploadResult.key);
        } catch (deleteError) {
          console.warn(
            `Failed to cleanup uploaded file after DB error ${uploadResult.key}:`,
            deleteError.message
          );
        }
      }

      throw new Error(`Database operation failed: ${dbError.message}`);
    }
  } catch (error) {
    // Final cleanup of temp file if it still exists
    cleanupTempFile(uploadedFile?.path);
    next(error);
  }
};

export const updateMedia = async (req, res, next) => {
  const uploadedFile = req.file; // Store reference for cleanup

  try {
    const { mediaId } = req.params;

    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        userId: req.user.id,
      },
    });

    if (!media) {
      const error = new Error("Media not found");
      error.statusCode = 404;
      // Cleanup temp file before throwing error
      cleanupTempFile(uploadedFile?.path);
      return next(error);
    }

    if (!req.file) {
      const error = new Error("No file uploaded");
      error.statusCode = 400;
      return next(error);
    }

    const quality = req.mediaQuality || "high";
    const generateThumbnail = req.body.generateThumbnail === "true";

    let updateResult;
    try {
      updateResult = await updateFile(media.key, req.file.path, media.folder, {
        quality,
        generateThumbnail,
      });
    } catch (uploadError) {
      // Cleanup temp file if upload fails
      cleanupTempFile(uploadedFile?.path);
      throw new Error(`File update failed: ${uploadError.message}`);
    }

    try {
      const updatedMedia = await prisma.media.update({
        where: { id: mediaId },
        data: {
          key: updateResult.key,
          url: updateResult.url,
          fileName: req.file.originalname,
          contentType: updateResult.contentType,
          mediaType: getMediaTypeFromFilename(req.file.originalname),
          uploadStatus: "COMPLETED",
          metadata: {
            ...media.metadata,
            size: req.file.size,
            quality,
            hasThumbnail: generateThumbnail,
            updatedAt: new Date().toISOString(),
          },
        },
      });

      res.status(200).json({
        success: true,
        data: updatedMedia,
        message: "Media updated successfully",
      });
    } catch (dbError) {
      // If database operation fails, try to restore old file (but don't fail if it doesn't work)
      if (updateResult?.key && media.key !== updateResult.key) {
        try {
          await deleteFromS3(updateResult.key);
          console.warn(
            `Cleaned up new uploaded file ${updateResult.key} after database error`
          );
        } catch (deleteError) {
          console.warn(
            `Failed to cleanup new uploaded file after DB error ${updateResult.key}:`,
            deleteError.message
          );
        }
      }

      throw new Error(`Database operation failed: ${dbError.message}`);
    }
  } catch (error) {
    // Final cleanup of temp file if it still exists
    cleanupTempFile(uploadedFile?.path);
    next(error);
  }
};

export const deleteMedia = async (req, res, next) => {
  try {
    const { mediaId } = req.params;

    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        userId: req.user.id,
      },
    });

    if (!media) {
      const error = new Error("Media not found");
      error.statusCode = 404;
      return next(error);
    }

    // Delete from AWS S3 (but don't fail if deletion fails)
    const deletePromises = [];
    if (media.key) {
      deletePromises.push(
        deleteFromS3(media.key).catch((error) => {
          console.warn(
            `Failed to delete media file ${media.key} from AWS S3:`,
            error.message
          );
          // Don't throw error, just log warning as media should still be deleted from DB
        })
      );

      // Also delete thumbnail if it exists
      const thumbnailKey = media.key.replace(/^([^\/]+)\//, "$1/thumbnails/");
      if (thumbnailKey !== media.key) {
        deletePromises.push(
          deleteFromS3(thumbnailKey).catch((error) => {
            console.warn(
              `Failed to delete thumbnail ${thumbnailKey}:`,
              error.message
            );
          })
        );
      }
    }

    // Wait for all media deletions to complete (but don't fail if some fail)
    await Promise.allSettled(deletePromises);

    // Delete from database
    await prisma.media.delete({
      where: { id: mediaId },
    });

    res.status(200).json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getUserMedia = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, mediaType, folder } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
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

    res.status(200).json({
      success: true,
      data: {
        media,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMediaDetails = async (req, res, next) => {
  try {
    const { mediaId } = req.params;

    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        userId: req.user.id,
      },
    });

    if (!media) {
      const error = new Error("Media not found");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: media,
    });
  } catch (error) {
    next(error);
  }
};

export const getFailedUploads = async (req, res, next) => {
  try {
    const failedMedia = await prisma.media.findMany({
      where: {
        uploadStatus: "FAILED",
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data: failedMedia,
    });
  } catch (error) {
    next(error);
  }
};

export const cleanupOrphanedMedia = async (req, res, next) => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const orphanedMedia = await prisma.media.findMany({
      where: {
        uploadStatus: "PENDING",
        createdAt: {
          lt: oneDayAgo,
        },
      },
    });

    let deleted = 0;
    let errors = 0;

    for (const media of orphanedMedia) {
      try {
        try {
          await deleteFromS3(media.key);
        } catch (deleteError) {
          console.error(
            `Error deleting orphaned media from storage: ${deleteError.message}`
          );
        }

        await prisma.media.delete({
          where: { id: media.id },
        });

        deleted++;
      } catch (error) {
        console.error(`Error cleaning up media ${media.id}: ${error.message}`);
        errors++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Cleanup complete. Deleted ${deleted} orphaned media files. Errors: ${errors}.`,
    });
  } catch (error) {
    next(error);
  }
};
