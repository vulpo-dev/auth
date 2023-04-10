import { v4 as uuid } from 'uuid'
import { Url, RequestPasswordlessPayload, UserState, ErrorCode } from '@vulpo-dev/auth-sdk'

import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
import PasswordlessResponseSchema from '../utils/schema/passwordless-response'
import { createUser, getEmail } from '../utils/user'
import { PROJECT_ID } from '../utils/env'

afterAll(() => Db.end())

describe("Request Passwordless", () => {
	test("create passwordless token when user does not exist", async () => {
		let email = getEmail()
		let { publicKey } = generateKeyPair()

		let payload: RequestPasswordlessPayload = {
			email: email,
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

		let token = await getPasswordlessToken({ email, project: PROJECT_ID })
		expect(token).toBeTruthy()
	})


	test("create passwordless token when user does exist", async () => {
		let user = await createUser()

		let { publicKey } = generateKeyPair()

		let payload: RequestPasswordlessPayload = {
			email: user.email,
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

		let token = await getPasswordlessToken(user)
		expect(token).toBeTruthy()
	})


	test("fails when user is disabled", async () => {
		let user = await createUser({ state: UserState.Disabled })

		let { publicKey } = generateKeyPair()

		let payload: RequestPasswordlessPayload = {
			email: user.email,
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
		let user = await createUser({ state: UserState.Disabled })

		let { publicKey } = generateKeyPair()

		let payload: RequestPasswordlessPayload = {
			email: `   ${user.email.toUpperCase()}   `,
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

async function getPasswordlessToken({ email, project }) {
	let { rows } = await Db.query(`
		select *
		  from passwordless
		 where email = $1
		   and project_id = $2
	`, [email, project])
	return rows[0] ?? null
}
