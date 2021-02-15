import { GroupResolvers } from "./Group"
import { GroupMembershipResolvers } from "./GroupMembership"
import { UserResolvers } from "./User"
import { Query } from "./Query"
import { Mutation } from "./Mutation"
import { ExchangeAccountResolvers } from "./ExchangeAccountResolvers"
import {MemberSubscriptionResolvers} from "./MemberSubscription";

export const resolvers: any = {
  Query,
  Mutation,
  Group: GroupResolvers,
  GroupMembership: GroupMembershipResolvers,
  ExchangeAccount: ExchangeAccountResolvers,
  User: UserResolvers,
  MemberSubscription: MemberSubscriptionResolvers,
}
