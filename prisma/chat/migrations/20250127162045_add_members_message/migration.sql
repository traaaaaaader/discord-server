/*
  Warnings:

  - You are about to drop the column `userId` on the `Message` table. All the data in the column will be lost.
  - Made the column `memberId` on table `Message` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_memberId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_userId_fkey";

-- DropIndex
DROP INDEX "Message_userId_idx";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "userId",
ALTER COLUMN "memberId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Message_memberId_idx" ON "Message"("memberId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
