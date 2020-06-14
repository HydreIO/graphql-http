import graphql from 'graphql'
import { Readable } from 'stream'

const { parse, getOperationAST, execute, subscribe, validate } = graphql
const no_schema_error = () => {
  throw new Error('Option \'schema\' is required')
}
const k_field = Symbol('sse id')
/* c8 ignore next 11 */
// i'll let DeltaEvo test those :)
const stream_response = async function *(options) {
  let id = 0

  for await (const data of await subscribe(options)) {
    const json = JSON.stringify(data)
    const event_id = data[k_field] ?? id++

    yield `event:${ event_id }\ndata: ${ json }\n\n`
  }
}

export { k_field }
export default ({
  schema = no_schema_error(),
  rootValue,
} = {}) => async context => {
  const {
    query = context.throw(400, '\'query\' field not provided'),
    variables: variableValues,
    operationName,
  } = context.request.body
  const document = parse(query)
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
  const options = {
    document,
    schema,
    operationName,
    rootValue,
    variableValues,
  }

  /* c8 ignore next 6 */
  // subscription related
  if (operation === 'subscription') {
    context.type = 'text/event-stream'
    context.body = Readable.from(stream_response(options))
    return
  }

  // eslint-disable-next-line require-atomic-updates
  context.body = await execute(options)
}
