import Koa from 'koa'
import bodyParser from 'koa-bodyparser'

import graphql_http from '../src/koa.js'

export default options =>
  new Promise(resolve => {
    const app = new Koa()
      .use(bodyParser())
      .use(graphql_http(options))
      .listen(3000, () => {
        resolve(app)
      })
  })
