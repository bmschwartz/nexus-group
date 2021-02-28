import express, {Request, Response} from "express"
import { ApolloServer } from "apollo-server-express"
import { buildFederatedSchema } from "@apollo/federation"
import { applyMiddleware } from "graphql-middleware"

import { typeDefs } from "./schema/types"
import { resolvers } from "./schema/resolvers"
import { createContext } from "./context"
import { permissions } from "./permissions"
import bodyParser from "body-parser";

const app = express()
app.use(bodyParser.json())

const server = new ApolloServer({
  schema: applyMiddleware(
    buildFederatedSchema([{ typeDefs, resolvers }]),
    permissions,
  ),
  engine: {
    graphVariant: "current",
  },
  context: createContext,
  introspection: true,
})

server.applyMiddleware({ app })

app.get("/payments", async (req: Request, res: Response) => {
  const ctx = createContext({ req })
  try {
    const invoice = await ctx.billing.createInvoice(5)

    return res.redirect(invoice.url)
  } catch (e) {
    return res.status(400)
  }
})

app.post("/payments", (req: Request, res: Response) => {
  console.log(req.body)
  return res.sendStatus(200)
})

app.listen({ port: 4002 }, () => {
  console.log(`🚀 Server ready!`)
})
