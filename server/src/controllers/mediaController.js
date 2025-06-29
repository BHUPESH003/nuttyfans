import {
  generatePresignedUrl,
  uploadToSpaces,
  deleteFromSpaces,
  getKeyFromUrl,
  getMediaTypeFromFilename,
  fileExists,
  updateFile,
} from "../services/digitalOceanService.js";
import prisma from "../config/prisma.js";

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
      return next(error);
    }

    const quality = req.mediaQuality || "high";
    const generateThumbnail = req.body.generateThumbnail === "true";

    const result = await uploadToSpaces(req.file.path, folder, {
      quality,
      userId: req.user.id,
      generateThumbnail,
    });

    const media = await prisma.media.create({
      data: {
        key: result.key,
        url: result.url,
        fileName: req.file.originalname,
        contentType: result.contentType,
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
  } catch (error) {
    next(error);
  }
};

export const updateMedia = async (req, res, next) => {
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

    if (!req.file) {
      const error = new Error("No file uploaded");
      error.statusCode = 400;
      return next(error);
    }

    const quality = req.mediaQuality || "high";
    const generateThumbnail = req.body.generateThumbnail === "true";

    const result = await updateFile(media.key, req.file.path, media.folder, {
      quality,
      generateThumbnail,
    });

    const updatedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: {
        key: result.key,
        url: result.url,
        fileName: req.file.originalname,
        contentType: result.contentType,
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
  } catch (error) {
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

    try {
      await deleteFromSpaces(media.key);
    } catch (deleteError) {
      console.error(
        `Error deleting media from storage: ${deleteError.message}`
      );
    }

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
          await deleteFromSpaces(media.key);
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
