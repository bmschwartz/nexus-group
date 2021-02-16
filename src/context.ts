import { PrismaClient } from "@prisma/client"
import {MessageClient} from "./services/messenger";
import {SubscriptionClient} from "./services/subscription";
import { initSettings} from "./settings";

initSettings()

export const prisma = new PrismaClient()
export const messenger = new MessageClient(prisma)
export const subscription = new SubscriptionClient({ prisma, messenger })

export interface Context {
  userId?: string
  permissions: string[]
  prisma: PrismaClient
  messenger: MessageClient
  subscription: SubscriptionClient
}

export function createContext({ req }: any): Context {
  let { userid: userId, permissions } = req.headers

  userId = userId !== "undefined" ? userId : undefined
  permissions = permissions !== "undefined" ? JSON.parse(permissions) : []

  return {
    prisma,
    userId,
    permissions,
    messenger,
    subscription,
  }
}
