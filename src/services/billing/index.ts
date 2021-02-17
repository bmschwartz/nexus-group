import * as dotenv from "dotenv"
import schedule, { Job } from "node-schedule"
import { Client as BitpayClient, Models, Currency } from "bitpay-sdk"
import { PrismaClient, BillStatus, SubscriptionBill, GroupSubscription } from "@prisma/client";
import { MessageClient } from "../messenger";
import { createBill } from "../../repository/SubscriptionBillRepository";

dotenv.config()

export interface SubscriptionClientProps {
  prisma: PrismaClient
  messenger: MessageClient
}

export interface SendBillResponse {
  remoteBillId: string
}

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

  constructor({ prisma, messenger }: SubscriptionClientProps) {
    this._db = prisma
    this._messenger = messenger
    this._bitpayClient = new BitpayClient(configFilePath);

    this._determineBillsJob = schedule.scheduleJob(
      "determineBillsToSend",
      "*/10 * * * * *",
      this.determineBillsToSend(this._db),
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

    const billData = new Models.Bill(bill.id, Currency.USD, "ben@tradenexus.io", billItems);
    billData.cc = "ben@tradenexus.io"

    const result = await this._bitpayClient.CreateBill(billData);

    return {
      remoteBillId: result.id,
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
}
