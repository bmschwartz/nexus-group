import * as dotenv from "dotenv"
import * as btcpay from "btcpay"
import schedule from "node-schedule"
import { PrismaClient, SubscriptionBill, GroupSubscription, BillStatus } from "@prisma/client";
import { MessageClient } from "../messenger";
import { createBill } from "../../repository/SubscriptionBillRepository";
import { convertToLocalBillStatus, getAllSettledResults } from "../../helper"
import {logger} from "../../logger";
import {Context} from "../../context";

dotenv.config()

export interface SubscriptionClientProps {
  prisma: PrismaClient
  messenger: MessageClient
}

export interface SendBillResponse {
  billToken: string
  remoteBillId: string
  billStatus: BillStatus
}

const SUBSCRIPTION_DURATION_MONTHS = 1
const NEW_BILL_LEAD_TIME_DAYS = 7
export const PLATFORM_SUBSCRIPTION_FEE_USD = 2

// const bitpayToken = process.env.BITPAY_TOKEN
// const bitpayPrivateKey = process.env.BITPAY_PRIVATE_KEY
// const bitpayNotificationsURL = process.env.BITPAY_NOTIFICATIONS_URL
const btcPayKey = process.env.BTCPAY_KEY
const btcPayURL = process.env.BTCPAY_URL
const btcPayMerchant = process.env.BTCPAY_MERCHANT_ID
const btcPayKeyPair = btcpay.crypto.load_keypair(Buffer.from(btcPayKey, "hex"))

if (!btcPayKey || !btcPayKeyPair) {
  logger.error({ message: "BTCPay Keys Missing" })
  process.exit(1)
}

export class BillingClient {
  _db: PrismaClient
  _messenger: MessageClient
  _btcpayClient: btcpay.BTCPayClient
  _determineBillsJob: schedule.Job
  _updateBillStatusesJob: schedule.Job

  constructor({ prisma, messenger }: SubscriptionClientProps) {
    this._db = prisma
    this._messenger = messenger

    this._btcpayClient = new btcpay.BTCPayClient(btcPayURL, btcPayKeyPair, { merchant: btcPayMerchant })

    this._determineBillsJob = schedule.scheduleJob(
      "determineBillsToSend",
      "*/10 * * * * *",
      this.determineBillsToSend(this._db),
    )

    this._updateBillStatusesJob = schedule.scheduleJob(
      "updateBillStatuses",
      "*/30 * * * * *",
      this.updateBillStatuses(this._db),
    )
  }

  async sendSubscriptionBill(
    email: string,
    groupName: string,
    groupSubscription: GroupSubscription,
    bill: SubscriptionBill,
  ): Promise<SendBillResponse | null> {
    return null
  }

  async createInvoice(price: number): Promise<btcpay.Invoice> {
    // const invoiceData = new Models.Invoice(amount, Currency.USD)
    // invoiceData.notificationURL = "https://tradenexus.ngrok.io/payments"
    // invoiceData.redirectURL = "https://www.tradenexus.io"
    // invoiceData.buyer = { email }
    //
    // try {
    //   const response = await this._bitpayClient.CreateInvoice(invoiceData)
    //   console.log(response)
    //   return response
    // } catch (e) {
    //   console.error(e)
    // }
    const invoice = await this._btcpayClient.create_invoice({ price, currency: "USD", redirectUrl: "localhost:3000"})

    await this._btcpayClient.get_invoices({ status: "paid" })

    return invoice
  }

  determineBillsToSend(prisma: PrismaClient) {
    return async () => {
      const subscriptionEndDateThreshold = new Date()
      subscriptionEndDateThreshold.setDate(subscriptionEndDateThreshold.getDate() + NEW_BILL_LEAD_TIME_DAYS)

      const existingBillsForFuturePeriod = await prisma.subscriptionBill.findMany({
        where: { OR: [{ periodStart: null }, { periodStart: { gte: new Date() } }] },
        select: { subscriptionId: true },
      })
      const subscriptionIdsForBills = existingBillsForFuturePeriod.map(Bill => Bill.subscriptionId)

      let subscriptionsEndingSoonWithoutBill

      try {
        subscriptionsEndingSoonWithoutBill = await prisma.memberSubscription.findMany({
          where: {
            id: { notIn: subscriptionIdsForBills },
            AND: [{ endDate: { gte: new Date() } }, { endDate: { lte: subscriptionEndDateThreshold } }],
          },
          select: { id: true, groupSubscription: { select: { price: true } } },
        })
      } catch (e) {
        console.error(e)
        return
      }

      await Promise.all(
        subscriptionsEndingSoonWithoutBill.map(async subscription =>
          createBill(prisma, this, { subscriptionId: subscription.id, groupSubscription: subscription.groupSubscription }),
        ),
      )
    }
  }

  updateBillStatuses(prisma: PrismaClient) {
    return async () => {
      const localIncompleteBillIds: string[] = await this.localIncompleteBillIds(prisma)
      const remotePendingBillIds: string[] = await this.fetchRemotePendingBillIds()

      const remoteIdsToFetch = localIncompleteBillIds.filter(remoteId => !remotePendingBillIds.includes(remoteId))
      await Promise.all(remoteIdsToFetch.map((billId) => this.updateBill(billId)))
    }
  }

  async localIncompleteBillIds(prisma: PrismaClient): Promise<string[]> {
    const localIncompleteBills = await prisma.subscriptionBill.findMany({
      where: { billStatus: { not: { equals: BillStatus.COMPLETE } } },
      select: { remoteBillId: true },
    })

    return localIncompleteBills
      .map(bill => bill.remoteBillId)
      .filter(Boolean) as string[]
  }

  async fetchRemotePendingBillIds() {
    // const fetchPendingBillRequests = [
    //   this._bitpayClient.GetBills(BillStatus.DRAFT.toLowerCase()),
    //   this._bitpayClient.GetBills(BillStatus.NEW.toLowerCase()),
    //   this._bitpayClient.GetBills(BillStatus.SENT.toLowerCase()),
    //   // this._bitpayClient.GetBills(BillStatus.PAID.toLowerCase()),
    // ]
    //
    // const remotePendingBillResults = getAllSettledResults(await Promise.allSettled(fetchPendingBillRequests))
    // return remotePendingBillResults.flatMap((bills) => {
    //   return bills.map(bill => bill.id)
    // })
    return []
  }

  async updateBill(remoteBillId: string) {
    // let remoteBill: Models.BillInterface
    // try {
    //   remoteBill = await this._bitpayClient.GetBill(remoteBillId)
    // } catch (e) {
    //   console.error("Failed to fetch remote bill ", remoteBillId);
    //   return
    // }
    //
    // if (!remoteBill.status) {
    //   console.error("Remote bill status is null ", remoteBillId);
    //   return
    // }
    //
    // const localStatus = convertToLocalBillStatus(remoteBill.status)
    // if (!localStatus) {
    //   console.error("Could not convert remote bill status to local")
    // }
    //
    // const localBill = await this._db.subscriptionBill.findFirst({
    //   where: { remoteBillId },
    // })
    //
    // if (!localBill) {
    //   console.error("Could not find bill locally", remoteBillId)
    //   return
    // }
    //
    // const updateData = {
    //   amountPaid: localBill.amountCharged,
    //   billStatus: convertToLocalBillStatus(remoteBill.status) as BillStatus,
    // }
    //
    // if (localStatus === BillStatus.COMPLETE) {
    //   // const subscriptionEndDateThreshold = new Date()
    //   // subscriptionEndDateThreshold.setDate(subscriptionEndDateThreshold.getDate() + NEW_BILL_LEAD_TIME_DAYS)
    //   if (localBill.periodStart) {
    //     updateData["periodStart"] = localBill.periodStart > new Date() ? localBill.periodStart : new Date()
    //   } else {
    //     updateData["periodStart"] = new Date()
    //   }
    //
    //   const periodEnd = new Date(updateData["periodStart"])
    //   periodEnd.setMonth(periodEnd.getMonth() + SUBSCRIPTION_DURATION_MONTHS)
    //   updateData["periodEnd"] = periodEnd
    // }
    //
    // await this._db.subscriptionBill.update({
    //   where: { id: localBill.id },
    //   data: updateData,
    // })
  }
}
