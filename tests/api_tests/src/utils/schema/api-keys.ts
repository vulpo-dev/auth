import { ApiKeys } from "@vulpo-dev/auth-sdk"
import { JSONSchemaType } from "ajv"

import Ajv from '../ajv'
import ApiKey from './api-key'

export let schema: JSONSchemaType<ApiKeys> = {
	type: 'object',
	properties: {
		keys: { type: 'array', items: ApiKey.schema }
	},
	required: [
		'keys',
	],
	additionalProperties: false,
}

export let validate = Ajv.compile(schema)

export default { schema, validate }
