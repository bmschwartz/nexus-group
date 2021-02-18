import * as dotenv from "dotenv"
import schedule from "node-schedule"
import { Client as BitpayClient, Models, Currency } from "bitpay-sdk"
import { PrismaClient, SubscriptionBill, GroupSubscription, BillStatus } from "@prisma/client";
import { MessageClient } from "../messenger";
import { createBill } from "../../repository/SubscriptionBillRepository";
import {convertToLocalBillStatus, getAllSettledResults} from "../../helper"

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

const configFilePath = process.env.BITPAY_CONFIG_FILE

if (!configFilePath) {
  console.error("Unable to load BitPay config file")
  process.exit(1)
}

export class BillingClient {
  _db: PrismaClient
  _messenger: MessageClient
  _bitpayClient: BitpayClient
  _determineBillsJob: schedule.Job
  _updateBillStatusesJob: schedule.Job

  constructor({ prisma, messenger }: SubscriptionClientProps) {
    this._db = prisma
    this._messenger = messenger
    this._bitpayClient = new BitpayClient(configFilePath);

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
  ): Promise<SendBillResponse> {
    const billItems: Models.Item[] = [
      { id: `${bill.id}_membership`, description: `${groupName} Membership`, quantity: 1, price: groupSubscription.price },
      { id: `${bill.id}_platform`, description: `Trade Nexus Fee`, quantity: 1, price: PLATFORM_SUBSCRIPTION_FEE_USD },
    ]

    const billData = new Models.Bill(bill.id, Currency.USD, "schwartz.ben0@gmail.com", billItems);
    billData.cc = "stgben@gmail.com"

    const createdBill = await this._bitpayClient.CreateBill(billData);
    const deliveryResult = await this._bitpayClient.DeliverBill(createdBill.id, createdBill.token)
    console.log(deliveryResult)

    return {
      remoteBillId: createdBill.id,
      billToken: createdBill.token,
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
      where: { billStatus: { not: { equals: BillStatus.COMPLETE }} },
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
    const remoteBill = await this._bitpayClient.GetBill(remoteBillId)
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
