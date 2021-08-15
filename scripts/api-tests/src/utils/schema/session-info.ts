import Ajv, {JSONSchemaType} from "ajv"
import { SessionInfo } from '@sdk-js/types'
import UserSchema from './user'

let ajv = new Ajv()

let schema: JSONSchemaType<SessionInfo> = {
	type: 'object',
	properties: {
		id: { type: 'string' },
		user: { type: UserSchema.schema, nullable: true },
		expire_at: { type: 'string', nullable: true }
	},
	required: [],
	additionalProperties: false,
}

export default schema