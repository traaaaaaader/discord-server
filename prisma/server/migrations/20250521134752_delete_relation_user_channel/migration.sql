/*
  Warnings:

  - You are about to drop the column `userId` on the `channels` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "channels" DROP CONSTRAINT "channels_userId_fkey";

-- DropIndex
DROP INDEX "channels_userId_idx";

-- AlterTable
ALTER TABLE "channels" DROP COLUMN "userId";
