import base from './base.js'

const Fastify = (
  { body: { query, variables, operationName, operation_name } },
  reply,
) => ({
  query,
  variable_values: variables,
  operation_name: operation_name ?? operationName,
  reply: ({ type = 'application/json', ...body }) =>
    reply.status(200).type(type).send(body),
})

export default base(Fastify)
export { k_field } from './base.js'
