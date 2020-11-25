import { Context } from "../../context"
import { PrismaClient, MembershipStatus, MembershipRole } from "@prisma/client"

const GROUP_NAME_VALIDATION = {
  minLength: 1,
  maxLength: 30,
}

const GROUP_DESCRIPTION_VALIDATION = {
  minLength: 0,
  maxLength: 5000,
}

export const GroupQuery = {
  async allGroups(parent: any, args: any, ctx: Context) {
    return ctx.prisma.group.findMany()
  },

  async group(parent: any, args: any, ctx: Context) {
    const {
      input: { groupId },
    } = args
    return ctx.prisma.group.findUnique({ where: { id: Number(groupId) } })
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
        membershipLength,
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
        membershipOptions: {
          create: {
            membershipFee,
            membershipLength,
          },
        },
      },
    })
  },

  async renameGroup(parent: any, args: any, ctx: Context) {
    let {
      input: { groupId },
    } = args
    const {
      input: { name: newName },
    } = args
    groupId = Number(groupId)

    validateGroupName(newName)

    return ctx.prisma.group.update({
      where: { id: groupId },
      data: { name: newName },
    })
  },

  async updateGroupDescription(parent: any, args: any, ctx: Context) {
    let {
      input: { groupId },
    } = args
    const {
      input: { description },
    } = args
    groupId = Number(groupId)

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
      where: { id: Number(groupId) },
      data: { active: false },
    })
  },
}

export const GroupResolvers = {
  async __resolveReference(group: any, args: any, ctx: Context) {
    return ctx.prisma.group.findUnique({ where: { id: Number(group.id) } })
  },

  async memberships(group: any, args: any, ctx: Context) {
    return ctx.prisma.groupMembership.findMany({
      where: {
        groupId: Number(group.id),
      },
    })
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
