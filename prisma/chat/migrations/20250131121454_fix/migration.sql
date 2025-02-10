/*
  Warnings:

  - You are about to drop the `channels` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_channelId_fkey";

-- DropTable
DROP TABLE "channels";
