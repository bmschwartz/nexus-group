import { Context } from "../../context";
import { Group, GroupMembership } from "@prisma/client";

export const resolvers: any = {
  Query: {
    async groups(parent: any, args: any, ctx: Context) {
      return await ctx.prisma.group.findMany()
    },
    async groupMemberships(parent: any, args: any, ctx: Context) {
      return await ctx.prisma.groupMembership.findMany()
    }
  },
  Group: {
    async __resolveReference(group: Pick<Group, "id">, ctx: Context) {
      console.log(`group id: ${group.id}`)
      return await ctx.prisma.group.findOne({ where: { id: group.id } })
    },
    async memberships(group: Group, args: any, ctx: Context) {
      return await ctx.prisma.groupMembership.findMany({
        where: {
          groupId: group.id
        }
      })
    }
  },
  GroupMembership: {
    async __resolveReference(groupMembership: Pick<GroupMembership, "id">, ctx: Context) {
      console.log(`group membership id: ${groupMembership.id}`)
      return await ctx.prisma.groupMembership.findOne({ where: { id: groupMembership.id } })
    },
    async group(membership: GroupMembership, args: any, ctx: Context) {
      return await ctx.prisma.group.findOne({ where: { id: membership.groupId } })
    },
    async member(membership: GroupMembership, args: any, ctx: Context) {
      return {
        id: membership.memberId
      }
    }
  },
  User: {
    async memberships(user: any, args: any, ctx: Context) {
      console.log(user)
      return await ctx.prisma.groupMembership.findMany({ where: { memberId: user.id } })
    }
  }
}