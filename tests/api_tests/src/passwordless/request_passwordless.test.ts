import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
import PasswordlessResponseSchema from '../utils/schema/passwordless-response'

import { v4 as uuid } from 'uuid'

import { Url, RequestPasswordlessPayload, UserState } from '@sdk-js/types'
import { ErrorCode } from '@sdk-js/error'
import { PROJECT_ID } from '../utils/env'

const EMAIL = 'api.test+passwordless@vulpo.dev'


beforeEach(cleanUp)
afterAll(cleanUp)
afterAll(() => Db.end())

describe("Request Passwordless", () => {
	test("create passwordless token when user does not exist", async () => {
		let { publicKey } = generateKeyPair()

		let payload: RequestPasswordlessPayload = {
			email: EMAIL,
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid(),
			device_languages: ['de-AT', 'de'],
		}

		let res = await Http
			.post(Url.Passwordless, payload)
			.catch(err => err.response)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = PasswordlessResponseSchema.validate(res.data)
		expect(body).toBeTruthy()

		let token = await getPasswordlessToken()
		expect(token).toBeTruthy()
	})


	test("create passwordless token when user does exist", async () => {
		await createUser(false)

		let { publicKey } = generateKeyPair()

		let payload: RequestPasswordlessPayload = {
			email: EMAIL,
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid(),
			device_languages: ['de-AT', 'de'],
		}

		let res = await Http
			.post(Url.Passwordless, payload)
			.catch(err => err.response)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = PasswordlessResponseSchema.validate(res.data)
		expect(body).toBeTruthy()

		let token = await getPasswordlessToken()
		expect(token).toBeTruthy()
	})


	test("fails when user is disabled", async () => {
		await createUser(true)

		let { publicKey } = generateKeyPair()

		let payload: RequestPasswordlessPayload = {
			email: EMAIL,
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid(),
			device_languages: ['de-AT', 'de'],
		}

		let res = await Http
			.post(Url.Passwordless, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.UserDisabled)
	})


	test("formats email", async () => {
		await createUser(true)

		let { publicKey } = generateKeyPair()

		let payload: RequestPasswordlessPayload = {
			email: `   ${EMAIL.toUpperCase()}   `,
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid(),
			device_languages: ['de-AT', 'de'],
		}

		let res = await Http
			.post(Url.Passwordless, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.UserDisabled)
	})
})


function cleanUp() {
	let removeToken = Db.query(`
		delete from passwordless
		 where email = $1
		   and project_id = $2
	`, [EMAIL, PROJECT_ID])

	let removeUser = Db.query(`
		delete from users
		 where email = $1
		   and project_id = $2
	`, [EMAIL, PROJECT_ID])

	return Promise.all([
		removeUser,
		removeToken,
	])
}

async function getPasswordlessToken() {
	let { rows } = await Db.query(`
		select *
		  from passwordless
		 where email = $1
		   and project_id = $2
	`, [EMAIL, PROJECT_ID])
	return rows[0] ?? null
}


function createUser(disabled = false) {
	return Db.query(`
		insert into users
			( email
			, project_id
			, provider_id
			, state
			)
		values($1, $2, 'link', $3)
	`, [EMAIL, PROJECT_ID, disabled ? UserState.Disabled : UserState.Active])
}