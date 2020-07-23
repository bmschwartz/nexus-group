import { Context } from "../../context";
import { Group } from "@prisma/client";

export const GroupResolvers = {
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
}