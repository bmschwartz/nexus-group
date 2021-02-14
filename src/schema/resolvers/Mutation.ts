import { GroupMutations } from "./Group"
import { GroupMembershipMutations } from "./GroupMembership"
import { MemberSubscriptionMutations } from "./MemberSubscription";

export const Mutation = {
  ...GroupMutations,
  ...GroupMembershipMutations,
  ...MemberSubscriptionMutations,
}
