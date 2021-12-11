import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
import SessionResponseSchema from '../utils/schema/session-response'

import { v4 as uuid } from 'uuid'
import * as bcrypt from 'bcryptjs'
import * as argon2 from 'argon2'

import { Url, EmailPasswordPayload } from '@sdk-js/types'
import { ErrorCode } from '@sdk-js/error'
import { PROJECT_ID } from '../utils/env'

const SALT = bcrypt.genSaltSync(10);
const EMAIL = 'api.test+sign_in_email_password@vulpo.dev'
const PASSWORD = 'password'

beforeEach(createUser)
afterAll(cleanUp)
afterAll(() => Db.end())

describe("Sign In: Email and Password", () => {
	test("user can sign in", async () => {

		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: EMAIL,
			password: PASSWORD,
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid()
		}

		let res = await Http.post(Url.SignIn, payload)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = SessionResponseSchema.validate(res.data)
		expect(body).toBeTruthy()
	})

	test("migrates password hash", async () => {

		await Db.query(`
			update passwords
			   set alg = 'bcrypt'
			     , hash = $1
			  from users
			 where passwords.user_id = users.id
			   and users.email = $2
			   and users.project_id = $3

		`, [bcrypt.hashSync(PASSWORD, SALT), EMAIL, PROJECT_ID])

		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: EMAIL,
			password: PASSWORD,
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid()
		}

		let res = await Http.post(Url.SignIn, payload)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = SessionResponseSchema.validate(res.data)
		expect(body).toBeTruthy()

		let { rows } = await Db.query(`
			select passwords.hash
			  from users
			  join passwords on passwords.user_id = users.id
			 where users.email = $1
			   and users.project_id = $2 
		`, [payload.email, PROJECT_ID])

		expect(rows.length).toEqual(1)
		let row = rows[0]

		let passwordSet = await argon2.verify(row.hash, PASSWORD)
		expect(passwordSet).toBeTruthy()
	})


	test("formats email", async () => {

		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: `  ${EMAIL.toUpperCase()}   `,
			password: PASSWORD,
			public_key: Array.from(Buffer.from(publicKey)),
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
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid()
		}

		let res = await Http
			.post(Url.SignIn, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.InvalidEmailPassword)
	})


	test("fails for wrong email", async () => {
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: `wrong-${EMAIL}`,
			password: PASSWORD,
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid()
		}

		let res = await Http
			.post(Url.SignIn, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.InvalidEmailPassword)
	})


	test("fails for disabled user", async () => {

		await Db.query(`
			update users
			   set state = 'Disabled'
			 where email = $1
			   and project_id = $2 
		`, [EMAIL, PROJECT_ID])

		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: EMAIL,
			password: PASSWORD,
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid()
		}

		let res = await Http
			.post(Url.SignIn, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.UserDisabled)
	})
})


async function createUser() {

	await Db.query(`
		delete from users
		 where email = $1
		   and project_id = $2
	`, [EMAIL, PROJECT_ID])

	let { rows } = await Db.query(`
		insert into users(email, project_id, provider_id)
		values($1, $2, 'email')
		returning id
	`, [EMAIL, PROJECT_ID])

	let { id } = rows[0]
	let password = await argon2.hash(PASSWORD, { type: argon2.argon2id })

	await Db.query(`
		insert into passwords(user_id, alg, hash)
		values($1, 'argon2id', $2)
		on conflict do nothing
	`, [id, password])
}

function cleanUp() {
	return Db.query(`
		delete from users
		 where email = $1
		   and project_id = $2
	`, [EMAIL, PROJECT_ID])
}