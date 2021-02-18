import {BillStatus} from "@prisma/client"

export async function asyncForEach(array: any[], callback: CallableFunction) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export function getAllSettledResults(results: PromiseSettledResult<any>[]) {
  return results.map((result: PromiseSettledResult<any>) => result.status === "fulfilled" ? result.value : null).filter(Boolean)
}

export function convertToLocalBillStatus(billStatus: string): BillStatus | null {
  switch (billStatus) {
    case "draft":
      return BillStatus.DRAFT
    case "new":
      return BillStatus.NEW
    case "sent":
      return BillStatus.SENT
    case "paid":
      return BillStatus.PAID
    case "complete":
      return BillStatus.COMPLETE
  }

  return null
}
