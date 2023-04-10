import {JSONSchemaType} from "ajv"
import { PasswordlessResponse } from '@vulpo-dev/auth-sdk'

import Ajv from '../ajv'

export let schema: JSONSchemaType<PasswordlessResponse> = {
	type: 'object',
	properties: {
		id: { type: 'string', uuid: true },
		session: { type: 'string', uuid: true },
	},
	required: [
		'id',
		'session',
	],
	additionalProperties: false,
}

export let validate = Ajv.compile(schema)

export default { schema, validate }