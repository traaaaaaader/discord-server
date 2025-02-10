/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `DirectMessage` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Message` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[memberOneId,memberTwoId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `memberId` to the `DirectMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `memberId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ADMIN', 'MODERATOR', 'GUEST');

-- DropForeignKey
ALTER TABLE "DirectMessage" DROP CONSTRAINT "DirectMessage_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_userId_fkey";

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "DirectMessage" DROP COLUMN "userId",
ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "memberId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "userId",
ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "memberId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'GUEST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_memberTwoId_idx" ON "Conversation"("memberTwoId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_memberOneId_memberTwoId_key" ON "Conversation"("memberOneId", "memberTwoId");

-- CreateIndex
CREATE INDEX "DirectMessage_memberId_idx" ON "DirectMessage"("memberId");

-- CreateIndex
CREATE INDEX "DirectMessage_conversationId_idx" ON "DirectMessage"("conversationId");

-- CreateIndex
CREATE INDEX "Message_channelId_idx" ON "Message"("channelId");

-- CreateIndex
CREATE INDEX "Message_memberId_idx" ON "Message"("memberId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_memberOneId_fkey" FOREIGN KEY ("memberOneId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_memberTwoId_fkey" FOREIGN KEY ("memberTwoId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
