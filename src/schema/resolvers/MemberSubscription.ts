import { Context } from "../../context"

// @ts-ignore
import { createMemberSubscription, subscriptionIsActive } from "../../repository/MemberSubscriptionRepository"

export const MemberSubscriptionMutations = {
  async createMemberSubscription(_: any, args: any, ctx: Context) {
    const {
      input: { membershipId, groupSubscriptionId },
    } = args

    return createMemberSubscription(ctx, { membershipId, groupSubscriptionId })
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
