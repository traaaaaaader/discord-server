/*
  Warnings:

  - You are about to drop the column `profileId` on the `channel` table. All the data in the column will be lost.
  - You are about to drop the column `profileId` on the `member` table. All the data in the column will be lost.
  - You are about to drop the column `profileId` on the `server` table. All the data in the column will be lost.
  - You are about to drop the `profile` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `server` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "channel" DROP CONSTRAINT "channel_profileId_fkey";

-- DropForeignKey
ALTER TABLE "member" DROP CONSTRAINT "member_profileId_fkey";

-- DropForeignKey
ALTER TABLE "server" DROP CONSTRAINT "server_profileId_fkey";

-- DropIndex
DROP INDEX "channel_profileId_idx";

-- DropIndex
DROP INDEX "member_profileId_idx";

-- DropIndex
DROP INDEX "server_profileId_idx";

-- AlterTable
ALTER TABLE "channel" DROP COLUMN "profileId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "member" DROP COLUMN "profileId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "server" DROP COLUMN "profileId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "profile";

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashed_password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "channel_userId_idx" ON "channel"("userId");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "member"("userId");

-- CreateIndex
CREATE INDEX "server_userId_idx" ON "server"("userId");

-- AddForeignKey
ALTER TABLE "server" ADD CONSTRAINT "server_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel" ADD CONSTRAINT "channel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
