import base from './base.js'

const TinyHttp = (
  { body: { query, variables, operationName, operation_name } = {} },
  response,
) => {
  return {
    query,
    variable_values: variables,
    operation_name: operation_name ?? operationName,
    reply: ({ type = 'application/json', ...body }) => {
      if (type === 'text/event-stream') body.body.pipe(response)
      else response.status(200).json(body)
    },
  }
}

export default base(TinyHttp)
export { k_field } from './base.js'
