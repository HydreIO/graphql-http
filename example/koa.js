import Koa from 'koa'
import { readFileSync } from 'fs'
import bodyParser from 'koa-bodyparser'
import { buildSchema } from 'graphql/index.mjs'
import graphqlHTTP from '../src/koa.js'

const schema = buildSchema(readFileSync('./test/schema.gql', 'utf-8'))
const app = new Koa().use(bodyParser())
    .use(graphqlHTTP({
      schema,
      rootValue: {
        hello({ name }) {
          return `Hello ${ name } !`
        },
        async *onMessage() {
          while (true) {
            console.log('lol')
            await new Promise(resolve => setTimeout(resolve, 1000))
            yield 'Hello'
          }
        },
      },
    }))
const server = app.listen(3000, () =>
  console.log('Listening on', server.address()))
