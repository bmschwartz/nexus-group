import { Context } from "../../context";

export const Query = {
  async allGroups(parent: any, args: any, ctx: Context) {
    return await ctx.prisma.group.findMany()
  },
  async ownedGroups(parent: any, args: any, ctx: Context) {
    return await ctx.prisma.group.findMany({
      where: {
        memberships: {

        }
      }
    })
  },
  async group(parent: any, args: any, ctx: Context) {
    return await ctx.prisma.group.findOne({ where: { id: args.groupId } })
  },
  async groupMemberships(parent: any, args: any, ctx: Context) {
    return await ctx.prisma.groupMembership.findMany()
  },
}