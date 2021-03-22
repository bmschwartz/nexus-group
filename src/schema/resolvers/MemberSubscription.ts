import { Context } from "../../context"

// @ts-ignore
import {
  activateMemberSubscription,
  cancelMemberSubscription, getSubscriptionInvoices, payMemberSubscription, resetPayment,
  subscriptionIsActive, switchSubscriptionOption,
} from "../../repository/MemberSubscriptionRepository"
import {getGroupSubscription} from "../../repository/GroupSubscriptionRepository";
import {logger} from "../../logger";

export const MemberSubscriptionMutations = {
  async payMemberSubscription(_: any, args: any, ctx: Context) {
    const {
      input: { groupId, membershipId, subscriptionOptionId },
    } = args

    return payMemberSubscription(ctx, { groupId, membershipId, subscriptionOptionId })
  },

  async resetPayment(_: any, args: any, ctx: Context) {
    const {
      input: { invoiceId },
    } = args

    return resetPayment(ctx, { invoiceId })
  },

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

  async switchSubscriptionOption(_: any, args: any, ctx: Context) {
    const {
      input: { membershipId, subscriptionOptionId },
    } = args

    return switchSubscriptionOption(ctx, { membershipId, subscriptionOptionId })
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

  async groupSubscription(subscription: any, args: any, ctx: Context) {
    try {
      return getGroupSubscription(ctx, subscription.groupSubscriptionId)
    } catch (e) {
      logger.error({
        error: e.meta,
        message: `Error getting group subscription from subscription [${subscription.id}]`,
      })
      throw e
    }
  },

  async active(subscription: any, args: any, ctx: Context) {
    return subscriptionIsActive(ctx, subscription.id)
  },

  async invoices(subscription: any, args: any, ctx: Context) {
    return getSubscriptionInvoices(ctx, subscription.id)
  },
}
