<h1 align=center>@hydre/graphql-http</h1>
<p align=center>
  <img src="https://img.shields.io/github/license/hydreio/graphql-http.svg?style=for-the-badge" />
  <a href="https://www.npmjs.com/package/@hydre/graphql-http">
    <img src="https://img.shields.io/npm/v/@hydre/graphql-http.svg?logo=npm&style=for-the-badge" />
  </a>
  <img src="https://img.shields.io/npm/dw/@hydre/graphql-http?logo=npm&style=for-the-badge" />
  <img src="https://img.shields.io/github/actions/workflow/status/hydreio/graphql-http/CI?logo=Github&style=for-the-badge" />
</p>

<h3 align=center>GraphQL over http</h3>

## Install

```sh
npm i @hydre/graphql-http
```

It is recommended to use [@hydre/make_schema](https://github.com/HydreIO/make_schema) too,

```
npm i @hydre/make_schema
```

## Usage

This is an example with Koa but using others is pretty much the same.
Import them by path

```js
import graphqlHTTP from '@hydre/graphql-http/koa'
import graphqlHTTP from '@hydre/graphql-http/lambda'
import graphqlHTTP from '@hydre/graphql-http/tinyhttp'
import graphqlHTTP from '@hydre/graphql-http/fastify'
```

```js
import Koa from 'koa'
import { readFileSync } from 'fs'
import bodyParser from 'koa-bodyparser'
import { readFile } from 'fs/promises'
import graphql from 'graphql'
import graphqlHTTP from '@hydre/graphql-http/koa'
import makeSchema from '@hydre/make_schema'

const { buildSchema } = graphql
const schema = buildSchema(readFileSync('/path/to/schema.gql', 'utf-8'))
const app = new Koa().use(bodyParser()).use(
  graphqlHTTP({
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
            return { speak: () => 'jajaja', __typename: 'Cat' }
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
  })
)

app.listen(3000)
```
