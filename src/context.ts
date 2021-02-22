import { PrismaClient } from "@prisma/client"
import {MessageClient} from "./services/messenger";
import {BillingClient} from "./services/billing";
import {initSettings} from "./settings";

initSettings()

export const prisma = new PrismaClient()
export const messenger = new MessageClient(prisma)
export const billing = new BillingClient({ prisma, messenger })

export interface Context {
  userId?: string
  permissions: string[]
  prisma: PrismaClient
  messenger: MessageClient
  billing: BillingClient
}

export function createContext({ req }: any): Context {
  let { userid: userId, permissions } = req.headers

  userId = (userId !== "undefined" && userId !== undefined) ? userId : undefined
  permissions = (permissions !== "undefined" && permissions !== undefined) ? JSON.parse(permissions) : []

  return {
    prisma,
    userId,
    permissions,
    messenger,
    billing,
  }
}
