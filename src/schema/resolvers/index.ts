import { Context } from "../../context";
import { Group, GroupMembership } from "@prisma/client";

interface PageInfo {
  first: number
  after: number
}

export const resolvers: any = {
  Query: {
    async groups(parent: any, args: PageInfo, ctx: Context) {
      return await ctx.prisma.group.findMany({ skip: args.first })
    },
    async groupMemberships(parent: any, args: PageInfo, ctx: Context) {
      return await ctx.prisma.groupMembership.findMany({ skip: args.first })
    }
  },
  Group: {
    async __resolveReference(group: Pick<Group, "id">, ctx: Context) {
      console.log(`group id: ${group.id}`)
      return await ctx.prisma.group.findOne({ where: { id: group.id } })
    }
  },
  GroupMembership: {
    async __resolveReference(groupMembership: Pick<GroupMembership, "id">, ctx: Context) {
      console.log(`group membership id: ${groupMembership.id}`)
      return await ctx.prisma.groupMembership.findOne({ where: { id: groupMembership.id } })
    }
  },
  User: {
    async __resolveReference(user: any, ctx: Context) {
      // console.log(`user id: ${user.id}`)
      // return await ctx.prisma.groupMembership.findOne({ where: { id: groupMembership.id } })
      console.log(`user: ${user}`)
    },
    async memberships(user: any, ctx: Context) {
      console.log(`memberships: ${user}`)
    }
  }
}