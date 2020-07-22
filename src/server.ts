import { ApolloServer, gql } from "apollo-server"
import { buildFederatedSchema } from "@apollo/federation"

import { typeDefs } from './schema/types'
import { resolvers } from "./schema/resolvers";
import { createContext } from "./context";

const server = new ApolloServer({
  schema: buildFederatedSchema([
    {
      typeDefs,
      resolvers
    }
  ]),
  context: createContext
});

server.listen({ port: 4001 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})