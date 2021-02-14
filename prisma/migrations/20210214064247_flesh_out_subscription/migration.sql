/*
  Warnings:

  - You are about to drop the `GroupMembershipOption` table. If the table is not empty, all the data it contains will be lost.
  - The migration will add a unique constraint covering the columns `[groupMembershipId,groupSubscriptionId]` on the table `MemberSubscription`. If there are existing duplicate values, the migration will fail.
  - Added the required column `groupMembershipId` to the `MemberSubscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "GroupMembershipOption" DROP CONSTRAINT "GroupMembershipOption_groupId_fkey";

-- DropForeignKey
ALTER TABLE "GroupMembership" DROP CONSTRAINT "GroupMembership_groupId_fkey";

-- DropForeignKey
ALTER TABLE "GroupSubscription" DROP CONSTRAINT "GroupSubscription_groupId_fkey";

-- DropForeignKey
ALTER TABLE "MemberSubscription" DROP CONSTRAINT "MemberSubscription_groupSubscriptionId_fkey";

-- AlterTable
ALTER TABLE "MemberSubscription" ADD COLUMN     "groupMembershipId" UUID NOT NULL,
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurring" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "GroupMembershipOption";

-- CreateIndex
CREATE UNIQUE INDEX "MemberSubscription_groupMembershipId_groupSubscriptionId_key" ON "MemberSubscription"("groupMembershipId", "groupSubscriptionId");

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSubscription" ADD FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSubscription" ADD FOREIGN KEY ("groupSubscriptionId") REFERENCES "GroupSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSubscription" ADD FOREIGN KEY ("groupMembershipId") REFERENCES "GroupMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
