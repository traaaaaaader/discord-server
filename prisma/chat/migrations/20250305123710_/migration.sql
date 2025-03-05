/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `conversations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userTwoId,userOneId]` on the table `conversations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "imageUrl",
DROP COLUMN "name";

-- CreateIndex
CREATE INDEX "conversations_userOneId_idx" ON "conversations"("userOneId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_userTwoId_userOneId_key" ON "conversations"("userTwoId", "userOneId");
