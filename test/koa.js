import Koa from 'koa'
import bodyParser from 'koa-bodyparser'

import graphqlHTTP from '../src/koa.js'

export default async options => ({
  http_server: await new Promise(resolve => {
    const app = new Koa()
      .use(bodyParser())
      .use(graphqlHTTP(options))
      .listen(3000, () => {
        resolve(app)
      })
  }),
  graphqlHTTP,
  name: 'koa',
})
