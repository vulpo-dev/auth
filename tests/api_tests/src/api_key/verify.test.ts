

import Db from '../utils/db'
import Http from '../utils/http'
import { makeCreateUser } from '../utils/passwordless'
import { admin } from '@seeds/data/projects'

import { v4 as uuid } from 'uuid'
import * as bcrypt from 'bcryptjs'
import { ErrorCode } from '@sdk-js/error'

const EMAIL = 'api+test_api_key_verify@vulpo.dev'
const USER_ID = 'dfb94f00-7a63-4bb0-908e-e4af3dc096ed'
const PROJECT_ID = admin.id
const TRAITS = ['Fuu', 'Bar']

let createUser = makeCreateUser(
	USER_ID,
	EMAIL,
	PROJECT_ID,
	TRAITS
)

beforeEach(async () => {
	await Db.query(`
		delete from users
		 where id = $1 
	`, [USER_ID])

	await createUser()
})

afterAll(() => Db.end())

describe("Verify ApiKey", () => {
	test("can verify", async () => {
		let apiKey = await generateApiKey(null)

		let res = await Http.post('/api_key/verify', {
			api_key: apiKey.value
		})
		.catch(err => err.response)

		expect(res.status).toEqual(200)
		expect(res.data.sub).toEqual(USER_ID)
		expect(res.data.iss).toEqual(PROJECT_ID)
		expect(res.data.traits).toEqual(TRAITS)
	})

	test("fails when token is expired", async () => {
		let expire = new Date(Date.now() - 60 * 1000).toISOString()
		let apiKey = await generateApiKey(expire)

		let res = await Http.post('/api_key/verify', {
			api_key: apiKey.value
		})
		.catch(err => err.response)

		expect(res.status).toEqual(401)
		expect(res.data.code).toBe(ErrorCode.TokenExpired)
	})
})

async function generateApiKey(expire_at: null | string) {
	let id = uuid()
	let token = uuid()

	let value = Buffer.from(`${id}:${token}`).toString('base64')
	let hashedToken = bcrypt.hashSync(token)

	await Db.query(`
		insert into api_keys(id, token, user_id, expire_at)
		values($1, $2, $3, $4)
		returning id
	`, [id, hashedToken, USER_ID, expire_at])

	return { id, token, value, expire_at }
}
