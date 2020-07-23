import { GroupMutations } from "./Group";
import { GroupMembershipMutations } from "./GroupMembership";

export const Mutation = {
  ...GroupMutations,
  ...GroupMembershipMutations,
}