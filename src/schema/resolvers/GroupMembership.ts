import { Context } from "../../context";
import { GroupMembership } from "@prisma/client";

export const GroupMembershipResolvers = {
  async __resolveReference(groupMembership: Pick<GroupMembership, "id">, ctx: Context) {
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
}