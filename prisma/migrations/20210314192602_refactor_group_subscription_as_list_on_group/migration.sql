/*
  Warnings:

  - You are about to drop the column `payoutCurrency` on the `Group` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "GroupSubscription_groupId_unique";

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "payoutCurrency";

-- AlterTable
ALTER TABLE "GroupSubscription" ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "description" TEXT;
