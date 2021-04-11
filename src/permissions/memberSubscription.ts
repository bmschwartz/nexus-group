import { and, or, rule } from "graphql-shield";
import { isAuthenticated, isGroupAdmin, isMembershipUser } from "./utils";
import { Context } from "../context";

const membershipUser = rule({ cache: "strict" })(
  async (parent, args, ctx: Context, info) => {
    return isMembershipUser(args.input.membershipId, args, ctx, info)
  },
)

const groupAdmin = rule({ cache: "strict" })(
  async (parent, args, ctx: Context, info) => {
    return isGroupAdmin(args.input.groupId, args, ctx, info)
  },
)

export const MemberSubscriptionPermissions = {
  "*": and(isAuthenticated, or(groupAdmin, membershipUser)),
}

export const MemberSubscriptionMutationPermissions = {
  payMemberSubscription: and(isAuthenticated, membershipUser),
  switchSubscriptionOption: and(isAuthenticated, membershipUser),
  cancelMemberSubscription: and(isAuthenticated, membershipUser),
  activateMemberSubscription: and(isAuthenticated, membershipUser),
}
