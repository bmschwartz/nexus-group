import * as Amqp from "amqp-ts"
import {SETTINGS} from "../../settings";
import {PrismaClient} from "@prisma/client";
import {logger} from "../../logger";

export class MessageClient {
  _db: PrismaClient
  _sendConn: Amqp.Connection

  _sendGroupExchange?: Amqp.Exchange

  constructor(prisma: PrismaClient) {
    this._db = prisma
    this._sendConn = new Amqp.Connection(SETTINGS["AMQP_URL"])

    this._connectGroupMessaging()
  }

  async _connectGroupMessaging() {
    /* Exchanges */
    this._sendGroupExchange = this._sendConn.declareExchange(SETTINGS["GROUP_EXCHANGE"], "topic", { durable: true })
  }

  async sendGroupMembershipDeleted(membershipId: string): Promise<any> {
    const payload = {membershipId}

    logger.info({ message: "[sendGroupMembershipDeleted] Sending message", membershipId })

    const message = new Amqp.Message(payload, {persistent: true})
    this._sendGroupExchange?.send(message, SETTINGS["GROUP_EVENT_MEMBERSHIP_DELETED_KEY"])
  }
}
