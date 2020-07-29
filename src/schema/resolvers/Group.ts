import { Context } from "../../context";
import { PrismaClient } from "@prisma/client";
import { validateActiveUserHasRoleAndStatus } from "./GroupMembership";

const GROUP_NAME_VALIDATION = {
  minLength: 1,
  maxLength: 30,
}

const GROUP_DESCRIPTION_VALIDATION = {
  minLength: 0,
  maxLength: 5000
}

export const GroupQuery = {
  async allGroups(parent: any, args: any, ctx: Context) {
    return ctx.prisma.group.findMany()
  },

  async group(parent: any, args: any, ctx: Context) {
    const { input: { groupId } } = args
    return ctx.prisma.group.findOne({ where: { id: Number(groupId) } })
  },
  async groupExists(parent: any, args: any, ctx: Context) {
    const { input: { name } } = args
    const groupCount = await ctx.prisma.group.count({ where: { name } })
    return groupCount > 0
  }
}

export const GroupMutations = {

  async createGroup(parent: any, args: any, ctx: Context) {
    const { input: { name, description } } = args

    if (name.length < GROUP_NAME_VALIDATION.minLength || name.length > GROUP_NAME_VALIDATION.maxLength) {
      throw new Error(`Name must be between ${GROUP_NAME_VALIDATION.minLength} and ${GROUP_NAME_VALIDATION.maxLength} characters long`)
    }

    if (description.length < GROUP_DESCRIPTION_VALIDATION.minLength || description.length > GROUP_DESCRIPTION_VALIDATION.maxLength) {
      throw new Error(`Description is at most ${GROUP_DESCRIPTION_VALIDATION.maxLength} characters long`)
    }

    const group = await ctx.prisma.group.findOne({ where: { name } })

    if (group) {
      throw new Error("A group by that name already exists")
    }

    return ctx.prisma.group.create({
      data: {
        name,
        description,
        active: true,
        members: {
          create: {
            active: true,
            memberId: ctx.userId!,
            status: "APPROVED",
            role: "ADMIN"
          }
        }
      }
    })
  },

  async renameGroup(parent: any, args: any, ctx: Context) {
    let { input: { groupId, name: newName } } = args
    groupId = Number(groupId)

    await validateActiveUserHasRoleAndStatus(ctx.prisma, ctx.userId, groupId, "ADMIN", "APPROVED")
    await validateGroupExists(ctx.prisma, groupId)

    validateName(newName)

    return ctx.prisma.group.update({
      where: { id: groupId },
      data: { name: newName }
    })
  },

  async updateGroupDescription(parent: any, args: any, ctx: Context) {
    let { input: { groupId, description } } = args
    groupId = Number(groupId)

    await validateActiveUserHasRoleAndStatus(ctx.prisma, ctx.userId, groupId, ["ADMIN", "TRADER"], "APPROVED")
    await validateGroupExists(ctx.prisma, groupId)

    validateGroupDescription(description)

    return ctx.prisma.group.update({
      where: { id: groupId },
      data: { description }
    })
  },

  async disableGroup(parent: any, args: any, ctx: Context) {
    const { input: { groupId } } = args

    await validateActiveUserHasRoleAndStatus(ctx.prisma, ctx.userId, groupId, "ADMIN", "APPROVED")
    await validateGroupExists(ctx.prisma, groupId)

    return ctx.prisma.group.update({
      where: { id: groupId },
      data: { active: false },
    })
  },
}

export const GroupResolvers = {
  async __resolveReference(group: any, args: any, ctx: Context) {
    return ctx.prisma.group.findOne({ where: { id: Number(group.id) } })
  },

  async memberships(group: any, args: any, ctx: Context) {
    return ctx.prisma.groupMembership.findMany({
      where: {
        groupId: Number(group.id)
      }
    })
  }
}

export const validateGroupExists = async (prisma: PrismaClient, groupId: any) => {
  const group = await prisma.group.findOne({ where: { id: groupId } })
  if (!group) {
    throw new Error("That group does not exist")
  }
  return group
}

const validateGroupDescription = (description: string) => {
  if (description.length < GROUP_NAME_VALIDATION.minLength || description.length > GROUP_NAME_VALIDATION.maxLength) {
    throw new Error(`Description can be at most ${GROUP_NAME_VALIDATION.maxLength} characters long`)
  }
}
const validateName = (name: string) => {
  if (name.length < GROUP_NAME_VALIDATION.minLength || name.length > GROUP_NAME_VALIDATION.maxLength) {
    throw new Error(`Name must be between ${GROUP_NAME_VALIDATION.minLength} and ${GROUP_NAME_VALIDATION.maxLength} characters long`)
  }
}