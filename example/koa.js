import Koa from "koa"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from 'url'
import bodyParser from "koa-bodyparser"
import tools from 'graphql-tools'
const { makeExecutableSchema } = tools

import graphql from "../src/koa"

const dir = dirname(fileURLToPath(import.meta.url))

const app = new Koa()
	.use(bodyParser())
	.use(graphql({
		schema: makeExecutableSchema({
			typeDefs: readFileSync(join(dir, "schema.gql"), "utf-8"),
			resolvers: {
				Query: {
					hello(root, { name }) {
						return `Hello ${name} !`
					}
				}
			}
		})
	}))

const server = app.listen(3000, () => console.log("Listening on ", server.address()))