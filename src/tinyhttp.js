import base from './base.js'

const TinyHttp = (
  { body: { query, variables: variableValues, operationName } },
  response
) => {
  return {
    query,
    variableValues,
    operationName,
    reply: ({ type = 'application/json', ...body }) =>
      response.status(200).json(body),
  }
}

export default base(TinyHttp)
export { k_field } from './base.js'
