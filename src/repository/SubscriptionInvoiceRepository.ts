import * as btcpay from "btcpay"
import {PrismaClient, GroupSubscription, SubscriptionInvoice, InvoiceStatus} from "@prisma/client";

import { Context } from "../context";
import { BillingClient, PLATFORM_SUBSCRIPTION_FEE_USD } from "../services/billing";
import {convertToLocalInvoiceStatus, getUserEmailById} from "../helper";

export interface CreateSubscriptionInvoiceInput {
  subscriptionId: string
  groupSubscription: GroupSubscription
}

export interface GetPendingInvoiceInput {
  subscriptionId: string
}

export interface LatestInvoicePaidInput {
  subscriptionId: string
}

export interface InvoiceUpdateInput {
  invoiceId: string
  status: string
  amountPaid: number
}

const SUBSCRIPTION_DURATION_MONTHS = 1

export async function createInvoice(
  prisma: PrismaClient,
  billingClient: BillingClient,
  { subscriptionId, groupSubscription }: CreateSubscriptionInvoiceInput,
): Promise<SubscriptionInvoice | null> {
  let invoice
  let userEmail
  let memberSubscription

  try {
    memberSubscription = await prisma.memberSubscription.findUnique({
      where: { id: subscriptionId },
    })
  } catch (e) {
    console.error("Error getting subscription", e)
  }

  if (!memberSubscription) {
    console.error("Could not find subscription when trying to create invoice!")
    return null
  }

  try {
    const membership = await prisma.groupMembership.findUnique({
      where: { id: memberSubscription.groupMembershipId },
    })

    if (!membership) {
      console.error("No matching membership found")
      return null
    }

    userEmail = await getUserEmailById(membership.memberId)
  } catch (e) {
    console.error("Error getting membership")
    return null
  }

  try {
    const totalCost = groupSubscription.price + PLATFORM_SUBSCRIPTION_FEE_USD

    invoice = await prisma.subscriptionInvoice.create({
      data: {
        amountPaid: 0,
        subscriptionId,
        amountCharged: totalCost,
        email: userEmail,
        status: InvoiceStatus.NEW,
        periodStart: memberSubscription.endDate,
      },
    })
  } catch (e) {
    console.error("Error creating invoice to send!", e)
    return null
  }

  let invoiceResponse: btcpay.Invoice | null
  if (invoice) {
    invoiceResponse = await billingClient.createInvoice(invoice)

    if (!invoiceResponse) {
      await prisma.subscriptionInvoice.delete({
        where: { id: invoice.id },
      })
      return
    }

    const { id: remoteId, token, status } = invoiceResponse
    const invoiceStatus = convertToLocalInvoiceStatus(status)

    invoice = await prisma.subscriptionInvoice.update({
      where: { id: invoice.id },
      data: { remoteId, token, status: invoiceStatus },
    })
  }

  return invoice
}

export async function getPendingSubscription(
  ctx: Context,
  { subscriptionId }: GetPendingInvoiceInput,
): Promise<SubscriptionInvoice | null> {
  let invoice: SubscriptionInvoice | null

  try {
    invoice = await ctx.prisma.subscriptionInvoice.findFirst({
      orderBy: { createdAt: "desc" },
      where: { subscriptionId },
    })
  } catch (e) {
    return null
  }

  return invoice
}

export async function latestInvoiceIsPaid(
  ctx: Context,
  { subscriptionId }: LatestInvoicePaidInput,
): Promise<boolean> {
  const invoice = await ctx.prisma.subscriptionInvoice.findFirst({
    where: { subscriptionId },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  })

  if (!invoice) {
    return false
  }

  return invoice.status === InvoiceStatus.COMPLETE
}

export async function updateInvoice(
  prisma: PrismaClient,
  remoteInvoice: btcpay.Invoice,
) {
  const {
    orderId: id,
    currentTime: updateTime,
    btcPaid,
    status,
  } = remoteInvoice

  const localInvoice = await prisma.subscriptionInvoice.findUnique({ where: { id } })

  if (!localInvoice || localInvoice.updatedAt.getTime() >= updateTime) {
    return
  }

  const localStatus = convertToLocalInvoiceStatus(status)
  const updateData = {
    updatedAt: new Date(updateTime),
    status: localStatus,
  }

  if (btcPaid) {
    updateData["amountPaid"] = Number(btcPaid)
  }

  if (localStatus === InvoiceStatus.COMPLETE) {
    // const subscriptionEndDateThreshold = new Date()
    // subscriptionEndDateThreshold.setDate(subscriptionEndDateThreshold.getDate() + NEW_BILL_LEAD_TIME_DAYS)
    if (localInvoice.periodStart) {
      updateData["periodStart"] = localInvoice.periodStart > new Date() ? localInvoice.periodStart : new Date()
    } else {
      updateData["periodStart"] = new Date()
    }

    const periodEnd = new Date(updateData["periodStart"])
    periodEnd.setMonth(periodEnd.getMonth() + SUBSCRIPTION_DURATION_MONTHS)
    updateData["periodEnd"] = periodEnd
  }

  await prisma.subscriptionInvoice.update({
    where: { id: localInvoice.id },
    data: updateData,
  })

}
