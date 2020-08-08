import { rule, shield, and, or } from "graphql-shield"
import { Context } from "../context"
import { validateActiveUserHasRoleAndStatus } from "../schema/resolvers/GroupMembership"

const isAuthenticated = rule()((parent, args, { userId }) => {
  return !!userId
})

const isGroupAdmin = rule({ cache: "strict" })(
  async (parent, args, ctx: Context, info) => {
    const {
      input: { groupId },
    } = args
    const error = await validateActiveUserHasRoleAndStatus(
      ctx.prisma,
      ctx.userId,
      Number(groupId),
      "ADMIN",
      "APPROVED",
    )

    return error || true
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
      Number(groupId),
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
      Number(groupId),
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
    group: and(isAuthenticated, or(isGroupAdmin, isGroupTrader)),
    groupExists: isAuthenticated,
    membershipRequests: and(isAuthenticated, isGroupAdmin),

    // GroupMembership Queries
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
