import base from './base.js'

const Koa = context => {
  const {
    query = context.throw(400, "'query' field not provided"),
    variables: variableValues,
    operationName,
  } = context.request.body
  return {
    query,
    variableValues,
    operationName,
    reply: ({ status = 200, type = 'application/json', body }) => {
      context.status = status
      context.type = type
      context.body = body
    },
  }
}

export default base(Koa)
export { k_field } from './base.js'
