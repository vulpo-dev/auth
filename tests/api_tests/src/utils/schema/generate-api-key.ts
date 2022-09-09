import { GenerateApiKeyResponse } from "@sdk-js/types"
import { JSONSchemaType } from "ajv"
import Ajv from '../ajv'

export let schema: JSONSchemaType<GenerateApiKeyResponse> = {
	type: 'object',
	properties: {
		api_key: { type: 'string' },
		id: { type: 'string', uuid: true }
	},
	required: [
		'api_key',
		'id',
	],
	additionalProperties: false,
}

export let validate = Ajv.compile(schema)

export default { schema, validate }
