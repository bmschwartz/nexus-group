import { Prisma } from "@prisma/client"
import { Context } from "../../context"
import {createMembership, myMembership, validateMembershipExists} from "../../repository/GroupMembershipRepository";
import {logger} from "../../logger";

export const GroupMembershipQuery = {
  async membership(_: any, args: any, ctx: Context) {
    const {
      input: { membershipId },
    } = args

    return ctx.prisma.groupMembership.findUnique({
      where: { id: membershipId },
    })
  },

  async myMembership(_: any, args: any, ctx: Context) {
    const {
      input: { groupId },
    } = args

    if (!ctx.userId) {
      return null
    }

    return myMembership(ctx, ctx.userId, groupId)
  },

  async myMemberships(_: any, args: any, ctx: Context) {
    const roles = args.input ? args.input.roles : null
    const statuses = args.input ? args.input.status : null

    const where: Prisma.GroupMembershipWhereInput = { memberId: ctx.userId }

    if (roles) {
      where.role = { in: roles }
    }

    if (statuses) {
      where.status = { in: statuses }
    }

    try {
      return ctx.prisma.groupMembership.findMany({ where })
    } catch (e) {
      logger.info({ message: "[myMemberships] Unable to get GroupMemberships", where })
    }
  },

  async groupMembers(_: any, args: any, ctx: Context) {
    const {
      input: { groupId },
    } = args
    return ctx.prisma.groupMembership.findMany({
      where: {
        groupId,
      },
    })
  },

  async membershipRequests(_: any, args: any, ctx: Context) {
    const {
      input: { groupId },
    } = args

    return ctx.prisma.groupMembership.findMany({
      where: { active: false, status: "PENDING", groupId },
    })
  },
}

export const GroupMembershipMutations = {
  async joinGroup(_: any, args: any, ctx: Context) {
    const {
      input: { groupId, subscriptionOptionId },
    } = args

    return createMembership(
      ctx, { groupId, memberId: ctx.userId, role: "MEMBER", status: "APPROVED", subscriptionOptionId },
    )
  },

  async createMembership(_: any, args: any, ctx: Context) {
    const {
      input: {groupId, memberId, role, status},
    } = args

    return createMembership(ctx, {groupId, memberId, role, status})
  },

  async updateMembershipRole(_: any, args: any, ctx: Context) {
    const {
      input: {membershipId, role},
    } = args

    const membership = await validateMembershipExists(ctx.prisma, membershipId)
    if (membership instanceof Error) {
      return membership
    }

    return ctx.prisma.groupMembership.update({
      where: {
        id: membershipId,
      },
      data: {role},
    })
  },

  async updateMembershipStatus(_: any, args: any, ctx: Context) {
    const {
      input: {membershipId, status},
    } = args

    const membership = await validateMembershipExists(ctx.prisma, membershipId)
    if (membership instanceof Error) {
      return membership
    }

    return ctx.prisma.groupMembership.update({
      where: {
        id: membershipId,
      },
      data: {status},
    })
  },

  async updateMembershipActive(_: any, args: any, ctx: Context) {
    const {
      input: {membershipId, active},
    } = args

    const membership = await validateMembershipExists(ctx.prisma, membershipId)
    if (membership instanceof Error) {
      return membership
    }

    return ctx.prisma.groupMembership.update({
      where: {
        id: membershipId,
      },
      data: {active},
    })
  },

  async deleteMembership(_: any, args: any, ctx: Context) {
    const {
      input: {membershipId},
    } = args

    const membership = await validateMembershipExists(ctx.prisma, membershipId)
    if (membership instanceof Error) {
      return {success: false, error: "Membership does not exist"}
    }

    const deletedMembership = await ctx.prisma.groupMembership.delete({
      where: {
        id: membershipId,
      },
    })

    if (!deletedMembership) {
      return {success: false, error: "Could not delete membership"}
    }

    await ctx.messenger.sendGroupMembershipDeleted(membershipId)

    return {success: true}
  },

  async requestGroupAccess(_: any, args: any, ctx: Context) {
    const {
      input: {groupId},
    } = args

    const userId = ctx.userId

    if (!userId) {
      return new Error("User not found!")
    }

    const membership = await ctx.prisma.groupMembership.findUnique({
      where: {
        GroupMembership_memberId_groupId_key: {memberId: userId, groupId},
      },
    })

    if (membership) {
      return new Error("User already has a membership with this group")
    }

    try {
      return ctx.prisma.groupMembership.create({
        data: {
          memberId: userId,
          active: false,
          role: "MEMBER",
          status: "PENDING",
          group: {
            connect: {
              id: groupId,
            },
          },
        },
      })
    } catch (e) {
      return null
    }
  },
}

export const GroupMembershipResolvers = {
  async __resolveReference(groupMembership: any, ctx: Context) {
    return ctx.prisma.groupMembership.findUnique({
      where: {
        id: groupMembership.id,
      },
    })
  },

  async group(membership: any, args: any, ctx: Context) {
    return ctx.prisma.group.findUnique({ where: { id: membership.groupId } })
  },

  async member(membership: any, args: any, ctx: Context) {
    return {
      id: membership.memberId,
    }
  },

  async subscription(membership: any, args: any, ctx: Context) {
    const { id: groupMembershipId } = membership

    return ctx.prisma.memberSubscription.findFirst({
      where: { groupMembershipId },
    })
  },
}
