import base from './base.js'

const Fastify = ({ body: { query, variables, operationName } }, reply) => {
  if (!query) reply.code(400).send(`'query' field not provided`)

  return {
    query,
    variableValues: variables,
    operationName,
    reply: ({ status = 200, type = 'application/json', body }) =>
      reply.status(status).type(type).send(body),
  }
}

export default base(Fastify)
export { k_field } from './base.js'
