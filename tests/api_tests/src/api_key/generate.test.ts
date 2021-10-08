import Db from '../utils/db'
import Http from '../utils/http'
import { PROJECT_ID } from '../utils/env'
import { makeCreateUser } from '../utils/passwordless'
import { makeGenerateAccessToken, makeTokenPayload } from '../utils/user'
import { projectKeys } from '@seeds/data/projects'

import { v4 as uuid, validate as uuidValidate } from 'uuid'
import * as bcrypt from 'bcryptjs'

const EMAIL = 'api+test_api_key@vulpo.dev'
const USER_ID = 'a3989244-3a03-47a0-8424-1d316cf429f2'

let createUser = makeCreateUser(
	USER_ID,
	EMAIL,
	PROJECT_ID
)

let generateAccessToken = makeGenerateAccessToken({
	key: projectKeys.private_key,
	passphrase: 'password'
})
let tokenPayload = makeTokenPayload(USER_ID, PROJECT_ID)

beforeEach(async () => {
	await Db.query(`
		delete from users
		 where id = $1 
	`, [USER_ID])

	return createUser()
})

afterAll(() => Db.end())

describe("Generate API Key", () => {
	test("can generate API Key", generateTokenTest(null))
	test("can generate API Key with expiration date", generateTokenTest(new Date(Date.now() + 30 * 60 * 1000).toISOString()))
})

function generateTokenTest (expire_at: null | string) {
	return async () => {
		let accessToken = generateAccessToken({
			payload: tokenPayload()
		})

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
		expect(rows[0].user_id).toEqual(USER_ID)
		expect(rows[0].name).toEqual(payload.name)
		expect(bcrypt.compareSync(token, rows[0].token)).toBeTruthy()
	}
}