import * as dotenv from "dotenv"
import * as btcpay from "btcpay"
import schedule from "node-schedule"
import { PrismaClient, SubscriptionInvoice, InvoiceStatus } from "@prisma/client";
import { MessageClient } from "../messenger";
import {createInvoice, updateInvoice} from "../../repository/SubscriptionInvoiceRepository";
import {logger} from "../../logger";
import {Context} from "../../context";
import {getAllSettledResults} from "../../helper";

dotenv.config()

export interface SubscriptionClientProps {
  prisma: PrismaClient
  messenger: MessageClient
}

export interface SendInvoiceResponse {
  invoiceToken: string
  remoteInvoiceId: string
  invoiceStatus: InvoiceStatus
}

const NEW_BILL_LEAD_TIME_DAYS = 7
export const PLATFORM_SUBSCRIPTION_FEE_USD = 2

const btcPayKey = process.env.BTCPAY_KEY
const btcPayURL = process.env.BTCPAY_URL
const btcPayMerchant = process.env.BTCPAY_MERCHANT_ID
const btcPayRedirectUrl = process.env.BTCPAY_INVOICE_REDIRECT_URL
const btcPayNotificationUrl = process.env.BTCPAY_NOTIFICATION_URL
const btcPayKeyPair = btcpay.crypto.load_keypair(Buffer.from(btcPayKey, "hex"))

if (!btcPayKey || !btcPayKeyPair) {
  logger.error({ message: "BTCPay Keys Missing" })
  process.exit(1)
}

export class BillingClient {
  _db: PrismaClient
  _messenger: MessageClient
  _btcpayClient: btcpay.BTCPayClient
  _determineInvoicesJob: schedule.Job
  _updateInvoiceStatusesJob: schedule.Job

  constructor({ prisma, messenger }: SubscriptionClientProps) {
    this._db = prisma
    this._messenger = messenger

    this._btcpayClient = new btcpay.BTCPayClient(btcPayURL, btcPayKeyPair, { merchant: btcPayMerchant })

    this._determineInvoicesJob = schedule.scheduleJob(
      "determineInvoicesToSend",
      "*/10 * * * * *",
      this.determineInvoicesToSend(this._db),
    )

    this._updateInvoiceStatusesJob = schedule.scheduleJob(
      "updateInvoiceStatuses",
      "*/30 * * * * *",
      this.updateInvoiceStatuses(this._db),
    )
  }

  async createInvoice(invoice: SubscriptionInvoice): Promise<btcpay.Invoice> {
    const result = await this._btcpayClient.create_invoice({
      currency: "USD",
      orderId: invoice.id,
      buyerEmail: invoice.email,
      fullNotifications: true,
      price: invoice.amountCharged,
      redirectUrl: btcPayRedirectUrl,
      notificationURL: btcPayNotificationUrl,
    })
    console.log("Invoice url", result.url)
    return result
  }

  async refreshInvoiceData(prisma: PrismaClient, invoiceId: string) {
    let invoice: btcpay.Invoice
    try {
      invoice = await this._btcpayClient.get_invoice(invoiceId)
    } catch (e) {
      console.error(e)
      return
    }

    await updateInvoice(prisma, invoice)
  }

  determineInvoicesToSend(prisma: PrismaClient) {
    return async () => {
      const subscriptionEndDateThreshold = new Date()
      subscriptionEndDateThreshold.setDate(subscriptionEndDateThreshold.getDate() + NEW_BILL_LEAD_TIME_DAYS)

      const existingInvoicesForFuturePeriod = await prisma.subscriptionInvoice.findMany({
        where: { OR: [{ periodStart: null }, { periodStart: { gte: new Date() } }] },
        select: { subscriptionId: true },
      })
      const subscriptionIdsForInvoices = existingInvoicesForFuturePeriod.map(Invoice => Invoice.subscriptionId)

      let subscriptionsEndingSoonWithoutInvoice

      try {
        subscriptionsEndingSoonWithoutInvoice = await prisma.memberSubscription.findMany({
          where: {
            id: { notIn: subscriptionIdsForInvoices },
            AND: [{ endDate: { gte: new Date() } }, { endDate: { lte: subscriptionEndDateThreshold } }],
          },
          select: { id: true, groupSubscription: { select: { price: true } } },
        })
      } catch (e) {
        console.error(e)
        return
      }

      await Promise.all(
        subscriptionsEndingSoonWithoutInvoice.map(async subscription =>
          createInvoice(prisma, this, { subscriptionId: subscription.id, groupSubscription: subscription.groupSubscription }),
        ),
      )
    }
  }

  updateInvoiceStatuses(prisma: PrismaClient) {
    return async () => {
      const localIncompleteInvoiceIds: string[] = await this.localIncompleteInvoiceIds(prisma)
      const remotePendingInvoiceIds: string[] = await this.fetchRemotePendingInvoiceIds()

      const remoteIdsToFetch = localIncompleteInvoiceIds.filter(remoteId => !remotePendingInvoiceIds.includes(remoteId))
      await Promise.all(remoteIdsToFetch.map((invoiceId) => this.refreshInvoiceData(prisma, invoiceId)))
    }
  }

  async localIncompleteInvoiceIds(prisma: PrismaClient): Promise<string[]> {
    const localIncompleteInvoices = await prisma.subscriptionInvoice.findMany({
      where: { status: { not: { equals: InvoiceStatus.COMPLETE } } },
      select: { remoteId: true },
    })

    return localIncompleteInvoices
      .map(invoice => invoice.remoteId)
      .filter(Boolean) as string[]
  }

  async fetchRemotePendingInvoiceIds() {
    const fetchPendingInvoiceRequests: Promise<btcpay.Invoice[]>[] = [
      this._btcpayClient.get_invoices({ status: InvoiceStatus.NEW.toLowerCase() }),
      this._btcpayClient.get_invoices({ status: InvoiceStatus.PAID.toLowerCase() }),
      this._btcpayClient.get_invoices({ status: InvoiceStatus.COMPLETE.toLowerCase() }),
    ]

    const remotePendingInvoiceResults = getAllSettledResults(await Promise.allSettled(fetchPendingInvoiceRequests))
    return remotePendingInvoiceResults.flatMap((invoices) => {
      return invoices.map(invoice => invoice.id)
    })
  }
}
