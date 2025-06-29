import prisma from "../config/prisma.js";
import { deleteFromSpaces } from "../services/digitalOceanService.js";

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
          await deleteFromSpaces(media.key);
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

  setInterval(cleanupOrphanedMedia, TWENTY_FOUR_HOURS);

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

  setTimeout(() => {
    cleanupOrphanedMedia();
    setInterval(cleanupOrphanedMedia, TWENTY_FOUR_HOURS);
  }, timeUntilFirstRun);

  console.log(
    `Media cleanup scheduled. First run in ${Math.round(
      timeUntilFirstRun / 1000 / 60
    )} minutes`
  );
};
