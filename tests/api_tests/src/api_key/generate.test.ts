import Db from '../utils/db'
import Http from '../utils/http'
import { createUser, createAccessToken } from '../utils/user'

import { v4 as uuid, validate as uuidValidate } from 'uuid'
import * as bcrypt from 'bcryptjs'

afterAll(() => Db.end())

describe("Generate API Key", () => {
	test("can generate API Key", generateTokenTest(null))
	test("can generate API Key with expiration date", generateTokenTest(new Date(Date.now() + 30 * 60 * 1000).toISOString()))
})

function generateTokenTest (expire_at: null | string) {
	return async () => {
		let user = await createUser()
		let accessToken = createAccessToken({ user })

		let payload = {
			expire_at,
			name: uuid(),
		}

		let res = await Http.post('/api_key/generate', payload, {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			}
		})
		.catch(err => err.response)	

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')
		expect(typeof res.data.api_key).toBe('string')

		let apiKey = Buffer.from(res.data.api_key, 'base64').toString('utf8')
		let [keyId, token] = apiKey.split(':')

		expect(uuidValidate(keyId)).toBeTruthy()

		let { rows } = await Db.query(`
			select token
				 , expire_at
				 , user_id
				 , name
			  from api_keys
			 where id = $1
		`, [keyId])

		expect(rows.length).toEqual(1)
		expect(rows[0].expire_at ? rows[0].expire_at.toISOString() : null).toEqual(payload.expire_at)
		expect(rows[0].user_id).toEqual(user.id)
		expect(rows[0].name).toEqual(payload.name)
		expect(bcrypt.compareSync(token, rows[0].token)).toBeTruthy()
	}
}