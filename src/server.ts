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
  engine: {
    graphVariant: "current"
  },
  context: createContext
});

server.listen({ port: 4002 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})

/**
apollo service:push \
--localSchemaFile=./src/schema/types/schema.graphql \
--key=service:monest:2HOiPg_5jSKO7BMhNsLksA \
--graph=monest \
--serviceName=groups
--serviceURL=http://localhost:4002/

*/