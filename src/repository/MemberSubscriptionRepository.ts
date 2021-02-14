import { Context } from "../context";
import {getGroupSubscription} from "./GroupSubscriptionRepository";

export interface CreateMemberSubscriptionInput {
  membershipId: string
  groupSubscriptionId: string
}

export interface CreateMemberSubscriptionResult {
  success: boolean
  error?: string
}

export async function createMemberSubscription(
  ctx: Context, input: CreateMemberSubscriptionInput,
): Promise<CreateMemberSubscriptionResult> {
  const { membershipId, groupSubscriptionId } = input
  const memberSubscription = await ctx.prisma.memberSubscription.findUnique({
    where: {
      MemberSubscription_groupMembershipId_groupSubscriptionId_key: {
        groupSubscriptionId, groupMembershipId: membershipId,
      },
    },
  })

  if (memberSubscription) {
    return { success: false, error: "Subscription already exists!"}
  }

  const groupSubscription = await getGroupSubscription(ctx, groupSubscriptionId)
  if (!groupSubscription) {
    return { success: false, error: "Group subscription does not exist!" }
  }

  try {
    await ctx.prisma.memberSubscription.create({
      data: {groupSubscriptionId, groupMembershipId: membershipId, outstandingBalance: groupSubscription.price },
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
