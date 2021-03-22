/*
  Warnings:

  - You are about to drop the column `amountPaid` on the `SubscriptionInvoice` table. All the data in the column will be lost.
  - You are about to drop the column `amountCharged` on the `SubscriptionInvoice` table. All the data in the column will be lost.
  - Added the required column `usdPrice` to the `SubscriptionInvoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SubscriptionInvoice" DROP COLUMN "amountPaid",
DROP COLUMN "amountCharged",
ADD COLUMN     "btcPaid" DECIMAL(65,30),
ADD COLUMN     "btcPrice" DECIMAL(65,30),
ADD COLUMN     "usdPrice" DECIMAL(65,30) NOT NULL;
