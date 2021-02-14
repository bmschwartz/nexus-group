import { Context } from "../context";

export async function getGroupSubscription(ctx: Context, groupSubscriptionId: string) {
  return await ctx.prisma.groupSubscription.findUnique({
    where: {id: groupSubscriptionId},
  })
}
