import prisma from "../config/prisma.js";
import { deleteFromS3 } from "../services/awsS3Service.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Clean up temporary files from uploads/temp directory
 * Removes files older than 1 hour
 */
export const cleanupTempFiles = async () => {
  console.log("Running temp files cleanup task");

  try {
    const tempDir = path.join(__dirname, "../../public/uploads/temp");

    if (!fs.existsSync(tempDir)) {
      console.log("Temp directory does not exist, skipping cleanup");
      return { deletedCount: 0, errorCount: 0 };
    }

    const files = fs.readdirSync(tempDir);
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    let deletedCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < oneHourAgo) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`Deleted temp file: ${file}`);
        }
      } catch (error) {
        console.error(`Error deleting temp file ${file}:`, error.message);
        errorCount++;
      }
    }

    console.log(
      `Temp files cleanup completed. Deleted: ${deletedCount}, Errors: ${errorCount}`
    );
    return { deletedCount, errorCount };
  } catch (error) {
    console.error("Error in temp files cleanup task:", error);
    return { error: error.message };
  }
};

/**
 * Scheduled task to clean up orphaned media
 * Runs once a day to find and remove pending uploads that are over 24 hours old
 */
export const cleanupOrphanedMedia = async () => {
  console.log("Running scheduled media cleanup task");

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

    console.log(
      `Found ${orphanedMedia.length} orphaned media items to clean up`
    );

    let deletedCount = 0;
    let errorCount = 0;

    for (const media of orphanedMedia) {
      try {
        try {
          await deleteFromS3(media.key);
          console.log(`Deleted file from storage: ${media.key}`);
        } catch (deleteError) {
          console.error(
            `Error deleting orphaned media from storage: ${deleteError.message}`
          );
          errorCount++;
        }

        await prisma.media.delete({
          where: { id: media.id },
        });

        deletedCount++;
        console.log(`Deleted media record: ${media.id}`);
      } catch (error) {
        console.error(`Error cleaning up media ${media.id}: ${error.message}`);
        errorCount++;
      }
    }

    console.log(
      `Media cleanup completed. Deleted: ${deletedCount}, Errors: ${errorCount}`
    );
    return { deletedCount, errorCount };
  } catch (error) {
    console.error("Error in scheduled media cleanup task:", error);
    return { error: error.message };
  }
};

/**
 * Scheduled task to find orphaned S3 objects
 * This checks for objects in S3 that don't have corresponding database records
 */
export const findOrphanedS3Objects = async () => {
  console.log(
    "S3 orphan detection not implemented - would scan S3 for objects without DB records"
  );
};

export const initScheduledTasks = () => {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const ONE_HOUR = 60 * 60 * 1000;

  // Schedule orphaned media cleanup once per day
  setInterval(cleanupOrphanedMedia, TWENTY_FOUR_HOURS);

  // Schedule temp files cleanup every hour
  setInterval(cleanupTempFiles, ONE_HOUR);

  const now = new Date();
  const scheduledTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    3,
    0,
    0,
    0 // 3 AM
  );

  if (now > scheduledTime) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const timeUntilFirstRun = scheduledTime.getTime() - now.getTime();

  // Schedule first orphaned media cleanup
  setTimeout(() => {
    cleanupOrphanedMedia();
    setInterval(cleanupOrphanedMedia, TWENTY_FOUR_HOURS);
  }, timeUntilFirstRun);

  // Run temp files cleanup immediately and then every hour
  cleanupTempFiles();

  console.log(`Cleanup tasks scheduled:`);
  console.log(
    `- Media cleanup: First run in ${Math.round(
      timeUntilFirstRun / 1000 / 60
    )} minutes, then every 24 hours`
  );
  console.log(`- Temp files cleanup: Running now, then every hour`);
};
