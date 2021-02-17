import { Context } from "../context";
import {PrismaClient, PaymentStatus, SubscriptionInvoice} from "@prisma/client";
import {SubscriptionClient} from "../services/subscription";

export interface CreateSubscriptionInvoiceInput {
  subscriptionId: string
  price: number
}

export interface GetPendingInvoiceInput {
  subscriptionId: string
}

export interface LatestInvoicePaidInput {
  subscriptionId: string
}

export async function createInvoice(
  prisma: PrismaClient,
  subscriptionClient: SubscriptionClient,
  { subscriptionId, price }: CreateSubscriptionInvoiceInput,
): Promise<SubscriptionInvoice | null> {
  let invoice

  try {
    invoice = await prisma.subscriptionInvoice.create({
      data: {
        subscriptionId,
        chargedAmount: price,
        paidAmount: 0,
        paymentStatus: PaymentStatus.PENDING,
      },
    })

    await subscriptionClient.sendSubscriptionInvoice(invoice.id)

  } catch (e) {
    console.error("Error creating invoice to send!", e)
    return null
  }

  return invoice
}

export async function getPendingInvoice(
  ctx: Context,
  { subscriptionId }: GetPendingInvoiceInput,
): Promise<SubscriptionInvoice | null> {
  let invoice

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

export async function latestInvoicePaid(
  ctx: Context,
  { subscriptionId }: LatestInvoicePaidInput,
): Promise<boolean> {
  const invoice = await ctx.prisma.subscriptionInvoice.findFirst({
    where: { subscriptionId },
    orderBy: { createdAt: "desc" },
    select: { paymentStatus: true },
  })

  if (!invoice) {
    return false
  }

  return invoice.paymentStatus === PaymentStatus.COMPLETED
}
