import test from 'node:test'
import assert from 'node:assert'
import { readFile } from 'fs/promises'

import make_schema from '@hydre/make_schema'

import graphql_http from '../src/lambda.js'

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

const handler = graphql_http(options)

function create_lambda_event({ query, variables = {}, operation_name = null }) {
  return {
    body: JSON.stringify({ query, variables, operation_name }),
  }
}

function invoke_lambda(event) {
  return new Promise((resolve, reject) => {
    handler(event, {}, (error, result) => {
      if (error) reject(error)
      else resolve(result)
    })
  })
}

test('lambda adapter', async t => {
  await t.test('should return valid response', async () => {
    const event = create_lambda_event({
      query: '{ me { name, sayHello(to: "John") } }',
    })
    const result = await invoke_lambda(event)

    assert.strictEqual(result.statusCode, 200)
    const body = JSON.parse(result.body)
    assert.deepStrictEqual(body.data.me, {
      name: 'Alice',
      sayHello: "Hello John, I'm Bob's friend",
    })
  })

  await t.test('should handle interface types', async () => {
    const event = create_lambda_event({
      query: '{ animal { speak } }',
    })
    const result = await invoke_lambda(event)

    assert.strictEqual(result.statusCode, 200)
    const body = JSON.parse(result.body)
    assert.deepStrictEqual(body.data.animal, {
      speak: 'miaou',
    })
  })

  await t.test('should handle query with variables', async () => {
    const event = create_lambda_event({
      query: 'query GetHello($name: String!) { hello(name: $name) }',
      variables: { name: 'World' },
    })
    const result = await invoke_lambda(event)

    assert.strictEqual(result.statusCode, 200)
    const body = JSON.parse(result.body)
    assert.strictEqual(body.data.hello, 'Hello World !')
  })

  await t.test('should return error for missing query', async () => {
    const event = create_lambda_event({})
    const result = await invoke_lambda(event)

    assert.strictEqual(result.statusCode, 200)
    const body = JSON.parse(result.body)
    assert.ok(body.errors)
    assert.strictEqual(body.errors.length, 1)
    assert.ok(body.errors[0].message.includes('query'))
  })

  await t.test('should return error for invalid GraphQL syntax', async () => {
    const event = create_lambda_event({
      query: '{ invalid syntax {',
    })
    const result = await invoke_lambda(event)

    assert.strictEqual(result.statusCode, 200)
    const body = JSON.parse(result.body)
    assert.ok(body.errors)
    assert.strictEqual(body.errors.length, 1)
    assert.ok(body.errors[0].message.includes('Invalid operation'))
  })

  await t.test('should handle named operations', async () => {
    const event = create_lambda_event({
      query: `
        query GetMe { me { name } }
        query GetAnimal { animal { speak } }
      `,
      operation_name: 'GetMe',
    })
    const result = await invoke_lambda(event)

    assert.strictEqual(result.statusCode, 200)
    const body = JSON.parse(result.body)
    assert.deepStrictEqual(body.data.me, { name: 'Alice' })
  })
})
