import { rule, shield } from "graphql-shield"

const isAuthenticated = rule()((parent, args, { userId }) => {
  return !!userId
})

export const permissions = shield({
  Query: {
    // Group Queries
    allGroups: isAuthenticated,
    groupExists: isAuthenticated,

    // GroupMembership Queries
    myMemberships: isAuthenticated,
    groupMembers: isAuthenticated,
  },
  Mutation: {
    // Group Mutations
    createGroup: isAuthenticated,
    renameGroup: isAuthenticated,
    updateGroupDescription: isAuthenticated,
    disableGroup: isAuthenticated,

    // GroupMembership Mutations
    createMembership: isAuthenticated,
    updateMembershipRole: isAuthenticated,
    updateMembershipStatus: isAuthenticated,
    updateMembershipActive: isAuthenticated,
    deleteMembership: isAuthenticated
  }
})