import { Readable } from 'stream'

import {
  parse,
  getOperationAST,
  execute,
  subscribe,
  validate,
  GraphQLError,
} from 'graphql/index.mjs'

const no_schema_error = () => {
  throw new Error("Option 'schema' is required")
}
const k_field = Symbol('sse id')
/* c8 ignore next 15 */
// i'll let DeltaEvo test those :)
const stream_response = async function* (options, formatError) {
  let id = 0

  for await (const { data, errors } of await subscribe(options)) {
    const payload = {
      data,
      ...(errors && { errors: errors.map(formatError) }),
    }
    const json = JSON.stringify(payload)
    const event_id = data[k_field] ?? id++

    yield `event:${event_id}\ndata: ${json}\n\n`
  }
}
const try_parse = ({ query, reply, formatError }) => {
  try {
    return parse(query)
  } catch (error) {
    reply({
      errors: [
        formatError(new GraphQLError(`Invalid operation: ${error.message}`)),
      ],
    })
    return undefined
  }
}

export { k_field }
export default implementation =>
  ({
    schema = no_schema_error(),
    rootValue,
    buildContext = () => ({}),
    formatError = error => error,
  } = {}) =>
  async (...input) => {
    const { query, variableValues, operationName, reply } = implementation(
      ...input
    )
    if (!query) {
      reply({
        errors: [formatError(new GraphQLError("'query' field not provided"))],
      })
      return
    }
    const document = try_parse({ query, reply, formatError })
    if (!document) return
    const errors = validate(schema, document)

    if (errors.length) {
      reply({
        errors,
        data: undefined,
      })
      return
    }

    const { operation } = getOperationAST(document, operationName)
    /* c8 ignore next 9 */
    // would have to do raw request, meh
    if (!operation)
      reply({
        errors: [
          formatError(
            new GraphQLError(`Operation '${operationName}' not found`)
          ),
        ],
      })
    const contextValue = await buildContext(...input)

    if (!contextValue) return

    const options = {
      document,
      schema,
      operationName,
      rootValue,
      variableValues,
      contextValue,
    }

    /* c8 ignore next 8 */
    // subscription related
    if (operation === 'subscription') {
      reply({
        type: 'text/event-stream',
        body: Readable.from(stream_response(options, formatError)),
      })
      return
    }

    const { data, errors: execution_errors } = await execute(options)

    reply({
      data,
      ...(execution_errors && {
        errors: execution_errors.map(formatError),
      }),
    })
  }
