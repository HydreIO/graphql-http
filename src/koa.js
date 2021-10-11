import base from './base.js'

const Koa = context => {
  const {
    query,
    variables: variableValues,
    operationName,
  } = context.request.body
  return {
    query,
    variableValues,
    operationName,
    reply: ({ type = 'application/json', ...body }) => {
      context.status = 200
      context.type = type
      context.body = body
    },
  }
}

export default base(Koa)
export { k_field } from './base.js'
