import { rule, shield } from "graphql-shield"

const isAuthenticated = rule()((parent, args, { userId }) => {
  return !!userId
})

export const permissions = shield({
  Query: {
    // Group Queries
    allGroups: isAuthenticated,
    group: isAuthenticated,
    groupExists: isAuthenticated,

    // GroupMembership Queries
    myMemberships: isAuthenticated,
    groupMembers: isAuthenticated,
  },
  Mutation: {
    // Group Mutations
    createGroup: isAuthenticated,
    renameGroup: isAuthenticated,
    disableGroup: isAuthenticated,
    requestGroupAccess: isAuthenticated,
    updateGroupDescription: isAuthenticated,

    // GroupMembership Mutations
    createMembership: isAuthenticated,
    updateMembershipRole: isAuthenticated,
    updateMembershipStatus: isAuthenticated,
    updateMembershipActive: isAuthenticated,
    deleteMembership: isAuthenticated
  }
})