import { Context } from "../../context";
import { GroupMembership } from "@prisma/client";

export const GroupMembershipQuery = {

  async myGroupMemberships(parent: any, args: any, ctx: Context) {
    const memberId = 1 // todo: change this to "my id"
    return await ctx.prisma.groupMembership.findMany({
      where: { memberId }
    })
  },

  async groupMembers(parent: any, args: any, ctx: Context) {
    const { groupId } = args
    return await ctx.prisma.groupMembership.findMany({
      where: { groupId }
    })
  },
}

export const GroupMembershipMutations = {

  async createMembership(parent: any, args: any, ctx: Context) {
    const { input: { groupId, memberId, role, status } } = args

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
    const { input: { membershipId: id, role } } = args
    return ctx.prisma.groupMembership.update({
      where: { id },
      data: { role }
    })
  },

  async updateMembershipStatus(parent: any, args: any, ctx: Context) {
    const { input: { membershipId: id, status } } = args
    return ctx.prisma.groupMembership.update({
      where: { id },
      data: { status }
    })
  },

  async updateMembershipActive(parent: any, args: any, ctx: Context) {
    const { input: { membershipId: id, active } } = args
    return ctx.prisma.groupMembership.update({
      where: { id },
      data: { active }
    })
  },

  async deleteMembership(parent: any, args: any, ctx: Context) {
    const { membershipId } = args
    return ctx.prisma.groupMembership.delete({ where: { id: membershipId } })
  },
}

export const GroupMembershipResolvers = {
  async __resolveReference(groupMembership: any, ctx: Context) {
    return await ctx.prisma.groupMembership.findOne({ where: { id: Number(groupMembership.id) } })
  },
  async group(membership: any, args: any, ctx: Context) {
    return await ctx.prisma.group.findOne({ where: { id: membership.groupId } })
  },
  async member(membership: any, args: any, ctx: Context) {
    return {
      id: membership.memberId
    }
  }
}