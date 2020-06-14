import Koa from 'koa'
import { readFileSync } from 'fs'
import bodyParser from 'koa-bodyparser'
import graphql from 'graphql'
import graphqlHTTP from '../src/koa.js'
import GR from 'graphql-request'
import fetch from 'node-fetch'

globalThis.fetch = fetch

const { buildSchema } = graphql
const schema = buildSchema(readFileSync('./test/schema.gql', 'utf-8'))
const rootValue = {
  hello({ name }) {
    return `Hello ${ name } !`
  },
  async *onMessage() {
    while (true) {
      console.log('lol')
      await new Promise(resolve =>
        setTimeout(resolve, 1000))
      yield 'Hello'
    }
  },
}

let used_port = 5000

export default class {
  static name = 'Graphql-http (koa)'
  static timeout = 1000

  #port = ++used_port
  #ready

  constructor(cleanup) {
    const app = new Koa().use(bodyParser())
        .use(graphqlHTTP({
          schema,
          rootValue,
        }))

    // eslint-disable-next-line init-declarations
    let http_server

    this.#ready = new Promise(resolve => {
      http_server = app.listen(this.#port, resolve())
    })

    cleanup(() =>
      new Promise(resolve => {
        http_server.close(resolve)
      }))
  }

  static invariants(affirmation) {
    const affirm = affirmation(1)

    try {
      graphqlHTTP()
    } catch (error) {
      affirm({
        that   : 'a middleware',
        should : 'be created with a schema',
        because: error.message,
        is     : 'Option \'schema\' is required',
      })
    }
  }

  async serve(affirmation) {
    await this.#ready

    const affirm = affirmation(2)
    const host = `http://localhost:${ this.#port }`
    const query = /* GraphQL */ `
      query($name: String!) {
        hello(name: $name)
      }
    `
    const response = await GR.request(host, query, {
      name: 'Pepeg',
    })

    affirm({
      that   : 'a graphql request',
      should : 'just works',
      because: response.hello,
      is     : 'Hello Pepeg !',
    })

    try {
      await GR.request(host, '{ invalid }')
    } catch (error) {
      affirm({
        that   : 'an invalid query',
        should : 'give an error 400',
        because: error.message.slice(0, 45),
        is     : 'Cannot query field "invalid" on type "Query".',
      })
    }
  }
}
