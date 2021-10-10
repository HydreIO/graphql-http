import Fastify from 'fastify'
import { GraphQLError } from 'graphql/index.mjs'

import graphqlHTTP from '../src/fastify.js'

export default async ({ schema, rootValue }) => ({
  http_server: await new Promise(resolve => {
    const app = Fastify()
    app
      .post(
        '/',
        graphqlHTTP({
          schema,
          rootValue,
          formatError: () => new GraphQLError('[hidden]'),
        })
      )
      .listen(3000, () => {
        resolve(app.server)
      })
  }),
  graphqlHTTP,
  name: 'fastify',
})
