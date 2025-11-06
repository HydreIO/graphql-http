import base from './base.js'
import { validate_request_body } from './validation.js'
import { GraphQLError } from 'graphql'

const Koa = context => {
  const request_body = context.request.body

  // Validate request body
  try {
    validate_request_body(request_body)
  } catch (error) {
    const graphql_error =
      error instanceof GraphQLError ? error : new GraphQLError(error.message)
    context.status = 200
    context.type = 'application/json'
    context.body = { errors: [graphql_error] }
    return {
      query: null,
      variable_values: null,
      operation_name: null,
      reply: () => {},
    }
  }

  const { query, variables, operationName, operation_name } = request_body
  return {
    query,
    variable_values: variables,
    operation_name: operation_name ?? operationName,
    reply: ({ type = 'application/json', ...body }) => {
      context.status = 200
      context.type = type
      context.body = body
    },
  }
}

export default base(Koa)
export { k_field } from './base.js'
