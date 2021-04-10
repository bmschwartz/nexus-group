import { rule } from "graphql-shield";
import { MembershipRole, MembershipStatus } from "@prisma/client"

import { logger } from "../logger";
import { Context } from "../context";
import {
  getMembership,
  validateActiveUserHasRoleAndStatus,
} from "../repository/GroupMembershipRepository";

export const isAuthenticated = rule()((parent, args, { userId }) => {
  return !!userId
})

export const isMembershipGroupOwner = rule({ cache: "strict" })(
  async (parent, args, ctx: Context, info) => {
    const {
      input: { membershipId },
    } = args
    let groupId: string
    try {
      const membership = await getMembership(ctx.prisma, membershipId)
      if (!membership) {
        return false
      }
      groupId = membership.groupId
    } catch (e) {
      logger.error({ message: "[isMembershipGroupOwner] Error", userId: ctx.userId, membershipId, e })
      return false
    }

    return await validateActiveUserHasRoleAndStatus(
      ctx.prisma,
      ctx.userId,
      groupId,
      MembershipRole.ADMIN,
      MembershipStatus.APPROVED,
    )
  },
)

export const isMembershipUser = rule({ cache: "strict" })(
  async (parent, args, ctx: Context, info) => {
    const {
      input: { membershipId },
    } = args

    let membership

    try {
      membership = await getMembership(ctx.prisma, membershipId)
    } catch (e) {
      logger.error({ message: "[isMembershipUser] Error", userId: ctx.userId, membershipId, e })
    }

    return membership && membership.memberId === ctx.userId
  },
)

export const isGroupAdmin = rule({ cache: "strict" })(
  async (parent, args, ctx: Context, info) => {
    const {
      input: { groupId },
    } = args

    try {
      return await validateActiveUserHasRoleAndStatus(
        ctx.prisma,
        ctx.userId,
        groupId,
        MembershipRole.ADMIN,
        MembershipStatus.APPROVED,
      )
    } catch (e) {
      logger.error({ message: "[isGroupAdmin] Error", userId: ctx.userId, groupId, e })
    }

    return false
  },
)

export const isGroupTrader = rule({ cache: "strict" })(
  async (parent, args, ctx: Context, info) => {
    const {
      input: { groupId },
    } = args
    const error = await validateActiveUserHasRoleAndStatus(
      ctx.prisma,
      ctx.userId,
      groupId,
      MembershipRole.TRADER,
      MembershipStatus.APPROVED,
    )

    return error || true
  },
)

export const isGroupMember = rule({ cache: "strict" })(
  async (parent, args, ctx: Context, info) => {
    const {
      input: { groupId },
    } = args
    const error = await validateActiveUserHasRoleAndStatus(
      ctx.prisma,
      ctx.userId,
      groupId,
      MembershipRole.MEMBER,
      MembershipStatus.APPROVED,
    )

    return error || true
  },
)
