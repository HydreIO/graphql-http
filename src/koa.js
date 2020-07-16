/* eslint-disable require-atomic-updates */
import {
  parse,
  getOperationAST,
  execute,
  subscribe,
  validate,
} from 'graphql/index.mjs'
import { Readable } from 'stream'

const no_schema_error = () => {
  throw new Error('Option \'schema\' is required')
}
const k_field = Symbol('sse id')
/* c8 ignore next 15 */
// i'll let DeltaEvo test those :)
const stream_response = async function *(options, formatError) {
  let id = 0

  for await (const { data, errors } of await subscribe(options)) {
    const payload = {
      data,
      ...errors && { errors: errors.map(formatError) },
    }
    const json = JSON.stringify(payload)
    const event_id = data[k_field] ?? id++

    yield `event:${ event_id }\ndata: ${ json }\n\n`
  }
}
const try_parse = (query, context) => {
  try {
    return parse(query)
  } catch (error) {
    context.throw(400, `Invalid operation: ${ error.message }`)
    return undefined
  }
}

export { k_field }
export default ({
  schema = no_schema_error(),
  rootValue,
  buildContext = () => ({}),
  formatError = error => error,
} = {}) => async context => {
  const {
    query = context.throw(400, '\'query\' field not provided'),
    variables: variableValues,
    operationName,
  } = context.request.body
  const document = try_parse(query, context)
  const errors = validate(schema, document)

  if (errors.length) {
    context.status = 400
    context.body = {
      errors,
      data: undefined,
    }
    return
  }

  const { operation }
    = getOperationAST(document, operationName)
    /* c8 ignore next 2 */
    // would have to do raw request, meh
    || context.throw(400, `Operation '${ operationName }' not found`)
  const contextValue = await buildContext(context)

  if (!contextValue) return

  const options = {
    document,
    schema,
    operationName,
    rootValue,
    variableValues,
    contextValue,
  }

  /* c8 ignore next 6 */
  // subscription related
  if (operation === 'subscription') {
    context.type = 'text/event-stream'
    context.body = Readable.from(stream_response(options))
    return
  }

  try {
    const { data, errors: execution_errors } = await execute(options)

    context.body = {
      data,
      ...execution_errors && { errors: execution_errors.map(formatError) },
    }
  } catch (error) {
    context.body = {
      data  : undefined,
      errors: [formatError(error)],
    }
  }
}
