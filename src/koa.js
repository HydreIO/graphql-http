import graphql from 'graphql';

const { parse, getOperationAST, execute } = graphql;

export default function graphqlHTTP({
	schema = (() => { throw new Error("Option 'schema' is required") })(),
	rootValue,
} = {}) {
	return async function middleware(ctx) {
		const {
			query = ctx.throw(400, "'query' field not provided"),
			operationName
		} = ctx.body || ctx.query;
		
		const document = parse(query)
		const { operation } = getOperationAST(document, operationName)
			|| ctx.throw(400, `Operation '${operationName}' not found`)

		const result = await execute({
			document,
			schema,
			operationName,
			rootValue
		})

		ctx.body = result
	}
}