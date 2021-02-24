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
  prisma: PrismaClient
  messenger: MessageClient
  billing: BillingClient
}

export function createContext({ req }: any): Context {
  let { userid: userId } = req.headers

  userId = (userId !== "undefined" && userId !== undefined) ? userId : undefined

  return {
    prisma,
    userId,
    messenger,
    billing,
  }
}
