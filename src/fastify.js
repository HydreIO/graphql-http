import base from './base.js'
import { validate_request_body } from './validation.js'
import { GraphQLError } from 'graphql'

const Fastify = ({ body }, reply) => {
  // Validate request body
  try {
    validate_request_body(body)
  } catch (error) {
    const graphql_error =
      error instanceof GraphQLError ? error : new GraphQLError(error.message)
    reply
      .status(200)
      .type('application/json')
      .send({ errors: [graphql_error] })
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
    reply: ({ type = 'application/json', ...body }) =>
      reply.status(200).type(type).send(body),
  }
}

export default base(Fastify)
export { k_field } from './base.js'
