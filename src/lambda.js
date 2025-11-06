import base from './base.js'
import { validate_request_body } from './validation.js'
import { GraphQLError } from 'graphql'

const Lambda = ({ body: raw_body }, context, reply) => {
  // Parse JSON with error handling
  let parsed
  try {
    parsed = JSON.parse(raw_body)
  } catch (error) {
    reply(null, {
      statusCode: 400,
      body: JSON.stringify({
        errors: [{ message: 'Invalid JSON in request body' }],
      }),
    })
    return { query: null, variable_values: null, operation_name: null, reply }
  }

  // Validate request body structure
  try {
    validate_request_body(parsed)
  } catch (error) {
    reply(null, {
      statusCode: 200,
      body: JSON.stringify({
        errors: [error instanceof GraphQLError ? error : { message: error.message }],
      }),
    })
    return { query: null, variable_values: null, operation_name: null, reply }
  }

  const { query, operationName, operation_name, variables } = parsed
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
