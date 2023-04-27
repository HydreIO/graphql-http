import { readFileSync } from 'fs'

import { App } from '@tinyhttp/app'
import { buildSchema } from 'graphql/index.mjs'

import graphqlHTTP from '../src/tinyhttp.js'

const schema = buildSchema(readFileSync('./test/schema.gql', 'utf-8'))
const app = new App()
const json_body = (request, response, next) =>
  Promise.resolve([])
    .then(async body => {
      for await (const chunk of request) body.push(chunk)
      request.body = JSON.parse(body.join(''))
      next()
    })
    .catch(() => response.status(400).end('INVALID_BODY'))

app.use(json_body).use(
  graphqlHTTP({
    schema,
    rootValue: {
      hello({ name }) {
        return `Hello ${name} !`
      },
      async *onMessage() {
        while (true) {
          console.log('lol')
          await new Promise(resolve => setTimeout(resolve, 1000))
          yield 'Hello'
        }
      },
    },
  })
)

const server = app.listen(3000, () =>
  console.log('Listening on', server.address())
)
