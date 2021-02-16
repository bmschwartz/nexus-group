import {PrismaClient} from "@prisma/client";
import {MessageClient} from "../messenger";

interface PaymentClientProps {
  prisma: PrismaClient
  messenger: MessageClient
}

export class PaymentClient {
  _db: PrismaClient
  _messenger: MessageClient

  constructor({ prisma, messenger }: PaymentClientProps) {
    this._db = prisma
    this._messenger = messenger
  }

  async sendSubscriptionInvoice(subscriptionId: string) {
    console.log("Sending subscription invoice to ", subscriptionId)
  }
}
