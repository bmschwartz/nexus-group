import {PlatformFee} from "@prisma/client"
import {Context} from "../context";

export const getActivePlatformFee = (ctx: Context): Promise<PlatformFee> => {
  return ctx.prisma.platformFee.findFirst({
    where: { active: true },
  })
}
