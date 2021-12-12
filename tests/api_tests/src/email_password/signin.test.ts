import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
import SessionResponseSchema from '../utils/schema/session-response'
import { CreatedUser, createUser } from '../utils/user'

import { v4 as uuid } from 'uuid'
import * as bcrypt from 'bcryptjs'
import * as argon2 from 'argon2'

import { Url, EmailPasswordPayload, UserState } from '@sdk-js/types'
import { ErrorCode } from '@sdk-js/error'

const SALT = bcrypt.genSaltSync(10);
const PASSWORD = 'password'

afterAll(() => Db.end())

let getUser = () => createUser({ password: PASSWORD })

describe("Sign In: Email and Password", () => {
	test("user can sign in", async () => {
		let user = await getUser()
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: user.email,
			password: user.password,
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid()
		}

		let res = await Http.post(Url.SignIn, payload)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = SessionResponseSchema.validate(res.data)
		expect(body).toBeTruthy()
	})

	test("user can sign in with PBKDF2 hash", async () => {
		let user = await getUser()
		await setPassword(user, 'pbkdf2', '$pbkdf2-sha256$i=10000,l=32$FAUjiC9C1E5CSTWydX3GoQ$kGvx5y8WgpZrSnKmYkYBqelHvLA7j3Kmo6f7pD8Fsjw')

		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: user.email,
			password: user.password,
			public_key: Array.from(Buffer.from(publicKey)),
			session: uuid()
		}

		let res = await Http
			.post(Url.SignIn, payload)
			.catch(err => err.response)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = SessionResponseSchema.validate(res.data)
		expect(body).toBeTruthy()
	})

	test("migrates password hash", async () => {
		let user = await getUser()
		await setPassword(user, 'bcrypt', bcrypt.hashSync(user.password, SALT))

		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: user.email,
			password: user.password,
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
		`, [payload.email, user.project])

		expect(rows.length).toEqual(1)
		let row = rows[0]

		let passwordSet = await argon2.verify(row.hash, user.password)
		expect(passwordSet).toBeTruthy()
	})


	test("formats email", async () => {
		let user = await getUser()
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: `  ${user.email.toUpperCase()}   `,
			password: user.password,
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
		let user = await getUser()
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: user.email,
			password: `${user.password}-wrong`,
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
		let user = await getUser()
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: `wrong-${user.email}`,
			password: user.password,
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
		let user = await getUser()

		await Db.query(`
			update users
			   set state = $2
			 where id = $1
		`, [user.id, UserState.Disabled])

		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: user.email,
			password: user.password,
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


async function setPassword(user: CreatedUser, alg: string, hash: string) {
	await Db.query(`
		update passwords
		   set alg = $1
		     , hash = $2
		  from users
		 where passwords.user_id = users.id
		   and users.email = $3
		   and users.project_id = $4

	`, [alg, hash, user.email, user.project])
}