import {GroupMembership, MembershipRole, MembershipStatus, PrismaClient} from "@prisma/client";
import { Context } from "../context";
import {createMemberSubscription} from "./MemberSubscriptionRepository";

export interface CreateGroupMembershipInput {
  groupId: string
  memberId: string
  role: MembershipRole
  status: MembershipStatus
}

export interface CreateGroupMembershipResult {
  success: boolean
  error?: string
}

export const myMembership = async (ctx: Context, memberId: string, groupId: string): Promise<GroupMembership | null> => {
  return ctx.prisma.groupMembership.findUnique({
    where: {
      GroupMembership_memberId_groupId_key: {
        memberId,
        groupId,
      },
    },
  })
}

export const createMembership = async (
  ctx: Context,
  { groupId, memberId, role, status }: CreateGroupMembershipInput,
): Promise<CreateGroupMembershipResult | Error> => {
  const existingMembership = await ctx.prisma.groupMembership.findUnique({
    where: { GroupMembership_memberId_groupId_key: { memberId, groupId } },
  })

  if (existingMembership) {
    return { success: false, error: "This user already belongs to the group" }
  }

  let membership: GroupMembership
  try {
    membership = await ctx.prisma.groupMembership.create({
      data: {
        group: { connect: { id: groupId } },
        memberId,
        active: true,
        role,
        status,
      },
    })

    if (!membership) {
      return { success: false, error: "Error creating the membership" }
    }
  } catch (e) {
    return { success: false, error: "Error creating the membership" }
  }

  const createSubscriptionResult = await createMemberSubscription(ctx, {groupId, membershipId: membership.id})
  if (!createSubscriptionResult.success) {
    return createSubscriptionResult
  }

  return { success: true }
}

export const validateMembershipExists = async (
  prisma: PrismaClient,
  membershipId: string | undefined,
) => {
  const membership = await prisma.groupMembership.findUnique({
    where: {
      id: membershipId,
    },
  })
  if (!membership) {
    return new Error("Membership does not exist")
  }
  return membership
}

export const validateActiveUserHasRoleAndStatus = async (
  prisma: PrismaClient,
  memberId: any,
  groupId: any,
  roles: string[] | string | undefined,
  statuses: string[] | string | undefined,
) => {
  const groupMembership = await prisma.groupMembership.findUnique({
    where: { GroupMembership_memberId_groupId_key: { memberId, groupId } },
  })

  if (!groupMembership) {
    return new Error("User is not a member of that group")
  }

  if (typeof roles === "string") {
    roles = [roles]
  }
  if (typeof statuses === "string") {
    statuses = [statuses]
  }

  let authorized = groupMembership.active
  if (authorized && roles) {
    authorized = authorized && roles.includes(groupMembership.role)
  }
  if (authorized && statuses) {
    authorized = authorized && statuses.includes(groupMembership.status)
  }

  if (!authorized) {
    return new Error("Not Authorized")
  }
  return null
}
