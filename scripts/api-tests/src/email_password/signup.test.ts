import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
import SessionResponseSchema from '../utils/schema/session-response'

import { v4 as uuid } from 'uuid'

import { Url, EmailPasswordPayload } from '@sdk-js/types'
import { ErrorCode } from '@sdk-js/error'
import { PROJECT_ID } from '../utils/env'

const EMAIL = 'michael+test_sign_up@riezler.dev'

beforeEach(cleanUp)
afterAll(cleanUp)

describe("Sign Up: Email and Password", () => {

	test("create new user", async (): Promise<void> => {

		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: EMAIL,
			password: 'password',
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid()
		}

		let res = await Http.post(Url.SignUp, payload)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = SessionResponseSchema.validate(res.data)

		expect(body).toBeTruthy()

		let userExist = await userCreated()
		expect(userExist).toBeTruthy()
	})


	test("formats email", async () => {

		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: `  ${EMAIL.toUpperCase()}   `,
			password: 'password',
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid()
		}

		let res = await Http.post(Url.SignUp, payload)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = SessionResponseSchema.validate(res.data)
		expect(body).toBeTruthy()
	})


	test("fails when password is to short", async () => {
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: EMAIL,
			password: '1234567',
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid()
		}

		let res = await Http
			.post(Url.SignUp, payload)
			.catch(err => err.response)

		expect(res.status).toBe(500)
		expect(res.data.code).toBe(ErrorCode.PasswordMinLength)
	})


	test("fails when password is to long", async () => {
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: EMAIL,
			password: '_3>pKuBc,FMD;m(WK=+=g<GSda{}$Tk0IL#>8]BWcQy.J3?/hQ{4q(hH_c*iLax^!',
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid()
		}

		let res = await Http
			.post(Url.SignUp, payload)
			.catch(err => err.response)

		expect(res.status).toBe(500)
		expect(res.data.code).toBe(ErrorCode.PasswordMaxLength)
	})


	test("fails when user exists", async () => {
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: EMAIL,
			password: 'password',
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid()
		}

		await Http.post(Url.SignUp, payload)

		let res = await Http
			.post(Url.SignUp, payload)
			.catch(err => err.response)

		expect(res.status).toBe(500)
		expect(res.data.code).toBe(ErrorCode.InvalidEmailPassword)
	})

})


function cleanUp() {
	return Db.query(`
		delete from users
		 where email = $1
		   and project_id = $2
	`, [EMAIL, PROJECT_ID])
}


async function userCreated(): Promise<boolean> {
	let result = await Db.query(`
		select count(email)
		  from users
		 where email = $1
		   and project_id = $2
	`, [EMAIL, PROJECT_ID])

	let [row] = result.rows
	return parseInt(row.count, 10) === 1
}
