import base from './base.js'

const Lambda = (
  { body: { query, variables, operationName } = {} },
  context,
  reply
) => ({
  query,
  variableValues: variables,
  operationName,
  reply: ({ type = 'application/json', ...body }) =>
    reply(null, { statusCode: 200, body: JSON.stringify(body) }),
})

export default base(Lambda)
export { k_field } from './base.js'
