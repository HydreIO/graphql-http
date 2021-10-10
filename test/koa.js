import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import { GraphQLError } from 'graphql/index.mjs'

import graphqlHTTP from '../src/koa.js'

export default async ({ schema, rootValue }) => ({
  http_server: await new Promise(resolve => {
    const app = new Koa()
      .use(bodyParser())
      .use(
        graphqlHTTP({
          schema,
          rootValue,
          formatError: () => new GraphQLError('[hidden]'),
        })
      )
      .listen(3000, () => {
        resolve(app)
      })
  }),
  graphqlHTTP,
  name: 'koa',
})
