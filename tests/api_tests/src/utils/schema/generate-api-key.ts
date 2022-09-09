import { GenerateApiKeyResponse } from "@sdk-js/types"
import { JSONSchemaType } from "ajv"
import Ajv from '../ajv'

export let schema: JSONSchemaType<GenerateApiKeyResponse> = {
	type: 'object',
	properties: {
		api_key: { type: 'string' },
	},
	required: [
		'api_key',
	],
	additionalProperties: false,
}

export let validate = Ajv.compile(schema)

export default { schema, validate }
