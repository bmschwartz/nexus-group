import { exit } from "process"
import * as dotenv from "dotenv"

dotenv.config()

export const SETTINGS = {}

export function initSettings() {
  // RabbitMQ - Group
  assignEnvVar("GROUP_EXCHANGE", process.env.GROUP_EXCHANGE)

  assignEnvVar("GROUP_EVENT_MEMBERSHIP_DELETED_KEY", process.env.GROUP_EVENT_MEMBERSHIP_DELETED_KEY)
}

function assignEnvVar(name: string, envKey?: any) {
  const value: string | undefined = envKey
  if (!value) {
    console.error(`Missing ${name}!`)
    exit(1)
  } else {
    SETTINGS[name] = value
  }
}
