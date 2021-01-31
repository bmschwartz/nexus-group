import { Prisma, PrismaClient } from "@prisma/client"
import { Context } from "../../context"

export const GroupMembershipQuery = {
  async membership(_: any, args: any, ctx: Context) {
    const {
      input: { membershipId },
    } = args

    return ctx.prisma.groupMembership.findUnique({
      where: { id: membershipId }
    })
  },

  async myMembership(_: any, args: any, ctx: Context) {
    const {
      input: { groupId },
    } = args

    return ctx.prisma.groupMembership.findUnique({
      where: {
        GroupMembership_memberId_groupId_key: {
          memberId: ctx.userId!,
          groupId: groupId,
        },
      },
    })
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

    return ctx.prisma.groupMembership.findMany({ where })
  },

  async groupMembers(_: any, args: any, ctx: Context) {
    const {
      input: { groupId },
    } = args
    return ctx.prisma.groupMembership.findMany({
      where: {
        groupId: groupId
      },
    })
  },

  async membershipRequests(_: any, args: any, ctx: Context) {
    let {
      input: { groupId },
    } = args

    return ctx.prisma.groupMembership.findMany({
      where: { active: false, status: "PENDING", groupId },
    })
  },
}

export const GroupMembershipMutations = {
  async createMembership(_: any, args: any, ctx: Context) {
    let {
      input: { groupId, memberId },
    } = args
    const {
      input: { role, status },
    } = args

    const membership = await ctx.prisma.groupMembership.findUnique({
      where: { GroupMembership_memberId_groupId_key: { memberId, groupId } },
    })

    if (membership) {
      return new Error("This user already belongs to the group")
    }

    return ctx.prisma.groupMembership.create({
      data: {
        group: { connect: { id: groupId } },
        memberId,
        active: true,
        role,
        status,
      },
    })
  },

  async updateMembershipRole(_: any, args: any, ctx: Context) {
    const {
      input: { membershipId, role },
    } = args

    const membership = await validateMembershipExists(ctx.prisma, membershipId)
    if (membership instanceof Error) {
      return membership
    }

    return ctx.prisma.groupMembership.update({
      where: {
        id: membershipId
      },
      data: { role },
    })
  },

  async updateMembershipStatus(_: any, args: any, ctx: Context) {
    const {
      input: { membershipId, status },
    } = args

    const membership = await validateMembershipExists(ctx.prisma, membershipId)
    if (membership instanceof Error) {
      return membership
    }

    return ctx.prisma.groupMembership.update({
      where: {
        id: membershipId
      },
      data: { status },
    })
  },

  async updateMembershipActive(_: any, args: any, ctx: Context) {
    const {
      input: { membershipId, active },
    } = args

    const membership = await validateMembershipExists(ctx.prisma, membershipId)
    if (membership instanceof Error) {
      return membership
    }

    return ctx.prisma.groupMembership.update({
      where: {
        id: membershipId
      },
      data: { active },
    })
  },

  async deleteMembership(_: any, args: any, ctx: Context) {
    const {
      input: { membershipId },
    } = args

    const membership = await validateMembershipExists(ctx.prisma, membershipId)
    if (membership instanceof Error) {
      return { success: false, error: "Membership does not exist" }
    }

    const deletedMembership = await ctx.prisma.groupMembership.delete({
      where: {
        id: membershipId
      },
    })

    if (!deletedMembership) {
      return { success: false, error: "Could not delete membership" }
    }

    return { success: true }
  },

  async requestGroupAccess(_: any, args: any, ctx: Context) {
    let {
      input: { groupId },
    } = args

    const userId = ctx.userId!

    const membership = await ctx.prisma.groupMembership.findUnique({
      where: {
        GroupMembership_memberId_groupId_key: { memberId: userId, groupId },
      },
    })

    if (membership) {
      return new Error("User already has a membership with this group")
    }

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
  },
}

export const GroupMembershipResolvers = {
  async __resolveReference(groupMembership: any, ctx: Context) {
    return ctx.prisma.groupMembership.findUnique({
      where: {
        id: groupMembership.id
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
}

export const validateMembershipExists = async (
  prisma: PrismaClient,
  membershipId: string | undefined,
) => {
  const membership = await prisma.groupMembership.findUnique({
    where: {
      id: membershipId
    },
  })
  if (!membership) {
    return new Error("Membership does not exist")
  }
  return membership
}

export const validateActiveUserHasRoleAndStatus = async (
  prisma: PrismaClient,
  memberId: any,
  groupId: any,
  roles: string[] | string | undefined,
  statuses: string[] | string | undefined,
) => {
  const groupMembership = await prisma.groupMembership.findUnique({
    where: { GroupMembership_memberId_groupId_key: { memberId, groupId } },
  })

  if (!groupMembership) {
    return new Error("User is not a member of that group")
  }

  if (typeof roles === "string") {
    roles = [roles]
  }
  if (typeof statuses === "string") {
    statuses = [statuses]
  }

  let authorized = groupMembership.active
  if (authorized && roles) {
    authorized = authorized && roles.includes(groupMembership.role)
  }
  if (authorized && statuses) {
    authorized = authorized && statuses.includes(groupMembership.status)
  }

  if (!authorized) {
    return new Error("Not Authorized")
  }
  return null
}
