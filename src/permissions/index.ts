import { rule, shield, and, or } from "graphql-shield"
import { Context } from "../context"
import {validateActiveUserHasRoleAndStatus} from "../repository/GroupMembershipRepository";
import {logger} from "../logger";

const isAuthenticated = rule()((parent, args, { userId }) => {
  return !!userId
})

const isGroupAdmin = rule({ cache: "strict" })(
  async (parent, args, ctx: Context, info) => {
    const {
      input: { groupId },
    } = args

    try {
      return await validateActiveUserHasRoleAndStatus(
        ctx.prisma,
        ctx.userId,
        groupId,
        "ADMIN",
        "APPROVED",
      )
    } catch (e) {
      logger.error({ message: "[isGroupAdmin] Error", userId: ctx.userId, groupId })
    }

    return false
  },
)

const isGroupTrader = rule({ cache: "strict" })(
  async (parent, args, ctx: Context, info) => {
    const {
      input: { groupId },
    } = args
    const error = await validateActiveUserHasRoleAndStatus(
      ctx.prisma,
      ctx.userId,
      groupId,
      "TRADER",
      "APPROVED",
    )

    return error || true
  },
)

const isGroupMember = rule({ cache: "strict" })(
  async (parent, args, ctx: Context, info) => {
    const {
      input: { groupId },
    } = args
    const error = await validateActiveUserHasRoleAndStatus(
      ctx.prisma,
      ctx.userId,
      groupId,
      "MEMBER",
      "APPROVED",
    )

    return error || true
  },
)

export const permissions = shield({
  Query: {
    // Group Queries
    allGroups: isAuthenticated,
    group: isAuthenticated,
    groupExists: isAuthenticated,
    membershipRequests: and(isAuthenticated, isGroupAdmin),

    // GroupMembership Queries
    membership: isAuthenticated,
    myMemberships: isAuthenticated,
    groupMembers: and(isAuthenticated, or(isGroupAdmin, isGroupTrader)),
  },
  Mutation: {
    // Group Mutations
    createGroup: isAuthenticated,
    renameGroup: and(isAuthenticated, isGroupAdmin),
    disableGroup: and(isAuthenticated, isGroupAdmin),
    requestGroupAccess: isAuthenticated,
    updateGroupDescription: and(isAuthenticated, isGroupAdmin),

    // GroupMembership Mutations
    createMembership: and(isAuthenticated, isGroupAdmin),
    updateMembershipRole: and(isAuthenticated, isGroupAdmin),
    updateMembershipStatus: and(isAuthenticated, isGroupAdmin),
    updateMembershipActive: and(isAuthenticated, isGroupAdmin),
    deleteMembership: and(isAuthenticated, isGroupAdmin),
  },
})
