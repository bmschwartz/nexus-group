import { GroupResolvers } from "./Group"
import { GroupMembershipResolvers } from "./GroupMembership"
import { UserResolvers } from "./User"
import { Query } from "./Query"
import { Mutation } from "./Mutation"

export const resolvers: any = {
  Query,
  Mutation,
  Group: GroupResolvers,
  GroupMembership: GroupMembershipResolvers,
  User: UserResolvers,
}
