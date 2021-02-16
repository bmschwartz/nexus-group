/*
  Warnings:

  - You are about to drop the column `outstandingBalance` on the `MemberSubscription` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `MemberSubscription` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `MemberSubscription` table. All the data in the column will be lost.

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
ALTER TABLE "MemberSubscription" DROP COLUMN "outstandingBalance",
DROP COLUMN "price",
DROP COLUMN "paymentStatus";

-- CreateTable
CREATE TABLE "SubscriptionInvoice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriptionId" UUID NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL,
    "chargedAmount" DOUBLE PRECISION NOT NULL,
    "paymentStatus" "PaymentStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SubscriptionInvoice" ADD FOREIGN KEY ("subscriptionId") REFERENCES "MemberSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSubscription" ADD FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSubscription" ADD FOREIGN KEY ("groupSubscriptionId") REFERENCES "GroupSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSubscription" ADD FOREIGN KEY ("groupMembershipId") REFERENCES "GroupMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
