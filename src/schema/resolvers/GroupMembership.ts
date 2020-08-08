import { Context } from "../../context"
import { GroupMembershipWhereInput, PrismaClient } from "@prisma/client"
import { validateGroupExists } from "./Group"

export const GroupMembershipQuery = {
  async myMemberships(parent: any, args: any, ctx: Context) {
    const {
      input: { roles, statuses },
    } = args

    const where: GroupMembershipWhereInput = { memberId: ctx.userId }

    if (roles) {
      where.role = { in: roles }
    }

    if (statuses) {
      where.status = { in: statuses }
    }

    return ctx.prisma.groupMembership.findMany({ where })
  },

  async groupMembers(parent: any, args: any, ctx: Context) {
    const {
      input: { groupId },
    } = args
    return ctx.prisma.groupMembership.findMany({
      where: { groupId: Number(groupId) },
    })
  },

  async membershipRequests(parent: any, args: any, ctx: Context) {
    let {
      input: { groupId },
    } = args
    groupId = Number(groupId)

    return ctx.prisma.groupMembership.findMany({
      where: { active: false, status: "PENDING" },
    })
  },
}

export const GroupMembershipMutations = {
  async createMembership(parent: any, args: any, ctx: Context) {
    let {
      input: { groupId, memberId, role, status },
    } = args
    groupId = Number(groupId)
    memberId = Number(memberId)

    const membership = await ctx.prisma.groupMembership.findOne({
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

  async updateMembershipRole(parent: any, args: any, ctx: Context) {
    const {
      input: { membershipId, role },
    } = args

    const membership = await validateMembershipExists(ctx.prisma, membershipId)
    if (membership instanceof Error) {
      return membership
    }

    return ctx.prisma.groupMembership.update({
      where: { id: Number(membershipId) },
      data: { role },
    })
  },

  async updateMembershipStatus(parent: any, args: any, ctx: Context) {
    const {
      input: { membershipId, status },
    } = args

    const membership = await validateMembershipExists(ctx.prisma, membershipId)
    if (membership instanceof Error) {
      return membership
    }

    return ctx.prisma.groupMembership.update({
      where: { id: Number(membershipId) },
      data: { status },
    })
  },

  async updateMembershipActive(parent: any, args: any, ctx: Context) {
    const {
      input: { membershipId, active },
    } = args

    const membership = await validateMembershipExists(ctx.prisma, membershipId)
    if (membership instanceof Error) {
      return membership
    }

    return ctx.prisma.groupMembership.update({
      where: { id: Number(membershipId) },
      data: { active },
    })
  },

  async deleteMembership(parent: any, args: any, ctx: Context) {
    const {
      input: { membershipId },
    } = args

    const membership = await validateMembershipExists(ctx.prisma, membershipId)
    if (membership instanceof Error) {
      return membership
    }

    return ctx.prisma.groupMembership.delete({
      where: { id: Number(membershipId) },
    })
  },

  async requestGroupAccess(parent: any, args: any, ctx: Context) {
    let {
      input: { groupId },
    } = args
    groupId = Number(groupId)

    const userId = Number(ctx.userId)

    let membership = await ctx.prisma.groupMembership.findOne({
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
    return ctx.prisma.groupMembership.findOne({
      where: { id: Number(groupMembership.id) },
    })
  },

  async group(membership: any, args: any, ctx: Context) {
    return ctx.prisma.group.findOne({ where: { id: membership.groupId } })
  },

  async member(membership: any, args: any, ctx: Context) {
    return {
      id: membership.memberId,
    }
  },
}

export const validateMembershipExists = async (
  prisma: PrismaClient,
  membershipId: string | number,
) => {
  const membership = await prisma.groupMembership.findOne({
    where: { id: Number(membershipId) },
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
  const userMembership = await prisma.groupMembership.findOne({
    where: { GroupMembership_memberId_groupId_key: { memberId, groupId } },
  })

  if (!userMembership) {
    return new Error("User is not a member of that group")
  }

  if (typeof roles === "string") {
    roles = [roles]
  }
  if (typeof statuses === "string") {
    statuses = [statuses]
  }

  let authorized = userMembership.active
  if (authorized && roles) {
    authorized = authorized && roles.includes(userMembership.role)
  }
  if (authorized && statuses) {
    authorized = authorized && statuses.includes(userMembership.status)
  }

  if (!authorized) {
    return new Error("Not Authorized")
  }
}
