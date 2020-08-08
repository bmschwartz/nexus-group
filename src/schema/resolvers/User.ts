import { Context } from "../../context"

export const UserResolvers = {
  async memberships(user: any, args: any, ctx: Context) {
    return ctx.prisma.groupMembership.findMany({
      where: { memberId: ctx.userId },
    })
  },
}
