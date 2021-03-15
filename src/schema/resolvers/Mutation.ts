import { GroupMutations } from "./Group"
import { GroupMembershipMutations } from "./GroupMembership"
import { MemberSubscriptionMutations } from "./MemberSubscription";
import {GroupSubscriptionMutations} from "./GroupSubscription";

export const Mutation = {
  ...GroupMutations,
  ...GroupMembershipMutations,
  ...GroupSubscriptionMutations,
  ...MemberSubscriptionMutations,
}
