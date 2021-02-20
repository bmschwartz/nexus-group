import * as dotenv from "dotenv"
import schedule from "node-schedule"
import { PrismaClient, SubscriptionBill, GroupSubscription, BillStatus } from "@prisma/client";
import { MessageClient } from "../messenger";
import { createBill } from "../../repository/SubscriptionBillRepository";
import { convertToLocalBillStatus, getAllSettledResults } from "../../helper"
import {
  Client as BitpayClient,
  Env as BitPayEnv,
  Tokens, Models,
  Currency,
} from "bitpay-sdk";

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

const bitpayToken = process.env.BITPAY_TOKEN
const bitpayPrivateKey = process.env.BITPAY_PRIVATE_KEY

if (!bitpayToken || !bitpayPrivateKey) {
  console.error("Unable to load BitPay token or key")
  process.exit(1)
}

export class BillingClient {
  _db: PrismaClient
  _messenger: MessageClient
  _bitpayClient: BitpayClient
  _determineBillsJob: schedule.Job
  _updateBillStatusesJob: schedule.Job

  constructor({ prisma, messenger }: SubscriptionClientProps) {
    const tokens = Tokens
    tokens.merchant = bitpayToken as string

    this._db = prisma
    this._messenger = messenger
    this._bitpayClient = new BitpayClient(
      "",
      BitPayEnv.Test,
      bitpayPrivateKey as string,
      tokens,
    );

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
    const billItems: Models.Item[] = [
      { id: `${bill.id}_membership`, description: `${groupName} Membership`, quantity: 1, price: groupSubscription.price },
      { id: `${bill.id}_platform`, description: `Trade Nexus Fee`, quantity: 1, price: PLATFORM_SUBSCRIPTION_FEE_USD },
    ]

    const billData = new Models.Bill(bill.id, Currency.USD, "schwartz.ben0@gmail.com", billItems);
    billData.cc = ["stgben@gmail.com"]

    let createdBill: Models.BillInterface
    try {
      createdBill = await this._bitpayClient.CreateBill(billData);
    } catch (e) {
      console.error("Unable to create a bill for ", bill.subscriptionId)
      return null
    }
    const { id: remoteBillId, token: billToken } = createdBill
    if (remoteBillId === null || billToken === null) {
      console.error("Bill ID or Bill Token are null for ", bill.subscriptionId)
      return null
    }

    const deliveryResult = await this._bitpayClient.DeliverBill(remoteBillId, billToken)
    console.log(deliveryResult)

    return {
      billToken,
      remoteBillId,
      billStatus: BillStatus.DRAFT,
    }
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
    const fetchPendingBillRequests = [
      this._bitpayClient.GetBills(BillStatus.DRAFT.toLowerCase()),
      this._bitpayClient.GetBills(BillStatus.NEW.toLowerCase()),
      this._bitpayClient.GetBills(BillStatus.SENT.toLowerCase()),
      // this._bitpayClient.GetBills(BillStatus.PAID.toLowerCase()),
    ]

    const remotePendingBillResults = getAllSettledResults(await Promise.allSettled(fetchPendingBillRequests))
    return remotePendingBillResults.flatMap((bills) => {
      return bills.map(bill => bill.id)
    })
  }

  async updateBill(remoteBillId: string) {
    let remoteBill: Models.BillInterface
    try {
      remoteBill = await this._bitpayClient.GetBill(remoteBillId)
    } catch (e) {
      console.error("Failed to fetch remote bill ", remoteBillId);
      return
    }

    if (!remoteBill.status) {
      console.error("Remote bill status is null ", remoteBillId);
      return
    }

    const localStatus = convertToLocalBillStatus(remoteBill.status)
    if (!localStatus) {
      console.error("Could not convert remote bill status to local")
    }

    const localBill = await this._db.subscriptionBill.findFirst({
      where: { remoteBillId },
    })

    if (!localBill) {
      console.error("Could not find bill locally", remoteBillId)
      return
    }

    const updateData = {
      amountPaid: localBill.amountCharged,
      billStatus: convertToLocalBillStatus(remoteBill.status) as BillStatus,
    }

    if (localStatus === BillStatus.COMPLETE) {
      // const subscriptionEndDateThreshold = new Date()
      // subscriptionEndDateThreshold.setDate(subscriptionEndDateThreshold.getDate() + NEW_BILL_LEAD_TIME_DAYS)
      if (localBill.periodStart) {
        updateData["periodStart"] = localBill.periodStart > new Date() ? localBill.periodStart : new Date()
      } else {
        updateData["periodStart"] = new Date()
      }

      const periodEnd = new Date(updateData["periodStart"])
      periodEnd.setMonth(periodEnd.getMonth() + SUBSCRIPTION_DURATION_MONTHS)
      updateData["periodEnd"] = periodEnd
    }

    await this._db.subscriptionBill.update({
      where: { id: localBill.id },
      data: updateData,
    })
  }
}
