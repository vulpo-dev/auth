
import Db from '../utils/db'
import Http from '../utils/http'
import { admin } from '@seeds/data/projects'
import { createUser } from '../utils/user'
import { generateApiKey } from './utils'
import ClaimsSchema from '../utils/schema/claims'

import { ErrorCode } from '@sdk-js/error'

const TRAITS = ['Fuu', 'Bar']

let getUser = () => {
	return createUser({
		traits: TRAITS,
		project: admin.id 
	})
}

afterAll(() => Db.end())

describe("Verify ApiKey", () => {
	test("can verify", async () => {
		let user = await getUser()
		let apiKey = await generateApiKey(user.id, null)

		let res = await Http.post('/api_key/verify', {
			api_key: apiKey.value
		})
		.catch(err => err.response)

		expect(res.status).toEqual(200)
		expect(ClaimsSchema.validate(res.data)).toBeTruthy()

		expect(res.data.sub).toEqual(user.id)
		expect(res.data.traits).toEqual(TRAITS)
	})

	test("fails when token is expired", async () => {
		let user = await getUser()
		let expire = new Date(Date.now() - 60 * 1000).toISOString()
		let apiKey = await generateApiKey(user.id, expire)

		let res = await Http.post('/api_key/verify', {
			api_key: apiKey.value
		})
		.catch(err => err.response)

		expect(res.status).toEqual(401)
		expect(res.data.code).toBe(ErrorCode.TokenExpired)
	})
})
