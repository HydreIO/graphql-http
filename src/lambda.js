import base from './base.js'

const Lambda = ({ body: raw_body }, context, reply) => {
  const { query, operationName, operation_name, variables } =
    JSON.parse(raw_body)
  return {
    query,
    variable_values: variables,
    operation_name: operation_name ?? operationName,
    reply: ({ type: _type = 'application/json', ...body }) =>
      reply(null, { statusCode: 200, body: JSON.stringify(body) }),
  }
}

export default base(Lambda)
export { k_field } from './base.js'
