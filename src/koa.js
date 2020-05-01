import graphql from 'graphql'
import { Readable } from 'stream'

const { parse, getOperationAST, execute, subscribe, validate } = graphql

export const idField = Symbol("id")

export default function graphqlHTTP({
	schema = (() => { throw new Error("Option 'schema' is required") })(),
	rootValue,
} = {}) {
	return async function middleware(ctx) {
		const {
			query = ctx.throw(400, "'query' field not provided"),
			variables: rawVariables,
			operationName
		} = ctx.request.body || ctx.query;
		
		const document = parse(query)

		const errors = validate(schema, document)
		if (errors.length) {
			ctx.status = 400
			ctx.body = { errors, data: null }
			return
		}

		const { operation } = getOperationAST(document, operationName)
			|| ctx.throw(400, `Operation '${operationName}' not found`)

		const options = {
			document,
			schema,
			operationName,
			rootValue
		};

		if (operation === 'subscription') {
			ctx.type = "text/event-stream"
			ctx.body = Readable.from((async function *() {
				let id = 0;
				for await (const data of (await subscribe(options))) {
					yield `event:${data[idField] || id++}\ndata: ${JSON.stringify(data)}\n\n`
				}
			}()))
		} else
			ctx.body = await execute(options)
	}
}
