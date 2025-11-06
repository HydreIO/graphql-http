import base from './base.js'

const Koa = context => {
  const { query, variables, operationName, operation_name } =
    context.request.body
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
