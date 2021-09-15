import Ajv from "ajv"
import { validate as uuidValidate } from 'uuid';

let ajv = new Ajv()

ajv.addKeyword({
	keyword: "uuid",
	type: "string",
	errors: false,
	validate: (_: unknown, data: string) => {
		return uuidValidate(data)
	}
})

ajv.addKeyword({
	keyword: "dateTime",
	type: "string",
	errors: false,
	validate: (_: unknown, data: string) => {
		return !isNaN(Date.parse(data)) 
	}
})

export default ajv