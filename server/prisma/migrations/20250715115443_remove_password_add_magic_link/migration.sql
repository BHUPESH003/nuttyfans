/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordResetExpires` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordResetToken` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_passwordResetToken_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
DROP COLUMN "passwordResetExpires",
DROP COLUMN "passwordResetToken",
ADD COLUMN     "loginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "magicLinkExpires" TIMESTAMP(3),
ADD COLUMN     "magicLinkToken" TEXT;

-- CreateIndex
CREATE INDEX "User_magicLinkToken_idx" ON "User"("magicLinkToken");
