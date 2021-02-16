/*
  Warnings:

  - Added the required column `periodStart` to the `SubscriptionInvoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodEnd` to the `SubscriptionInvoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SubscriptionInvoice" ADD COLUMN     "periodStart" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "periodEnd" TIMESTAMP(3) NOT NULL;
