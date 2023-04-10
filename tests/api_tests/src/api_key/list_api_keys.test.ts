import { ApiKeys, GenerateApiKey, Url } from '@vulpo-dev/auth-sdk'
import { v4 as uuid } from 'uuid'

import Db from '../utils/db'
import Http from '../utils/http'
import { createUser, createAccessToken } from '../utils/user'
import ApiKeysSchema from '../utils/schema/api-keys'

afterAll(() => Db.end())

describe('List API Keys', () => {
	test('can list API Keys', async () => {
		let user = await createUser()
		let accessToken = createAccessToken({ user })

		let names = await Promise.all([
			generateApiKey(accessToken),
			generateApiKey(accessToken),
			generateApiKey(accessToken),
		])

		let res = await Http.get<ApiKeys>(Url.ListApiKeys, {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			}
		})

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')
		expect(ApiKeysSchema.validate(res.data)).toBeTruthy()
		
		let { keys } = res.data
		expect(keys.length).toEqual(names.length)

		names.forEach(name => {
			let item = keys.find(item => item.name === name)
			expect(item?.name).toEqual(name)
		})
	})
})

async function generateApiKey(accessToken: string) {
	let payload: GenerateApiKey = {
		name: uuid()
	}

	await Http.post(Url.GenerateApiKey, payload, {
		headers: {
			'Authorization': `Bearer ${accessToken}`,
		}
	})

	return payload.name
}