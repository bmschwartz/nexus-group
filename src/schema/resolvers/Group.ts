import { Context } from "../../context";

export const GroupQuery = {
  async allGroups(parent: any, args: any, ctx: Context) {
    return ctx.prisma.group.findMany()
  },
  async myAdminGroups(parent: any, args: any, ctx: Context) {
    const adminMemberships = await ctx.prisma.groupMembership.findMany({
      where: {
        memberId: 1, // todo: Change this to "my id"
        role: "ADMIN"
      }
    })
    return ctx.prisma.group.findMany({
      where: { id: { in: adminMemberships.map(m => m.groupId) } }
    })
  },
  async group(parent: any, args: any, ctx: Context) {
    return ctx.prisma.group.findOne({ where: { id: args.groupId } })
  },
  async groupExists(parent: any, args: any, ctx: Context) {
    const groupCount = await ctx.prisma.group.count({ where: { name: args.name } })
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
    return ctx.prisma.group.findOne({ where: { id: group.id } })
  },

  async members(group: any, args: any, ctx: Context) {
    return ctx.prisma.groupMembership.findMany({
      where: {
        groupId: group.id
      }
    })
  }
}