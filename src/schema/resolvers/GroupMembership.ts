import { Context } from "../../context";
import { GroupMembershipWhereInput } from "@prisma/client";

export const GroupMembershipQuery = {

  async myMemberships(parent: any, args: any, ctx: Context) {
    const memberId = 1 // todo: change this to "my id"
    const { input: { role, status } } = args

    const where: GroupMembershipWhereInput = { memberId }

    if (role) {
      where.role = role
    }
    if (status) {
      where.status = status
    }

    return ctx.prisma.groupMembership.findMany({ where })
  },

  async groupMembers(parent: any, args: any, ctx: Context) {
    const { input: { groupId } } = args
    return ctx.prisma.groupMembership.findMany({
      where: { groupId: Number(groupId) }
    })
  },
}

export const GroupMembershipMutations = {

  async createMembership(parent: any, args: any, ctx: Context) {
    let { input: { groupId, memberId, role, status } } = args
    groupId = Number(groupId)
    memberId = Number(memberId)

    const group = await ctx.prisma.group.findOne({ where: { id: groupId } })
    if (!group) {
      throw new Error("That group does not exist!")
    }

    const membership = await ctx.prisma.groupMembership.findOne({
      where: { GroupMembership_memberId_groupId_key: { memberId, groupId } }
    })

    if (membership) {
      throw new Error("This user already belongs to the group")
    }

    return ctx.prisma.groupMembership.create({
      data: {
        group: { connect: { id: groupId } },
        memberId,
        active: true,
        role,
        status
      }
    })
  },

  async updateMembershipRole(parent: any, args: any, ctx: Context) {
    const { input: { membershipId, role } } = args
    return ctx.prisma.groupMembership.update({
      where: { id: Number(membershipId) },
      data: { role }
    })
  },

  async updateMembershipStatus(parent: any, args: any, ctx: Context) {
    const { input: { membershipId, status } } = args
    return ctx.prisma.groupMembership.update({
      where: { id: Number(membershipId) },
      data: { status }
    })
  },

  async updateMembershipActive(parent: any, args: any, ctx: Context) {
    const { input: { membershipId, active } } = args
    return ctx.prisma.groupMembership.update({
      where: { id: Number(membershipId) },
      data: { active }
    })
  },

  async deleteMembership(parent: any, args: any, ctx: Context) {
    const { input: { membershipId } } = args
    return ctx.prisma.groupMembership.delete({ where: { id: Number(membershipId) } })
  },
}

export const GroupMembershipResolvers = {
  async __resolveReference(groupMembership: any, ctx: Context) {
    return ctx.prisma.groupMembership.findOne({ where: { id: Number(groupMembership.id) } })
  },

  async group(membership: any, args: any, ctx: Context) {
    return ctx.prisma.group.findOne({ where: { id: membership.groupId } })
  },

  async member(membership: any, args: any, ctx: Context) {
    return {
      id: membership.memberId
    }
  },

}