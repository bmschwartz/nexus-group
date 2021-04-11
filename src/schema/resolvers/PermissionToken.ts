import * as jwt from "jsonwebtoken"

import { Context } from "../../context";
import { getMembership } from "../../repository/GroupMembershipRepository";

export const PermissionTokenMutations = {
  async createPermissionToken(
    _: any,
    args: any,
    ctx: Context,
  ) {
    const { input: { membershipId } } = args
    if (!membershipId) {
      return null
    }

    const groupMembership = await getMembership(ctx.prisma, membershipId)
    if (!groupMembership || groupMembership.memberId !== ctx.userId) {
      return null
    }

    const { groupId, active, role, status } = groupMembership

    const token = jwt.sign(
      { groupId, active, role, status, membershipId },
      String(process.env.APP_SECRET),
      { expiresIn: "1m" },
    )

    if (!token) {
      return null
    }

    return { token }
  },
}
