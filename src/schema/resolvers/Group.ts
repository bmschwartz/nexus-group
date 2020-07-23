import { Context } from "../../context";

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
    const { input: { name, ownerId } } = args

    const group = await ctx.prisma.group.findOne({ where: { name } })

    if (group) {
      throw new Error("A group by that name already exists")
    }

    return ctx.prisma.group.create({
      data: {
        name,
        active: true,
        members: {
          create: {
            active: true,
            memberId: Number(ownerId),
            status: "APPROVED",
            role: "ADMIN"
          }
        }
      }
    })
  },

  async updateGroup(parent: any, args: any, ctx: Context) {
    const { input: { groupId: id, name } } = args
    return ctx.prisma.group.update({
      where: { id },
      data: { name }
    })
  },

  async disableGroup(parent: any, args: any, ctx: Context) {
    const { groupId } = args
    return ctx.prisma.group.update({
      where: { id: groupId },
      data: { active: false },
    })
  },
}

export const GroupResolvers = {
  async __resolveReference(group: any, args: any, ctx: Context) {
    console.log(`group id: ${group.id}`)
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