import { GroupQuery } from "./Group"
import { GroupMembershipQuery } from "./GroupMembership"

export const Query = {
  ...GroupQuery,
  ...GroupMembershipQuery,
}
