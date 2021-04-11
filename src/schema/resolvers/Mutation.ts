import { GroupMutations } from "./Group"
import { GroupMembershipMutations } from "./GroupMembership"
import { MemberSubscriptionMutations } from "./MemberSubscription";
import {GroupSubscriptionMutations} from "./GroupSubscription";
import { PermissionTokenMutations } from "./PermissionToken";

export const Mutation = {
  ...GroupMutations,
  ...GroupMembershipMutations,
  ...PermissionTokenMutations,
  ...GroupSubscriptionMutations,
  ...MemberSubscriptionMutations,
}
