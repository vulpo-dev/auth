

import Db from '../utils/db'
import Http from '../utils/http'
import { makeCreateUser } from '../utils/passwordless'
import { makeGenerateAccessToken, makeTokenPayload } from '../utils/user'
import { adminKeys, admin } from '@seeds/data/projects'

import { v4 as uuid } from 'uuid'
import * as bcrypt from 'bcryptjs'

const EMAIL = 'api+test_admin_api_key@vulpo.dev'
const USER_ID = '1635abcf-aaf4-4800-a552-2fdfcc54ee5c'
const PROJECT_ID = admin.id

let createUser = makeCreateUser(
	USER_ID,
	EMAIL,
	PROJECT_ID,
	['Admin']
)

beforeEach(async () => {
	await Db.query(`
		delete from users
		 where id = $1 
	`, [USER_ID])

	await createUser()
})

afterAll(() => Db.end())

describe("ApiKey Admin guard", () => {
	test("can call API", async () => {
		let apiKey = await generateApiKey(null)

		let res = await Http.get('/admin/__/project/list', {
			headers: {
				'Authorization': `ApiKey ${apiKey.value}`
			}
		})
		.catch(err => err.response)

		expect(res.status).toEqual(200)
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
