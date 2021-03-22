import * as btcpay from "btcpay"
import { PrismaClient, GroupSubscription, SubscriptionInvoice, InvoiceStatus, PlatformFee } from "@prisma/client";

import { Context } from "../context";
import { BillingClient } from "../services/billing";
import { convertToLocalInvoiceStatus, getUserEmailById } from "../helper";
import { logger } from "../logger";
import { getActivePlatformFee } from "./PlatformFee";
import { updateSubscriptionDates } from "./MemberSubscriptionRepository";

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
}

const FALLBACK_SUBSCRIPTION_DURATION = 1

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
    await prisma.subscriptionInvoice.deleteMany({
      where: { subscriptionId, status: InvoiceStatus.NEW },
    })
  } catch (e) {
    logger.error({ message: "Error deleting existing new invoice for this subscription" })
  }

  const platformFee: PlatformFee = await getActivePlatformFee(prisma)

  try {
    const totalCost = groupSubscription.price + (platformFee.price * groupSubscription.duration)

    invoice = await prisma.subscriptionInvoice.create({
      data: {
        subscriptionId,
        email: userEmail,
        usdPrice: totalCost,
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

export async function getSubscriptionDuration(prisma: PrismaClient, invoice: SubscriptionInvoice): Promise<number> {
  try {
    const memberSubscription = await prisma.memberSubscription.findUnique({
      where: { id: invoice.subscriptionId },
      include: {
        groupSubscription: {
          select: { duration: true }
        }
      }
    })
    return memberSubscription.groupSubscription.duration
  } catch (e) {
    logger.error({ message: "Error getting memberSubscription", error: e.meta, subscriptionId: invoice.subscriptionId })
    return FALLBACK_SUBSCRIPTION_DURATION
  }
}

export async function updateInvoice(
  prisma: PrismaClient,
  remoteInvoice: btcpay.Invoice,
) {
  const {
    orderId: id,
    currentTime: updateTime,
    btcPaid,
    btcPrice,
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
    updateData["btcPaid"] = Number(btcPaid)
  }
  if (btcPrice) {
    updateData["btcPrice"] = Number(btcPrice)
  }

  if (localStatus === InvoiceStatus.COMPLETE) {
    let startDate: Date
    if (localInvoice.periodStart) {
      startDate = localInvoice.periodStart > new Date() ? localInvoice.periodStart : new Date()
    } else {
      startDate = new Date()
    }
    updateData["periodStart"] = startDate

    const subscriptionDuration = await getSubscriptionDuration(prisma, localInvoice)
    const endDate = new Date(updateData["periodStart"])
    endDate.setMonth(endDate.getMonth() + subscriptionDuration)
    updateData["periodEnd"] = endDate

    await updateSubscriptionDates(prisma, { subscriptionId: localInvoice.subscriptionId, startDate, endDate })
  }

  await prisma.subscriptionInvoice.update({
    where: { id: localInvoice.id },
    data: updateData,
  })


}
