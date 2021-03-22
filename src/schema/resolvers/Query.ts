import { GroupQuery } from "./Group"
import { GroupMembershipQuery } from "./GroupMembership"
import {PlatformFeeQuery} from "./PlatformFee";

export const Query = {
  ...GroupQuery,
  ...PlatformFeeQuery,
  ...GroupMembershipQuery,
}
