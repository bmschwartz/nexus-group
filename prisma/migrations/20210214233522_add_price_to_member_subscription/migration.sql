/*
  Warnings:

  - Added the required column `price` to the `MemberSubscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "GroupMembership" DROP CONSTRAINT "GroupMembership_groupId_fkey";

-- DropForeignKey
ALTER TABLE "GroupSubscription" DROP CONSTRAINT "GroupSubscription_groupId_fkey";

-- DropForeignKey
ALTER TABLE "MemberSubscription" DROP CONSTRAINT "MemberSubscription_groupMembershipId_fkey";

-- DropForeignKey
ALTER TABLE "MemberSubscription" DROP CONSTRAINT "MemberSubscription_groupSubscriptionId_fkey";

-- AlterTable
ALTER TABLE "MemberSubscription" ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSubscription" ADD FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSubscription" ADD FOREIGN KEY ("groupSubscriptionId") REFERENCES "GroupSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSubscription" ADD FOREIGN KEY ("groupMembershipId") REFERENCES "GroupMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
