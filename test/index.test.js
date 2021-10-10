import { readFileSync } from 'fs'
import { pipeline, PassThrough } from 'stream'

import { buildSchema } from 'graphql/index.mjs'
import GR from 'graphql-request'
import Doubt from '@hydre/doubt'
import reporter from 'tap-spec-emoji'

import koa from './koa.js'
import fastify from './fastify.js'

const through = new PassThrough()
const IMPL_AMOUNT = 2

pipeline(through, reporter(), process.stdout, () => {})

const doubt = Doubt({
  stdout: through,
  title: 'GraphQL Http',
  calls: 5 * IMPL_AMOUNT,
})
const options = {
  schema: buildSchema(readFileSync('./test/schema.gql', 'utf-8')),
  rootValue: {
    hello({ name }) {
      return `Hello ${name} !`
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
  },
}
const host = 'http://localhost:3000'
const query = /* GraphQL */ `
  query ($name: String!) {
    hello(name: $name)
  }
`
const test_implementation = async ({ name, http_server, graphqlHTTP }) => {
  try {
    graphqlHTTP()
  } catch (error) {
    doubt[`(${name}) a middleware should be created with a schema`]({
      because: error.message,
      is: "Option 'schema' is required",
    })
  }

  const { hello } = await GR.request(host, query, { name: 'Pepeg' })

  doubt[`(${name}) a graphql request just works`]({
    because: hello,
    is: 'Hello Pepeg !',
  })

  try {
    await GR.request(host, '{ hello(name: w@w") }')
  } catch (error) {
    doubt[`(${name}) an invalid operation should give an error 400`]({
      because: error.message.slice(0, 25),
      is: 'GraphQL Error (Code: 400)',
    })
  }

  try {
    await GR.request(host, '{ me { sayHello(to: "pepeg") } }')
  } catch (error) {
    doubt[`(${name}) error should be formatted`]({
      because: error.message.slice(0, 8),
      is: '[hidden]',
    })
  }

  try {
    await GR.request(host, '{ invalid }')
  } catch (error) {
    doubt[`(${name}) an invalid query should give an error 400`]({
      because: error.message.slice(0, 45),
      is: 'Cannot query field "invalid" on type "Query".',
    })
  }

  await new Promise(resolve => {
    http_server.close(resolve)
  })
}

test_implementation(await koa(options))
test_implementation(await fastify(options))
