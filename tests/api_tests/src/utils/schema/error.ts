import { ErrorCode, Code } from "@sdk-js/error"
import { JSONSchemaType } from "ajv"
import Ajv from '../ajv'

export let schema: JSONSchemaType<Code> = {
	type: 'object',
	properties: {
		code: { type: 'string', enum: Object.values(ErrorCode) },
	},
	required: [
		'code',
	],
}

export let validate = Ajv.compile(schema)

export default { schema, validate }
