import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { config } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../public/uploads/temp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/temp");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const allowedVideoTypes = [".mp4", ".mov", ".avi", ".webm"];
  const allowedAudioTypes = [".mp3", ".wav", ".ogg"];

  const ext = path.extname(file.originalname).toLowerCase();

  // Accept images, videos, and audio files
  if (
    [...allowedImageTypes, ...allowedVideoTypes, ...allowedAudioTypes].includes(
      ext
    )
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only image, video, and audio files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: config.MAX_FILE_SIZE },
  fileFilter: fileFilter,
});

export const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    singleUpload(req, res, (err) => {
      if (err) {
        req.fileError = err;
      }
      next();
    });
  };
};

export const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const multiUpload = upload.array(fieldName, maxCount);
    multiUpload(req, res, (err) => {
      if (err) {
        req.fileError = err;
      }
      next();
    });
  };
};

export const handleUploadError = (req, res, next) => {
  if (req.fileError) {
    // Cleanup any uploaded temp files if there was an error
    const cleanupFiles = (files) => {
      if (files) {
        const fileArray = Array.isArray(files) ? files : [files];
        fileArray.forEach((file) => {
          if (file && file.path) {
            try {
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
                console.log(
                  `Cleaned up temp file after upload error: ${file.path}`
                );
              }
            } catch (cleanupError) {
              console.warn(
                `Failed to cleanup temp file ${file.path}:`,
                cleanupError.message
              );
            }
          }
        });
      }
    };

    // Cleanup uploaded files
    cleanupFiles(req.file);
    cleanupFiles(req.files);

    const error = new Error(req.fileError.message);
    error.statusCode = 400;
    return next(error);
  }
  next();
};

export const setMediaQuality = (quality) => {
  return (req, res, next) => {
    const validQualities = ["high", "medium", "low"];

    if (quality && validQualities.includes(quality)) {
      req.mediaQuality = quality;
    } else {
      req.mediaQuality = config.MEDIA_DEFAULT_QUALITY;
    }

    next();
  };
};

// Export default upload object
export default upload;
