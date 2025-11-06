import base from './base.js'
import { validate_request_body } from './validation.js'
import { GraphQLError } from 'graphql'

const TinyHttp = ({ body = {} }, response) => {
  // Validate request body
  try {
    validate_request_body(body)
  } catch (error) {
    const graphql_error =
      error instanceof GraphQLError ? error : new GraphQLError(error.message)
    response.status(200).json({ errors: [graphql_error] })
    return {
      query: null,
      variable_values: null,
      operation_name: null,
      reply: () => {},
    }
  }

  const { query, variables, operationName, operation_name } = body
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
