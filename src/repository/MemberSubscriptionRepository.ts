import { Context } from "../context";
import {PrismaClient, SubscriptionBill} from "@prisma/client";
import {createBill} from "./SubscriptionBillRepository";

export interface CreateMemberSubscriptionInput {
  membershipId: string
  groupId: string
}

export interface CreateMemberSubscriptionResult {
  success: boolean
  error?: string
}

export interface PayMemberSubscriptionInput {
  subscriptionId: string
}

export interface PayMemberSubscriptionResult {
  success: boolean
  error?: string
}

export interface ActivateMemberSubscriptionInput {
  subscriptionId: string
}

export interface ActivateMemberSubscriptionResult {
  success: boolean
  error?: string
}

export interface CancelMemberSubscriptionInput {
  subscriptionId: string
}

export interface CancelMemberSubscriptionResult {
  success: boolean
  error?: string
}

export async function payMemberSubscription(
  ctx: Context,
  { subscriptionId }: PayMemberSubscriptionInput,
): Promise<PayMemberSubscriptionResult> {
  try {
    const memberSubscription = await ctx.prisma.memberSubscription.findUnique({
      where: { id: subscriptionId },
    })

    if (!memberSubscription) {
      return { success: false, error: "Subscription does not exist" }
    }

    const groupSubscription = await ctx.prisma.groupSubscription.findUnique({
      where: {id: memberSubscription.groupSubscriptionId},
    })

    if (!groupSubscription) {
      return { success: false, error: "Could not find matching group subscription" }
    }

    await createBill(ctx.prisma, ctx.billing, {subscriptionId, groupSubscription})

  } catch (e) {
    return { success: false, error: "Could not submit subscription bill" }
  }

  return { success: true }
}

export async function setSubscriptionPaid(prisma: PrismaClient, subscriptionId: string) {
  try {
    await prisma.memberSubscription.update({
      where: {id: subscriptionId},
      data: { recurring: true },
    })
  } catch (e) {
    return { success: false, error: "Could not pay subscription" }
  }
  return { success: true }
}

export async function activateMemberSubscription(
  ctx: Context,
  { subscriptionId }: ActivateMemberSubscriptionInput,
): Promise<ActivateMemberSubscriptionResult> {
  try {
    await ctx.prisma.memberSubscription.update({
      where: {id: subscriptionId},
      data: { recurring: true },
    })
  } catch (e) {
    return { success: false, error: "Could not activate subscription" }
  }
  return { success: true }
}

export async function cancelMemberSubscription(
  ctx: Context,
  { subscriptionId }: CancelMemberSubscriptionInput,
): Promise<CancelMemberSubscriptionResult> {
  try {
    await ctx.prisma.memberSubscription.update({
      where: {id: subscriptionId},
      data: {recurring: false},
    })
  } catch (e) {
    return { success: false, error: "Could not cancel subscription" }
  }

  return { success: true }
}

export async function createMemberSubscription(
  ctx: Context, input: CreateMemberSubscriptionInput,
): Promise<CreateMemberSubscriptionResult> {
  const { membershipId, groupId } = input

  const groupSubscription = await ctx.prisma.groupSubscription.findFirst({
    where: { groupId, active: true },
  })

  if (!groupSubscription) {
    return { success: false, error: "Group subscription does not exist!" }
  }

  let memberSubscription = await ctx.prisma.memberSubscription.findUnique({
    where: {
      MemberSubscription_groupMembershipId_groupSubscriptionId_key: {
        groupSubscriptionId: groupSubscription.id, groupMembershipId: membershipId,
      },
    },
  })

  if (memberSubscription) {
    return { success: false, error: "Subscription already exists!"}
  }

  try {
    memberSubscription = await ctx.prisma.memberSubscription.create({
      data: {
        groupSubscriptionId: groupSubscription.id,
        groupMembershipId: membershipId,
      },
    })
  } catch (e) {
    console.error(e)
    return { success: false, error: "Error creating Subscription" }
  }

  if (memberSubscription) {
    await createBill(ctx.prisma, ctx.billing, {
      subscriptionId: memberSubscription.id,
      groupSubscription,
    })
  }

  return { success: true }
}

export async function subscriptionIsActive(ctx: Context, subscriptionId: string): Promise<boolean> {
  const memberSubscription = await ctx.prisma.memberSubscription.findUnique({ where: { id: subscriptionId } })
  if (!memberSubscription) {
    return false
  }

  const now = new Date()

  const activeChecks = [
    memberSubscription.startDate && memberSubscription.startDate < now,
    memberSubscription.endDate && memberSubscription.endDate > now,
  ]

  return activeChecks.every(Boolean)
}

export async function getSubscriptionBills(ctx: Context, subscriptionId: string): Promise<SubscriptionBill[]> {
  return ctx.prisma.subscriptionBill.findMany({
    where: { subscriptionId },
  })
}
