import test from 'node:test'
import assert from 'node:assert'
import { readFile } from 'fs/promises'

import { App } from '@tinyhttp/app'
import make_schema from '@hydre/make_schema'

import graphql_http from '../src/tinyhttp.js'

async function create_server(options) {
  const app = new App()

  // Simple JSON body parser middleware
  app.use(async (req, res, next) => {
    if (req.method === 'POST') {
      let body = ''
      for await (const chunk of req) {
        body += chunk
      }
      try {
        req.body = JSON.parse(body)
      } catch {
        req.body = {}
      }
    }
    next()
  })

  app.post('/', graphql_http(options))

  const server = app.listen(3002)
  return server
}

async function request({ query, variables = {}, operation_name = null } = {}) {
  const response = await fetch('http://localhost:3002', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ variables, query, operation_name }),
  })
  return response.json()
}

const options = {
  schema: make_schema({
    document: await readFile('test/schema.gql', 'utf8'),
    resolvers: {
      Query: {
        hello(root, { name }) {
          return `Hello ${name} !`
        },
        me() {
          return { friend: 'Bob', name: 'Alice' }
        },
        animal() {
          return { __typename: 'Cat', speak: () => 'jajaja' }
        },
      },
      User: {
        sayHello({ friend }, { to }) {
          return `Hello ${to}, I'm ${friend}'s friend`
        },
      },
      Cat: {
        speak() {
          return 'miaou'
        },
      },
    },
  }),
  root_value: {},
  build_context: async () => ({}),
  format_error: error => error,
}

test('tinyhttp adapter', async t => {
  const server = await create_server(options)

  await t.test('should return valid response', async () => {
    const { data } = await request({
      query: '{ me { name, sayHello(to: "John") } }',
    })
    assert.deepStrictEqual(data.me, {
      name: 'Alice',
      sayHello: "Hello John, I'm Bob's friend",
    })
  })

  await t.test('should handle interface types', async () => {
    const { data } = await request({
      query: '{ animal { speak } }',
    })
    assert.deepStrictEqual(data.animal, {
      speak: 'miaou',
    })
  })

  await t.test('should handle query with variables', async () => {
    const { data } = await request({
      query: 'query GetHello($name: String!) { hello(name: $name) }',
      variables: { name: 'World' },
    })
    assert.strictEqual(data.hello, 'Hello World !')
  })

  await t.test('should return error for missing query', async () => {
    const { errors } = await request({})
    assert.ok(errors)
    assert.strictEqual(errors.length, 1)
    assert.ok(errors[0].message.includes('query'))
  })

  await t.test('should return error for invalid GraphQL syntax', async () => {
    const { errors } = await request({
      query: '{ invalid syntax {',
    })
    assert.ok(errors)
    assert.strictEqual(errors.length, 1)
    assert.ok(errors[0].message.includes('Invalid operation'))
  })

  return new Promise(resolve => server.close(resolve))
})
