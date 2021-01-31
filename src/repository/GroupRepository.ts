import { GroupMembership, MembershipRole, Prisma } from "@prisma/client";
import { Context } from "../context";


export interface GroupMembersInput {
  groupId: string
  limit?: number
  offset?: number
  roles?: MembershipRole[]
}

export interface GroupMembersResult {
  totalCount: number
  members: GroupMembership[]
}

export const getGroupMembers = async (ctx: Context, { groupId, limit, offset, roles }: GroupMembersInput): Promise<GroupMembersResult | Error> => {
  const whereClause: Prisma.GroupMembershipWhereInput = { groupId }

  if (roles) {
    whereClause.role = { in: roles }
  }

  const members: GroupMembership[] = await ctx.prisma.groupMembership.findMany({
    take: limit,
    skip: offset,
    where: whereClause,
    orderBy: { createdAt: "asc" },
  })

  const totalCount = await ctx.prisma.groupMembership.count({
    where: whereClause,
  })

  return {
    members,
    totalCount,
  }
}
