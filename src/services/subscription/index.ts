import * as dotenv from "dotenv"
import schedule, {Job} from "node-schedule"
import {Client as BitpayClient, Models} from "bitpay-sdk"
import {PrismaClient, PaymentStatus, SubscriptionInvoice} from "@prisma/client";
import {MessageClient} from "../messenger";
import {createInvoice} from "../../repository/SubscriptionInvoiceRepository";

dotenv.config()

interface SubscriptionClientProps {
  prisma: PrismaClient
  messenger: MessageClient
}

const NEW_INVOICE_LEAD_TIME_DAYS = 7

const configFilePath = process.env.BITPAY_CONFIG_FILE

if (!configFilePath) {
  console.error("Unable to load BitPay config file")
  process.exit(1)
}

export class SubscriptionClient {
  _db: PrismaClient
  _messenger: MessageClient
  _bitpayClient: BitpayClient
  _determineInvoicesJob: schedule.Job

  constructor({ prisma, messenger }: SubscriptionClientProps) {
    this._db = prisma
    this._messenger = messenger
    this._bitpayClient = new BitpayClient(configFilePath);

    this._determineInvoicesJob = schedule.scheduleJob(
      "determineInvoicesToSend",
      "*/10 * * * * *",
      this.determineInvoicesToSend(this._db),
    )
  }

  async sendSubscriptionInvoice(subscriptionId: string) {
    console.log("Sending subscription invoice to ", subscriptionId)
  }

  determineInvoicesToSend(prisma: PrismaClient) {
    return async () => {
      const subscriptionEndDateThreshold = new Date()
      subscriptionEndDateThreshold.setDate(subscriptionEndDateThreshold.getDate() + NEW_INVOICE_LEAD_TIME_DAYS)

      const existingInvoicesForFuturePeriod = await prisma.subscriptionInvoice.findMany({
        where: { OR: [{ periodStart: null }, { periodStart: { gte: new Date() } }] },
        select: { subscriptionId: true },
      })
      const subscriptionIdsForInvoices = existingInvoicesForFuturePeriod.map(invoice => invoice.subscriptionId)

      let subscriptionsEndingSoonWithoutInvoice

      try {
        subscriptionsEndingSoonWithoutInvoice = await prisma.memberSubscription.findMany({
          where: {
            id: { notIn: subscriptionIdsForInvoices },
            AND: [{endDate: {gte: new Date()}}, {endDate: {lte: subscriptionEndDateThreshold}}],
          },
          select: {id: true, groupSubscription: {select: {price: true}}},
        })
      } catch (e) {
        console.error(e)
        return
      }

      await Promise.all(
        subscriptionsEndingSoonWithoutInvoice.map(async subscription =>
          createInvoice(prisma, this, { subscriptionId: subscription.id, price: subscription.groupSubscription.price }),
        ),
      )
    }
  }
}
