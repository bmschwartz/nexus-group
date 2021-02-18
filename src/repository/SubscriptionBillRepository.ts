import { Context } from "../context";
import {PrismaClient, BillStatus, SubscriptionBill, GroupSubscription} from "@prisma/client";
import {BillingClient, PLATFORM_SUBSCRIPTION_FEE_USD, SendBillResponse} from "../services/billing";

export interface CreateSubscriptionBillInput {
  subscriptionId: string
  groupSubscription: GroupSubscription
}

export interface GetPendingBillInput {
  subscriptionId: string
}

export interface LatestBillPaidInput {
  subscriptionId: string
}

export async function createBill(
  prisma: PrismaClient,
  billingClient: BillingClient,
  { subscriptionId, groupSubscription }: CreateSubscriptionBillInput,
): Promise<SubscriptionBill | null> {
  let bill
  let memberSubscription

  try {
    memberSubscription = await prisma.memberSubscription.findUnique({
      where: {id: subscriptionId},
    })
  } catch (e) {
    console.error("Error getting subscription", e)
  }

  if (!memberSubscription) {
    console.error("Could not find subscription when trying to createBill!")
    return null
  }

  try {
    const totalCost = groupSubscription.price + PLATFORM_SUBSCRIPTION_FEE_USD

    bill = await prisma.subscriptionBill.create({
      data: {
        email: "ben@tradenexus.io",
        subscriptionId,
        amountCharged: totalCost,
        amountPaid: 0,
        periodStart: memberSubscription.endDate,
        billStatus: BillStatus.DRAFT,
      },
    })
  } catch (e) {
    console.error("Error creating bill to send!", e)
    return null
  }

  let billResponse: SendBillResponse
  if (bill) {
    try {
      billResponse = await billingClient.sendSubscriptionBill("ben@tradenexus.io", "Cool Group", groupSubscription, bill)
      const { remoteBillId, billToken, billStatus } = billResponse
      bill = await prisma.subscriptionBill.update({
        where: { id: bill.id },
        data: { remoteBillId, billToken, billStatus },
      })
    } catch (e) {
      console.error(e)
      await prisma.subscriptionBill.delete({
        where: { id: bill.id },
      })
    }
  }

  return bill
}

export async function getPendingBill(
  ctx: Context,
  { subscriptionId }: GetPendingBillInput,
): Promise<SubscriptionBill | null> {
  let bill

  try {
    bill = await ctx.prisma.subscriptionBill.findFirst({
      orderBy: { createdAt: "desc" },
      where: { subscriptionId },
    })
  } catch (e) {
    return null
  }

  return bill
}

export async function latestBillPaid(
  ctx: Context,
  { subscriptionId }: LatestBillPaidInput,
): Promise<boolean> {
  const bill = await ctx.prisma.subscriptionBill.findFirst({
    where: { subscriptionId },
    orderBy: { createdAt: "desc" },
    select: { billStatus: true },
  })

  if (!bill) {
    return false
  }

  return bill.billStatus === BillStatus.COMPLETE
}
