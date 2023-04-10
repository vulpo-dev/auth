import { v4 as uuid } from 'uuid'
import { ErrorCode, Url, EmailPasswordPayload, UserState } from '@vulpo-dev/auth-sdk'

import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
import SessionResponseSchema from '../utils/schema/session-response'
import { getEmail } from '../utils/user'
import { PROJECT_ID } from '../utils/env'

afterAll(() => Db.end())

describe("Sign Up: Email and Password", () => {

	test("create new user", async (): Promise<void> => {
		let email = getEmail()
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email,
			password: 'password',
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid(),
			device_languages: ['de-AT', 'de'],
		}

		let res = await Http.post(Url.SignUp, payload)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = SessionResponseSchema.validate(res.data)

		expect(body).toBeTruthy()

		let { rows } = await Db.query(`
			select device_languages
			     , state 
			  from users
			 where email = $1
			   and project_id = $2
		`, [email, PROJECT_ID])

		let createdUser = rows[0]
		expect(createdUser).toBeTruthy()
		expect(createdUser.device_languages).toEqual(['de-AT', 'de'])
		expect(createdUser.state).toEqual(UserState.Active)


		let { rows: sessions } = await Db.query(`
			select public_key
			  from sessions
			 where id = $1
		`, [payload.session])

		expect(Array.from(Buffer.from(sessions[0].public_key))).toEqual(payload.public_key)

	})


	test("formats email", async () => {
		let email = getEmail()
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: `  ${email.toUpperCase()}   `,
			password: 'password',
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid(),
			device_languages: ['de-AT', 'de'],
		}

		let res = await Http.post(Url.SignUp, payload)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = SessionResponseSchema.validate(res.data)
		expect(body).toBeTruthy()

		let { rows } = await Db.query(`
			select email
			  from users
			 where email = $1
			   and project_id = $2 
		`, [email, PROJECT_ID])

		expect(rows.length).toEqual(1)

		expect(rows[0].email).toEqual(email)
	})


	test("fails when password is to short", async () => {
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: getEmail(),
			password: '1234567',
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid(),
			device_languages: ['de-AT', 'de'],
		}

		let res = await Http
			.post(Url.SignUp, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.PasswordMinLength)
	})


	test("fails when password is to long", async () => {
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: getEmail(),
			password: '_3>pKuBc,FMD;m(WK=+=g<GSda{}$Tk0IL#>8]BWcQy.J3?/hQ{4q(hH_c*iLax^!',
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid(),
			device_languages: ['de-AT', 'de'],
		}

		let res = await Http
			.post(Url.SignUp, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.PasswordMaxLength)
	})


	test("fails when user exists", async () => {
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: getEmail(),
			password: 'password',
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid(),
			device_languages: ['de-AT', 'de'],
		}

		await Http.post(Url.SignUp, payload)

		let res = await Http
			.post(Url.SignUp, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.UserDuplicate)
	})

})
