/*
  Warnings:

  - You are about to drop the `SubscriptionBill` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('NEW', 'PAID', 'CONFIRMED', 'COMPLETE', 'EXPIRED', 'INVALID');

-- DropForeignKey
ALTER TABLE "SubscriptionBill" DROP CONSTRAINT "SubscriptionBill_subscriptionId_fkey";

-- DropEnum
DROP TYPE "BillStatus" CASCADE;

-- CreateTable
CREATE TABLE "SubscriptionInvoice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriptionId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "amountCharged" DOUBLE PRECISION NOT NULL,
    "status" "InvoiceStatus" NOT NULL,
    "remoteId" TEXT,
    "token" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id")
);

-- DropTable
DROP TABLE "SubscriptionBill";

-- AddForeignKey
ALTER TABLE "SubscriptionInvoice" ADD FOREIGN KEY ("subscriptionId") REFERENCES "MemberSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
