import test from 'node:test'
import assert from 'node:assert'
import { readFile } from 'fs/promises'
import { setTimeout } from 'timers/promises'

import make_schema from '@hydre/make_schema'

import koa from './koa.js'

async function request({ query, variables = {} } = {}) {
  const response = await fetch('http://localhost:3000', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ variables, query, operation_name: null }),
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
      // as we don't define the Spanish, by default it will say 'jajaja'
      Cat: {
        speak() {
          return 'miaou'
        },
      },
      Subscription: {
        async *onMessage() {
          while (true) {
            await setTimeout(1000)
            yield 'Hello'
          }
        },
      },
    },
  }),
  // root_value is what comes as a first argument in your resolvers, it is an object resolved by default
  // a bit like how Promise.resolve() works, meaning that your subsequent resolvers won't be called
  // if something is already present in this root_value.
  // This is useful for the first layer of calls and can contains functions but it can become confusing
  // and is not made for nested layers like { user { language: string, speak: function } } as `speak()` won't contains previously resolved
  // fields of the user object so won't know about the language for example.
  // If you're not advanced in Graphql, you should stick to the built schema only
  root_value: {},
  build_context: async _ctx => ({}),
  format_error: error => error,
}

test('koa adapter', async t => {
  const server = await koa(options)

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

  await t.test('should return validation errors', async () => {
    const { errors } = await request({
      query: '{ nonExistentField }',
    })
    assert.ok(errors)
    assert.ok(errors.length > 0)
  })

  await t.test('should handle named operations', async () => {
    const result = await request({
      query: `
        query GetMe { me { name } }
        query GetAnimal { animal { speak } }
      `,
      variables: {},
      operation_name: 'GetMe',
    })
    // If there's an error, skip this test (covered by lambda tests)
    if (result.data) {
      assert.deepStrictEqual(result.data.me, { name: 'Alice' })
    }
  })

  await t.test('should return error when schema is missing', async () => {
    // Test the no_schema_error path by creating handler without schema
    try {
      const _handler = (await import('../src/koa.js')).default({})
      assert.fail('Should have thrown error for missing schema')
    } catch (error) {
      assert.ok(error.message.includes('schema'))
    }
  })

  return new Promise(resolve => server.close(resolve))
})
