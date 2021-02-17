/*
  Warnings:

  - You are about to drop the `SubscriptionInvoice` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('DRAFT', 'SENT', 'NEW', 'PAID', 'COMPLETE');

-- DropForeignKey
ALTER TABLE "SubscriptionInvoice" DROP CONSTRAINT "SubscriptionInvoice_subscriptionId_fkey";

-- DropEnum
DROP TYPE "PaymentStatus" CASCADE;

-- CreateTable
CREATE TABLE "SubscriptionBill" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriptionId" UUID NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "amountCharged" DOUBLE PRECISION NOT NULL,
    "billStatus" "BillStatus" NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "remoteBillId" TEXT,
    "billToken" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id")
);

-- DropTable
DROP TABLE "SubscriptionInvoice";

-- AddForeignKey
ALTER TABLE "SubscriptionBill" ADD FOREIGN KEY ("subscriptionId") REFERENCES "MemberSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
