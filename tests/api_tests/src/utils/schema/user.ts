import {JSONSchemaType} from "ajv"
import { User } from '@sdk-js/types'
import Ajv from '../ajv'

let schema: JSONSchemaType<User> = {
  type: "object",
  properties: {
    id: { type: "string", uuid: true },
    display_name: { type: "string", nullable: true },
    email: { type: "string" },
    email_verified: { type: "boolean"  },
    photo_url: { type: "string", nullable: true },
    traits: {
    	type: "array",
    	items: { type: "string" },
    },
    data: {
    	type: "object",
    	required: [],
    	additionalProperties: true
    },
    provider_id: { type: "string"  },
    created_at: { type: "string", dateTime: true },
    updated_at: { type: "string", dateTime: true },
    state: { type: "string", enum: ['Active', 'Disabled', 'SetPassword']  },
    device_languages: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: [],
  additionalProperties: false
}

export let validate = Ajv.compile(schema)
export default { schema, validate }