import { shield, and, or } from "graphql-shield"
import {
  isAuthenticated,
  isGroupAdmin,
  isGroupTrader,
  isMembershipUser,
  isGroupMember,
  isMembershipGroupOwner,
} from "./utils";

export const permissions = shield({
  Query: {
    // Group Queries
    myGroup: isAuthenticated,
    allGroups: isAuthenticated,
    group: isAuthenticated,
    groupExists: isAuthenticated,

    // Platform fee
    activePlatformFee: isAuthenticated,

    // GroupMembership Queries
    myMemberships: isAuthenticated,
    myMembership: and(isAuthenticated, isGroupMember),
    membershipRequests: and(isAuthenticated, isGroupAdmin),
    groupMembers: and(isAuthenticated, or(isGroupAdmin, isGroupTrader)),
    membership: and(isAuthenticated, or(isMembershipGroupOwner, isMembershipUser)),
  },
  Mutation: {
    // Group Mutations
    createGroup: isAuthenticated,
    requestGroupAccess: isAuthenticated,
    renameGroup: and(isAuthenticated, isGroupAdmin),
    disableGroup: and(isAuthenticated, isGroupAdmin),
    updateGroupDescription: and(isAuthenticated, or(isGroupAdmin, isGroupTrader)),

    // GroupMembership Mutations
    joinGroup: isAuthenticated,
    createMembership: and(isAuthenticated, isGroupAdmin),
    updateMembershipRole: and(isAuthenticated, isGroupAdmin),
    updateMembershipStatus: and(isAuthenticated, isGroupAdmin),
    updateMembershipActive: and(isAuthenticated, isGroupAdmin),
    deleteMembership: and(isAuthenticated, isGroupAdmin),

    // Group Subscription
    createGroupSubscription: and(isAuthenticated, isGroupAdmin),
    updateGroupSubscription: and(isAuthenticated, isGroupAdmin),
    deleteGroupSubscription: and(isAuthenticated, isGroupAdmin),
    toggleSubscriptionActive: and(isAuthenticated, isGroupAdmin),

    // Member Subscription
    payMemberSubscription: and(isAuthenticated, isMembershipUser),
    switchSubscriptionOption: and(isAuthenticated, isMembershipUser),
    cancelMemberSubscription: and(isAuthenticated, isMembershipUser),
    activateMemberSubscription: and(isAuthenticated, isMembershipUser),
  },
})
