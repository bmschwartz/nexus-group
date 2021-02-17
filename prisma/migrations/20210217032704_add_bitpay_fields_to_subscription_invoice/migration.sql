/*
  Warnings:

  - You are about to drop the column `paidAmount` on the `SubscriptionInvoice` table. All the data in the column will be lost.
  - You are about to drop the column `chargedAmount` on the `SubscriptionInvoice` table. All the data in the column will be lost.
  - Added the required column `amountPaid` to the `SubscriptionInvoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amountCharged` to the `SubscriptionInvoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SubscriptionInvoice" DROP COLUMN "paidAmount",
DROP COLUMN "chargedAmount",
ADD COLUMN     "amountPaid" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "amountCharged" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "invoiceURL" TEXT,
ADD COLUMN     "remoteInvoiceId" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3);
