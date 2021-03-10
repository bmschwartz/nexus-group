import { Context } from "../../context"
import { PrismaClient, MembershipStatus, MembershipRole } from "@prisma/client"
import { getGroupMembers } from "../../repository/GroupRepository"

const GROUP_NAME_VALIDATION = {
  minLength: 1,
  maxLength: 30,
}

const GROUP_DESCRIPTION_VALIDATION = {
  minLength: 0,
  maxLength: 5000,
}

export const GroupQuery = {
  async myGroup(parent: any, args: any, ctx: Context) {
    const membership = await ctx.prisma.groupMembership.findFirst({
      where: { memberId: ctx.userId, role: { in: [MembershipRole.ADMIN, MembershipRole.TRADER] } },
      include: { group: true },
    })

    return membership ? membership["group"] : null
  },

  async allGroups(parent: any, args: any, ctx: Context) {
    return ctx.prisma.group.findMany()
  },

  async group(parent: any, args: any, ctx: Context) {
    const {
      input: { groupId },
    } = args
    return ctx.prisma.group.findUnique({ where: { id: groupId } })
  },
  async groupExists(parent: any, args: any, ctx: Context) {
    const {
      input: { name },
    } = args
    const groupCount = await ctx.prisma.group.count({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
      },
    })
    return groupCount > 0
  },
}

export const GroupMutations = {
  async createGroup(parent: any, args: any, ctx: Context) {
    const {
      input: {
        name,
        description,
        telegram,
        discord,
        email,
        membershipFee,
        payInPlatform,
        payoutCurrency,
        payoutAddress,
      },
    } = args

    if (!ctx.userId) {
      return new Error("Unknown userId")
    }

    validateGroupName(name)
    validateGroupDescription(description)

    if (email) {
      validateEmail(email)
    }

    const group = await ctx.prisma.group.findUnique({ where: { name } })

    if (group) {
      return new Error("A group by that name already exists")
    }

    return ctx.prisma.group.create({
      data: {
        name,
        description,
        email,
        telegram,
        discord,
        payInPlatform,
        payoutAddress,
        payoutCurrency,
        active: true,
        members: {
          create: {
            active: true,
            memberId: ctx.userId,
            status: MembershipStatus.APPROVED,
            role: MembershipRole.ADMIN,
          },
        },
        groupSubscription: {
          create: {
            active: true,
            price: membershipFee || 0,
          },
        },
      },
    })
  },

  async renameGroup(parent: any, args: any, ctx: Context) {
    const {
      input: { groupId },
    } = args
    const {
      input: { name: newName },
    } = args

    validateGroupName(newName)

    return ctx.prisma.group.update({
      where: { id: groupId },
      data: { name: newName },
    })
  },

  async updateGroupDescription(parent: any, args: any, ctx: Context) {
    const {
      input: { groupId },
    } = args
    const {
      input: { description },
    } = args

    validateGroupDescription(description)

    return ctx.prisma.group.update({
      where: { id: groupId },
      data: { description },
    })
  },

  async disableGroup(parent: any, args: any, ctx: Context) {
    const {
      input: { groupId },
    } = args

    return ctx.prisma.group.update({
      where: { id: groupId },
      data: { active: false },
    })
  },
}

export const GroupResolvers = {
  async __resolveReference(group: any, args: any, ctx: Context) {
    return ctx.prisma.group.findUnique({ where: { id: group.id } })
  },

  async members(group: any, args: any, ctx: Context) {
    const { id: groupId } = group
    const { input } = args

    const limit = input?.limit
    const offset = input?.offset
    const roles = input?.roles
    const statuses = input?.statuses

    return getGroupMembers(ctx, { groupId, limit, offset, roles, statuses })
  },
}

export const validateGroupExists = async (
  prisma: PrismaClient,
  groupId: any,
) => {
  const group = await prisma.group.findUnique({ where: { id: groupId } })
  if (!group) {
    return new Error("That group does not exist")
  }
  return group
}

const validateGroupDescription = (description: string) => {
  if (
    description.length < GROUP_NAME_VALIDATION.minLength ||
    description.length > GROUP_NAME_VALIDATION.maxLength
  ) {
    return new Error(
      `Description can be at most ${GROUP_NAME_VALIDATION.maxLength} characters long`,
    )
  }
  return null
}
const validateGroupName = (name: string) => {
  if (
    name.length < GROUP_NAME_VALIDATION.minLength ||
    name.length > GROUP_NAME_VALIDATION.maxLength
  ) {
    return new Error(
      `Name must be between ${GROUP_NAME_VALIDATION.minLength} and ${GROUP_NAME_VALIDATION.maxLength} characters long`,
    )
  }
  return null
}

const validateEmail = (email: string) => {
  const regexp = new RegExp(
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  )
  if (!regexp.test(email)) {
    return new Error("Invalid email")
  }
  return null
}
