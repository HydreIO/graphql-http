<h1 align=center>@hydre/graphql-http</h1>
<p align=center>
  <img src="https://img.shields.io/github/license/hydreio/graphql-http.svg?style=for-the-badge" />
  <a href="https://www.npmjs.com/package/@hydre/graphql-http">
    <img src="https://img.shields.io/npm/v/@hydre/graphql-http.svg?logo=npm&style=for-the-badge" />
  </a>
  <img src="https://img.shields.io/npm/dw/@hydre/graphql-http?logo=npm&style=for-the-badge" />
  <img src="https://img.shields.io/github/workflow/status/hydreio/graphql-http/CI?logo=Github&style=for-the-badge" />
</p>

<h3 align=center>GraphQL over http</h3>

## Install

```sh
npm i @hydre/graphql-http
```

## Usage

### | KoaJS

```js
import Koa from 'koa'
import { readFileSync } from 'fs'
import bodyParser from 'koa-bodyparser'
import graphql from 'graphql'
import graphqlHTTP from '@hydre/graphql-http/koa'

const { buildSchema } = graphql
const schema = buildSchema(readFileSync('/path/to/schema.gql', 'utf-8'))
const app = new Koa()
  .use(bodyParser())
  .use(graphqlHTTP({
    schema,
    rootValue: {},
    buildContext: async ctx => {}
  }))

app.listen(3000)
```