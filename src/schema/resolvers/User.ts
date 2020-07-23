import { Context } from "../../context";

export const UserResolvers = {
  async memberships(user: any, args: any, ctx: Context) {
    console.log(user)
    return await ctx.prisma.groupMembership.findMany({ where: { memberId: user.id } })
  }
}