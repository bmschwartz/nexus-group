import { Group, GroupMembership, MembershipRole, Prisma, MembershipStatus } from "@prisma/client";
import { Context } from "../context";
import { logger } from "../logger";

export interface GroupMembersInput {
  groupId: string
  limit?: number
  offset?: number
  roles?: MembershipRole[]
  statuses?: MembershipStatus[]
}

export interface GroupMembersResult {
  totalCount: number
  members: GroupMembership[]
}

export const getGroupMembers = async (
  ctx: Context,
  { groupId, limit, offset, roles, statuses }: GroupMembersInput,
): Promise<GroupMembersResult | Error> => {
  const whereClause: Prisma.GroupMembershipWhereInput = { groupId }

  if (roles) {
    whereClause.role = { in: roles }
  }

  if (statuses) {
    whereClause.status = { in: statuses }
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

export const getMyGroup = async (ctx: Context): Promise<Group> => {
  try {
    const membership = await ctx.prisma.groupMembership.findFirst({
      where: {
        memberId: ctx.userId,
        status: MembershipStatus.APPROVED,
        role: MembershipRole.ADMIN,
      },
      include: { group: true },
    })
    return membership?.group
  } catch (e) {
    logger.error({ message: "[getMyGroup] Error", userId: ctx.userId, e })
  }
}
