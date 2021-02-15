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
        outstandingBalance: groupSubscription.price
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
