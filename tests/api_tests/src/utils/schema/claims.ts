import { Claims } from "@sdk-js/types"
import { JSONSchemaType } from "ajv"
import Ajv from '../ajv'

export let schema: JSONSchemaType<Claims> = {
	type: 'object',
	properties: {
		sub: { type: 'string', uuid: true },
		exp: { type: 'number' },
		traits: { type: 'array', items: { type: 'string' } },
	},
	required: [
		'sub',
		'exp',
		'traits',
	],
	additionalProperties: false,
}

export let validate = Ajv.compile(schema)

export default { schema, validate }
