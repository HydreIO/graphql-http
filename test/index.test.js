import { readFileSync } from 'fs'
import { pipeline, PassThrough } from 'stream'
import { setTimeout } from 'timers/promises'

import fetch from 'node-fetch'
import { buildSchema, GraphQLError } from 'graphql/index.mjs'
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
  calls: 6 * IMPL_AMOUNT,
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
  formatError: error => {
    if (error.message === 'N word') return new GraphQLError('[hidden]')
    return error
  },
}
const host = 'http://localhost:3000'
const query = /* GraphQL */ `
  query ($name: String!) {
    hello(name: $name)
  }
`
const request = ({ query, variables = {} } = {}) =>
  fetch(host, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ variables, query }),
  }).then(response => response.json())
const test_implementation = async ({ name, http_server, graphqlHTTP }) => {
  try {
    graphqlHTTP()
  } catch ({ message }) {
    doubt[`(${name}) a middleware should be created with a schema`]({
      because: message,
      is: "Option 'schema' is required",
    })
  }

  const { errors } = await request()

  doubt[`(${name}) not providing the query field gives an error`]({
    because: errors[0]?.message,
    is: "'query' field not provided",
  })

  const {
    data: { hello },
  } = await request({ query, variables: { name: 'Pepeg' } })

  doubt[`(${name}) a graphql request just works`]({
    because: hello,
    is: 'Hello Pepeg !',
  })

  doubt[`(${name}) an invalid operation should give an error 400`]({
    because: await request({ query: '{ hello(name: w@w") }' }),
    is: {
      errors: [
        {
          message: 'Invalid operation: Syntax Error: Expected Name, found "@".',
        },
      ],
    },
  })

  doubt[`(${name}) error should be formatted`]({
    because: await request({ query: '{ me { sayHello(to: "pepeg") } }' }),
    is: { data: { me: null }, errors: [{ message: '[hidden]' }] },
  })

  doubt[`(${name}) an invalid query should give an error 400`]({
    because: await request({ query: '{ invalid }' }),
    is: {
      errors: [
        {
          message: 'Cannot query field "invalid" on type "Query".',
          locations: [{ line: 1, column: 3 }],
        },
      ],
    },
  })

  await new Promise(resolve => {
    http_server.close(resolve)
  })
}

test_implementation(await koa(options))
await setTimeout(2000)
test_implementation(await fastify(options))
