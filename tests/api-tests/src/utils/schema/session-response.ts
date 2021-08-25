import {JSONSchemaType} from "ajv"
import { SessionResponse } from '@sdk-js/types'
import Ajv from '../ajv'

export let schema: JSONSchemaType<SessionResponse> = {
	type: 'object',
	properties: {
		access_token: { type: 'string' },
		created: { type: 'boolean' },
		user_id: { type: 'string', uuid: true },
		expire_at: { type: 'string', dateTime: true },
		session: { type: 'string', uuid: true },
	},
	required: [
		'access_token',
		'created',
		'user_id',
		'expire_at',
		'session',
	],
	additionalProperties: false,
}

export let validate = Ajv.compile(schema)

export default { schema, validate }