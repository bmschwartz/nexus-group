import { Context } from "../../context"

// @ts-ignore
import {
  activateMemberSubscription,
  cancelMemberSubscription,
  subscriptionIsActive,
} from "../../repository/MemberSubscriptionRepository"

export const MemberSubscriptionMutations = {
  async activateMemberSubscription(_: any, args: any, ctx: Context) {
    const {
      input: { subscriptionId },
    } = args

    return activateMemberSubscription(ctx, { subscriptionId })
  },

  async cancelMemberSubscription(_: any, args: any, ctx: Context) {
    const {
      input: { subscriptionId },
    } = args

    return cancelMemberSubscription(ctx, { subscriptionId })
  },
}

export const MemberSubscriptionResolvers = {
  async __resolveReference(subscription: any, ctx: Context) {
    return ctx.prisma.memberSubscription.findUnique({
      where: {
        id: subscription.id,
      },
    })
  },

  async active(subscription: any, args: any, ctx: Context) {
    return subscriptionIsActive(ctx, subscription.id)
  },
}
