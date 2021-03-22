/*
  Warnings:

  - You are about to alter the column `amountPaid` on the `SubscriptionInvoice` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amountCharged` on the `SubscriptionInvoice` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "SubscriptionInvoice" ALTER COLUMN "amountPaid" DROP NOT NULL,
ALTER COLUMN "amountPaid" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "amountCharged" DROP NOT NULL,
ALTER COLUMN "amountCharged" SET DATA TYPE DECIMAL(65,30);
