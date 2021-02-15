import { Context } from "../context";
import {getGroupSubscription} from "./GroupSubscriptionRepository";

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
  const startDate = new Date()
  const endDate = new Date()
  endDate.setMonth(startDate.getMonth() + 1)

  try {
    await ctx.prisma.memberSubscription.update({
      where: {id: subscriptionId},
      data: {outstandingBalance: 0, startDate, endDate, recurring: true},
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

  const memberSubscription = await ctx.prisma.memberSubscription.findUnique({
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
    await ctx.prisma.memberSubscription.create({
      data: {
        groupSubscriptionId: groupSubscription.id,
        groupMembershipId: membershipId,
        price: groupSubscription.price,
        outstandingBalance: groupSubscription.price,
      },
    })
  } catch (e) {
    console.error(e)
    return { success: false, error: "Error creating Subscription" }
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
    memberSubscription.outstandingBalance === 0,
  ]

  return activeChecks.every(Boolean)
}
