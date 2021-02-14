/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[id,groupId]` on the table `GroupSubscription`. If there are existing duplicate values, the migration will fail.
  - The migration will add a unique constraint covering the columns `[groupId]` on the table `GroupSubscription`. If there are existing duplicate values, the migration will fail.
  - The migration will add a unique constraint covering the columns `[groupMembershipId]` on the table `MemberSubscription`. If there are existing duplicate values, the migration will fail.

*/
-- DropForeignKey
ALTER TABLE "GroupMembership" DROP CONSTRAINT "GroupMembership_groupId_fkey";

-- DropForeignKey
ALTER TABLE "GroupSubscription" DROP CONSTRAINT "GroupSubscription_groupId_fkey";

-- DropForeignKey
ALTER TABLE "MemberSubscription" DROP CONSTRAINT "MemberSubscription_groupMembershipId_fkey";

-- DropForeignKey
ALTER TABLE "MemberSubscription" DROP CONSTRAINT "MemberSubscription_groupSubscriptionId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "GroupSubscription_id_groupId_key" ON "GroupSubscription"("id", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupSubscription_groupId_unique" ON "GroupSubscription"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberSubscription_groupMembershipId_unique" ON "MemberSubscription"("groupMembershipId");

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSubscription" ADD FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSubscription" ADD FOREIGN KEY ("groupSubscriptionId") REFERENCES "GroupSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSubscription" ADD FOREIGN KEY ("groupMembershipId") REFERENCES "GroupMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
