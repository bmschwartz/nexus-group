import axios from "axios"
import crypto from "crypto"
import { InvoiceStatus } from "@prisma/client"

export async function asyncForEach(array: any[], callback: CallableFunction) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export function getAllSettledResults(results: PromiseSettledResult<any>[]) {
  return results.map((result: PromiseSettledResult<any>) => result.status === "fulfilled" ? result.value : null).filter(Boolean)
}

export function convertToLocalInvoiceStatus(status: string): InvoiceStatus | null {
  switch (status.toLowerCase()) {
    case "new":
      return InvoiceStatus.NEW
    case "paid":
      return InvoiceStatus.PAID
    case "confirmed":
      return InvoiceStatus.CONFIRMED
    case "complete":
      return InvoiceStatus.COMPLETE
    case "invalid":
      return InvoiceStatus.INVALID
    case "expired":
      return InvoiceStatus.EXPIRED
  }

  return null
}

export async function getUserEmailById(userId: string): Promise<string> {
  const sig = crypto.createHmac("sha256", process.env.APP_SECRET)
    .update(userId)
    .digest("hex");

  const userEndpoint = `${process.env.NEXUS_USER_URL}/user`
  const response = await axios.get(userEndpoint, {
    params: { userId },
    headers: { sig },
  })

  return response.data.email
}
