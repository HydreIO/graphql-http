import Fastify from 'fastify'

import graphqlHTTP from '../src/fastify.js'

export default async options => ({
  http_server: await new Promise(resolve => {
    const app = Fastify()
    app.post('/', graphqlHTTP(options)).listen(3000, () => {
      resolve(app.server)
    })
  }),
  graphqlHTTP,
  name: 'fastify',
})
