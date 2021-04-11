import { isAuthenticated, isGroupAdmin } from "./utils";
import { and, or, rule } from "graphql-shield";
import { Context } from "../context";
import { groupSubscriptionForInvoice, membershipForInvoice } from "../repository/SubscriptionInvoiceRepository";

const subscriptionInvoiceOwnerFromArgs = rule({ cache: "strict" })(
  async (parent, args, ctx: Context, info) => {
    return isSubscriptionInvoiceOwner(args.input.invoiceId, ctx)
  },
)

const subscriptionInvoiceOwnerFromParent = rule({ cache: "strict" })(
  async (parent, args, ctx: Context, info) => {
    return isSubscriptionInvoiceOwner(parent.id, ctx)
  },
)

const isSubscriptionInvoiceOwner = async (invoiceId, ctx: Context) => {
  const groupMembership = await membershipForInvoice(ctx, invoiceId)
  if (!groupMembership) {
    return false
  }
  return groupMembership.memberId === ctx.userId
}

const invoiceGroupOwner = rule({ cache: "strict" })(
  async (parent, args, ctx: Context, info) => {
    const groupSubscription = await groupSubscriptionForInvoice(ctx, parent.id)
    if (!groupSubscription) {
      return false
    }
    return isGroupAdmin(groupSubscription.groupId, args, ctx, info)
  },
)

export const SubscriptionInvoicePermissions = {
  "*": and(isAuthenticated, or(subscriptionInvoiceOwnerFromParent, invoiceGroupOwner)),
}

export const SubscriptionInvoiceMutationPermissions = {
  resetPayment: and(isAuthenticated, subscriptionInvoiceOwnerFromArgs),
}
