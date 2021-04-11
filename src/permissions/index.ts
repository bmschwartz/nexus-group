import { shield } from "graphql-shield"
import { GroupMutationPermissions, GroupPermissions, GroupQueryPermissions } from "./group"
import { GroupSubscriptionPermissions, GroupSubscriptionMutationPermissions } from "./groupSubscription"
import { MemberSubscriptionPermissions, MemberSubscriptionMutationPermissions } from "./memberSubscription"
import { GroupMembershipQueryPermissions, GroupMembershipPermissions, GroupMembershipMutationPermissions } from "./groupMembership"
import { SubscriptionInvoiceMutationPermissions, SubscriptionInvoicePermissions } from "./subscriptionInvoice";
import { PermissionTokenMutationPermissions } from "./permissionToken";

export const permissions = shield({
  Query: {
    ...GroupQueryPermissions,
    ...GroupMembershipQueryPermissions,
  },
  Mutation: {
    ...GroupMutationPermissions,
    ...GroupMembershipMutationPermissions,
    ...PermissionTokenMutationPermissions,
    ...GroupSubscriptionMutationPermissions,
    ...MemberSubscriptionMutationPermissions,
    ...SubscriptionInvoiceMutationPermissions,
  },
  Group: GroupPermissions,
  GroupMembership: GroupMembershipPermissions,
  GroupSubscription: GroupSubscriptionPermissions,
  MemberSubscription: MemberSubscriptionPermissions,
  SubscriptionInvoice: SubscriptionInvoicePermissions,
})
