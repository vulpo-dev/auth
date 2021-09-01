import {JSONSchemaType} from "ajv"
import { Languages } from '@admin/data/languages'
import Ajv from '../ajv'

let properties = Object
	.keys(Languages).map(code => {
		return { [code]: { type: 'object', nullable: true } }
	})
	.reduce((acc, x) => Object.assign(acc, x), {})

export let schema = {
	type: 'object',
	properties: properties,
	required: [],
	additionalProperties: false,
}

export let validate = Ajv.compile(schema)

export default { schema, validate }
