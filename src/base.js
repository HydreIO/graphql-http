import { Readable } from 'stream'

import {
  parse,
  getOperationAST,
  execute,
  subscribe,
  validate,
  GraphQLError,
} from 'graphql'

import { with_timeout } from './validation.js'

const no_schema_error = () => {
  throw new Error("Option 'schema' is required")
}
const k_field = Symbol('sse id')

async function* stream_response(options, format_error) {
  let id = 0
  try {
    for await (const { data, errors } of await subscribe(options)) {
      const payload = {
        data,
        ...(errors && { errors: errors.map(format_error) }),
      }
      const json = JSON.stringify(payload)
      const event_id = data?.[k_field] ?? id++

      yield `event:${event_id}\ndata: ${json}\n\n`
    }
  } catch (error) {
    const payload = {
      data: undefined,
      errors: [format_error(error)],
    }
    yield `event:${++id}\ndata: ${JSON.stringify(payload)}\n\n`
  }
}

const try_parse = ({ query, reply, format_error }) => {
  try {
    return parse(query)
  } catch (error) {
    reply({
      errors: [
        format_error(new GraphQLError(`Invalid operation: ${error.message}`)),
      ],
    })
    return undefined
  }
}

export { k_field }
export default implementation =>
  ({
    schema = no_schema_error(),
    root_value,
    build_context = () => ({}),
    format_error = error => error,
    context_timeout = 5000,
  } = {}) =>
  async (...input) => {
    const { query, variable_values, operation_name, reply } = implementation(
      ...input,
    )

    if (!query) {
      reply({
        errors: [format_error(new GraphQLError("'query' field not provided"))],
      })
      return
    }
    const document = try_parse({ query, reply, format_error })
    if (!document) return
    const errors = validate(schema, document)

    if (errors.length) {
      reply({
        errors,
        data: undefined,
      })
      return
    }

    const operation_ast = getOperationAST(document, operation_name)
    if (!operation_ast) {
      reply({
        errors: [
          format_error(
            new GraphQLError(`Operation '${operation_name}' not found`),
          ),
        ],
      })
      return
    }

    // Build context with timeout protection
    let context_value
    try {
      const wrapped_build_context = with_timeout(build_context, context_timeout)
      context_value = (await wrapped_build_context(...input)) ?? {}
    } catch (error) {
      reply({
        errors: [
          format_error(
            new GraphQLError(
              error.message.includes('timed out')
                ? 'Context building timed out'
                : error.message,
            ),
          ),
        ],
      })
      return
    }
    const options = {
      document,
      schema,
      operationName: operation_name,
      rootValue: root_value,
      variableValues: variable_values,
      contextValue: context_value,
    }

    if (operation_ast.operation === 'subscription') {
      reply({
        type: 'text/event-stream',
        body: Readable.from(stream_response(options, format_error)),
      })
      return
    }

    const { data, errors: execution_errors } = await execute(options)

    reply({
      data,
      ...(execution_errors && {
        errors: execution_errors.map(format_error),
      }),
    })
  }
