import * as dotenv from "dotenv"
// import * as schedule from "node-schedule";
import schedule from "node-schedule"
import {Client as BitpayClient, Models} from "bitpay-sdk"
import {PrismaClient} from "@prisma/client";
import {MessageClient} from "../messenger";

dotenv.config()

interface SubscriptionClientProps {
  prisma: PrismaClient
  messenger: MessageClient
}

const configFilePath = process.env.BITPAY_CONFIG_FILE

if (!configFilePath) {
  console.error("Unable to load BitPay config file")
  process.exit(1)
}

export class SubscriptionClient {
  _db: PrismaClient
  _messenger: MessageClient
  _bitpayClient: BitpayClient
  _determineInvoicesJob: schedule.Job

  constructor({ prisma, messenger }: SubscriptionClientProps) {
    this._db = prisma
    this._messenger = messenger
    this._bitpayClient = new BitpayClient(configFilePath);

    this._determineInvoicesJob = schedule.scheduleJob(
      "determineInvoicesToSend",
      "*/5 * * * * *",
      this.determineInvoicesToSend,
    )
  }

  async sendSubscriptionInvoice(subscriptionId: string) {
    console.log("Sending subscription invoice to ", subscriptionId)
  }

  async determineInvoicesToSend() {
    
  }
}
