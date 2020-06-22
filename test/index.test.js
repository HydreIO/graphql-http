import Koa from 'koa'
import { readFileSync } from 'fs'
import bodyParser from 'koa-bodyparser'
import { buildSchema, GraphQLError } from 'graphql/index.mjs'
import graphqlHTTP from '../src/koa.js'
import GR from 'graphql-request'
import fetch from 'node-fetch'
import Doubt from '@hydre/doubt'
import reporter from 'tap-spec-emoji'
import { pipeline, PassThrough } from 'stream'

globalThis.fetch = fetch

const through = new PassThrough()

pipeline(through, reporter(), process.stdout, () => {})

const doubt = Doubt({
  stdout: through,
  title : 'GraphQL Http',
  calls : 5,
})
const schema = buildSchema(readFileSync('./test/schema.gql', 'utf-8'))
const rootValue = {
  hello({ name }) {
    return `Hello ${ name } !`
  },
  me() {
    throw new Error('N word')
  },
  async *onMessage() {
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      yield 'Hello'
    }
  },
}
const host = 'http://localhost:3000'
const query = /* GraphQL */ `
  query($name: String!) {
    hello(name: $name)
  }
`
const http_server = await new Promise(resolve => {
  const app = new Koa()
      .use(bodyParser())
      .use(graphqlHTTP({
        schema,
        rootValue,
        formatError: () => new GraphQLError('[hidden]'),
      }))
      .listen(3000, () => {
        resolve(app)
      })
})

try {
  graphqlHTTP()
} catch (error) {
  doubt['a middleware should be created with a schema']({
    because: error.message,
    is     : 'Option \'schema\' is required',
  })
}

const response = await GR.request(host, query, { name: 'Pepeg' })

doubt['a graphql request just works']({
  because: response.hello,
  is     : 'Hello Pepeg !',
})

try {
  await GR.request(host, '{ hello(name: w@w") }')
} catch (error) {
  doubt['an invalid operation should give an error 400']({
    because: error.message.slice(0, 25),
    is     : 'GraphQL Error (Code: 400)',
  })
}

try {
  await GR.request(host, '{ me { sayHello(to: "pepeg") } }')
} catch (error) {
  doubt['error should be formatted']({
    because: error.message.slice(0, 8),
    is     : '[hidden]',
  })
}

try {
  await GR.request(host, '{ invalid }')
} catch (error) {
  doubt['an invalid query should give an error 400']({
    because: error.message.slice(0, 45),
    is     : 'Cannot query field "invalid" on type "Query".',
  })
}

await new Promise(resolve => {
  http_server.close(resolve)
})
