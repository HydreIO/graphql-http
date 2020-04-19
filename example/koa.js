import Koa from "koa"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import bodyParser from "koa-bodyparser"
import graphql from "graphql"
import graphqlHTTP from "../src/koa"

const { buildSchema } = graphql

const dir = dirname(fileURLToPath(import.meta.url))

const app = new Koa()
	.use(bodyParser())
	.use(graphqlHTTP({
		schema: buildSchema(readFileSync(join(dir, "schema.gql"), "utf-8")),
		rootValue: {
			hello({ name }) {
				return `Hello ${name} !`
			},
			async *onMessage() {
				while (true) {
					console.log("lol")
					await new Promise(resolve => setTimeout(resolve, 1000))
					yield "Hello"
				}
			}
		}
	}))

const server = app.listen(3000, () => console.log("Listening on ", server.address()))