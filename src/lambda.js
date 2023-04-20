import base from './base.js'

const Lambda = ({ body: raw_body }, context, reply) => {
  const { query, operationName, variables } = JSON.parse(raw_body)
  return {
    query,
    variableValues: variables,
    operationName,
    reply: ({ type = 'application/json', ...body }) =>
      reply(null, { statusCode: 200, body: JSON.stringify(body) }),
  }
}

export default base(Lambda)
export { k_field } from './base.js'
