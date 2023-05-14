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
    body: JSON.stringify({ variables, query }),
  })
  return response.json()
}

const options = {
  schema: make_schema({
    document: await readFile('test/schema.gql', 'utf8'),
    resolvers: {
      Query: {
        hello({ name }) {
          return `Hello ${name} !`
        },
        me() {
          return { friend: 'Bob', name: 'Alice' }
        },
        animal() {
          return { speak: () => 'jajaja' }
        },
      },
      Animal: {
        // __resolveType() {},
        __typeName: 'Cat',
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
  // rootValue is what comes as a first argument in your resolvers, it is an object resolved by default
  // a bit like how Promise.resolve() works, meaning that your subsequent resolvers won't be called
  // if something is already present in this rootValue.
  // This is useful for the first layer of calls and can contains functions but it can become confusing
  // and is not made for nested layers like { user { language: string, speak: function } } as `speak()` won't contains previously resolved
  // fields of the user object so won't know about the language for example.
  // If you're not advanced in Graphql, you should stick to the built schema only
  rootValue: {},
  buildContext: async ctx => {},
  formatError: error => error,
}

test('koa', async t => {
  const server = await koa(options)

  await t.test('should return a valid response', async t => {
    const { data } = await request({
      query: '{ me { name, sayHello(to: "John") } }',
    })
    assert.deepStrictEqual(data.me, {
      name: 'Alice',
      sayHello: "Hello John, I'm Bob's friend",
    })
  })

  await t.test('Interface', async t => {
    const { data } = await request({
      query: '{ animal { speak } }',
    })

    assert.deepStrictEqual(data.animal, {
      speak: 'miaou',
    })
  })

  return new Promise(resolve => server.close(resolve))
})
