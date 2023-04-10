import { ApiKey } from "@vulpo-dev/auth-sdk"
import { JSONSchemaType } from "ajv"

import Ajv from '../ajv'

export let schema: JSONSchemaType<ApiKey> = {
	type: 'object',
	properties: {
		id: { type: 'string', uuid: true },
		name: { type: 'string', nullable: true },
		created_at: { type: 'string', dateTime: true },
		expire_at: { type: 'string', dateTime: true, nullable: true },
	},
	required: [
		'id',
		'created_at',
	],
	additionalProperties: false,
}

export let validate = Ajv.compile(schema)

export default { schema, validate }
