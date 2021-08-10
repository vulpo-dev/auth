import Ajv, {JSONSchemaType} from "ajv"
import { User } from '@sdk-js/types'

let ajv = new Ajv()

let schema: JSONSchemaType<User> = {
  type: "object",
  properties: {
    id: {type: "string" },
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
    created_at: { type: "string"  },
    updated_at: { type: "string"  },
    disabled: { type: "boolean"  },
  },
  required: [],
  additionalProperties: false
}

export default schema