import { GroupResolvers } from "./Group"
import { GroupMembershipResolvers } from "./GroupMembership"
import { UserResolvers } from "./User"
import { Query } from "./Query"
import { Mutation } from "./Mutation"
import { ExchangeAccountResolvers } from "./ExchangeAccountResolvers"
import {MemberSubscriptionResolvers} from "./MemberSubscription";
import {GroupSubscriptionResolvers} from "./GroupSubscription";
import {SubscriptionInvoiceResolvers} from "./SubscriptionInvoice";

export const resolvers: any = {
  Query,
  Mutation,
  User: UserResolvers,
  Group: GroupResolvers,
  GroupMembership: GroupMembershipResolvers,
  ExchangeAccount: ExchangeAccountResolvers,
  GroupSubscription: GroupSubscriptionResolvers,
  MemberSubscription: MemberSubscriptionResolvers,
  SubscriptionInvoice: SubscriptionInvoiceResolvers,
}
