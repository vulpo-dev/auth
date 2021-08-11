import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
import SessionResponseSchema from '../utils/schema/session-response'

import uuid from 'uuid/v4'
import * as bcrypt from 'bcryptjs'

import { Url, EmailPasswordPayload } from '@sdk-js/types'
import { ErrorCode } from '@sdk-js/error'
import { project } from '@seeds/data/projects'

const SALT = bcrypt.genSaltSync(10);
const EMAIL = 'savanna.stanton+test_sign_in@ethereal.email'
const PASSWORD = 'password'

beforeEach(() => {
	return Db.query(`
		insert into users(email, password, project_id, provider_id)
		values($1, $2, $3, 'email')
		on conflict (email, project_id)
		   do update set password = excluded.password
	`, [EMAIL, bcrypt.hashSync(PASSWORD, SALT), project.id])
})

afterAll(() => {
	return Db.query(`
		delete from users
		 where email = $1
		   and project_id = $2
	`, [EMAIL, project.id])
})

describe("Sign In: Email and Password", () => {
	test("user can sign in", async () => {

		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: EMAIL,
			password: PASSWORD,
			public_key: publicKey,
			session: uuid()
		}

		let res = await Http.post(Url.SignIn, payload)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = SessionResponseSchema.validate(res.data)
		expect(body).toBeTruthy()
	})

	test("formats email", async () => {

		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: `  ${EMAIL.toUpperCase()}   `,
			password: PASSWORD,
			public_key: publicKey,
			session: uuid()
		}

		let res = await Http.post(Url.SignIn, payload)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = SessionResponseSchema.validate(res.data)
		expect(body).toBeTruthy()
	})

	test("fails for wrong password", async () => {
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: EMAIL,
			password: `${PASSWORD}-wrong`,
			public_key: publicKey,
			session: uuid()
		}

		let res = await Http
			.post(Url.SignIn, payload)
			.catch(err => err.response)

		expect(res.status).toBe(500)
		expect(res.data.code).toBe(ErrorCode.InvalidEmailPassword)
	})

	test("fails for wrong email", async () => {
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: `wrong-${EMAIL}`,
			password: PASSWORD,
			public_key: publicKey,
			session: uuid()
		}

		let res = await Http
			.post(Url.SignIn, payload)
			.catch(err => err.response)

		expect(res.status).toBe(500)
		expect(res.data.code).toBe(ErrorCode.InvalidEmailPassword)
	})

	test("fails for disabled user", async () => {

		await Db.query(`
			update users
			   set disabled = true
			 where email = $1
			   and project_id = $2 
		`, [EMAIL, project.id])

		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: EMAIL,
			password: PASSWORD,
			public_key: publicKey,
			session: uuid()
		}

		let res = await Http
			.post(Url.SignIn, payload)
			.catch(err => err.response)

		expect(res.status).toBe(500)
		expect(res.data.code).toBe(ErrorCode.UserDisabled)
	})
})