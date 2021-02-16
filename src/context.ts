import { PrismaClient } from "@prisma/client"
import {MessageClient} from "./services/messenger";
import {PaymentClient} from "./services/payment";
import { initSettings} from "./settings";

initSettings()

export const prisma = new PrismaClient()
export const messenger = new MessageClient(prisma)
export const payment = new PaymentClient({ prisma, messenger })

export interface Context {
  userId?: string
  permissions: string[]
  prisma: PrismaClient
  messenger: MessageClient
  payment: PaymentClient
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
    payment,
  }
}
