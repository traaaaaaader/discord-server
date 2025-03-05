/*
  Warnings:

  - You are about to drop the column `creatorId` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the `participants` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userOneId,userTwoId]` on the table `conversations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userOneId` to the `conversations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userTwoId` to the `conversations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "participants" DROP CONSTRAINT "participants_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "participants" DROP CONSTRAINT "participants_userId_fkey";

-- DropIndex
DROP INDEX "conversations_creatorId_idx";

-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "creatorId",
ADD COLUMN     "userOneId" TEXT NOT NULL,
ADD COLUMN     "userTwoId" TEXT NOT NULL;

-- DropTable
DROP TABLE "participants";

-- CreateIndex
CREATE INDEX "conversations_userTwoId_idx" ON "conversations"("userTwoId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_userOneId_userTwoId_key" ON "conversations"("userOneId", "userTwoId");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userOneId_fkey" FOREIGN KEY ("userOneId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userTwoId_fkey" FOREIGN KEY ("userTwoId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
