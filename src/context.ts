import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export interface Context {
  userId?: string
  permissions: string[]
  prisma: PrismaClient
}

export function createContext({ req }: any): Context {
  let { userid: userId, permissions } = req.headers

  userId = userId !== "undefined" ? userId : undefined
  permissions = permissions !== "undefined" ? JSON.parse(permissions) : []

  return {
    prisma,
    userId,
    permissions,
  }
}
