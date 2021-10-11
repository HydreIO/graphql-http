import base from './base.js'

const Fastify = ({ body: { query, variables, operationName } }, reply) => ({
  query,
  variableValues: variables,
  operationName,
  reply: ({ type = 'application/json', ...body }) =>
    reply.status(200).type(type).send(body),
})

export default base(Fastify)
export { k_field } from './base.js'
