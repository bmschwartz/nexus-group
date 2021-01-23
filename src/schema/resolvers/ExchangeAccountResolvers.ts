import { Context } from "../../context"

export const ExchangeAccountResolvers = {
  async membership(exchangeAccount: any, args: any, ctx: Context) {
    return ctx.prisma.groupMembership.findUnique({
      where: { id: exchangeAccount.membershipId }
    })
  },
}
