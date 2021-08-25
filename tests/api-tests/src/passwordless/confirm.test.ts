import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
import { Url, ConfirmPasswordlessPayload } from '@sdk-js/types'
import { ErrorCode } from '@sdk-js/error'
import { PROJECT_ID } from '../utils/env'
import {
	makeCreateSession,
	makeCreateToken,
	makeResetPasswordless,
} from '../utils/passwordless'

import { v4 as uuid } from 'uuid'
import * as bcrypt from 'bcryptjs'

const SALT = bcrypt.genSaltSync(10);
const EMAIL = 'michael+test_passwordless_confirm@riezler.dev'
const USER_ID = '75b83573-d43a-420c-9037-9a09fd4cb892'
const SESSION_ID = '1b3fa20a-f568-4eec-9948-6bf3d2215f52'
const TOKEN = 'random-token'
const HASHED_TOKEN = bcrypt.hashSync(TOKEN, SALT)
const KEYS = generateKeyPair()

let createToken = makeCreateToken(
	USER_ID,
	EMAIL,
	HASHED_TOKEN,
	PROJECT_ID,
	SESSION_ID
)

let createSession = makeCreateSession(
	SESSION_ID,
	PROJECT_ID,
	USER_ID,
	KEYS.publicKey,
)

let resetPasswordless = makeResetPasswordless(
	USER_ID,
	SESSION_ID,
	createSession,
)

beforeAll(createUser)
beforeEach(resetPasswordless)
afterAll(cleanUp)

describe("Confirm Passwordless", () => {
	test("returns ok for valid token", async () => {
		let id = await createToken()
		
		let payload: ConfirmPasswordlessPayload = {
			id,
			token: TOKEN
		}

		let res = await Http
			.post(Url.PasswordlessConfim, payload)
			.catch(err => err.response)

		expect(res.status).toBe(200)

		let { rows } = await Db.query(`
			select confirmed
			     , is_valid
			  from passwordless
			 where id = $1
		`, [id])

		let token = rows[0]

		expect(token.confirmed).toBe(true)
		expect(token.is_valid).toBe(true)
	})


	test("fails when token is invalid", async () => {
		let id = await createToken()

		await Db.query(`
			update passwordless
			   set is_valid = false
			 where id = $1 
		`, [id])
		
		let payload: ConfirmPasswordlessPayload = {
			id,
			token: TOKEN
		}

		let res = await Http
			.post(Url.PasswordlessConfim, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.PasswordlessInvalidToken)
	})


	test("fails when token does not match", async () => {
		let id = await createToken()
		
		let payload: ConfirmPasswordlessPayload = {
			id,
			token: `wrong-${TOKEN}`
		}

		let res = await Http
			.post(Url.PasswordlessConfim, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.PasswordlessInvalidToken)
	})


	test("fails when token is expired", async () => {
		let id = await createToken()

		await Db.query(`
			update passwordless
			   set created_at = $2
			 where id = $1 
		`, [id, new Date(Date.now() - 32 * 60 * 1000)])
		
		let payload: ConfirmPasswordlessPayload = {
			id,
			token: TOKEN
		}

		let res = await Http
			.post(Url.PasswordlessConfim, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.PasswordlessTokenExpire)
	})


	test("returns not found when id is wrong", async () => {
		await createToken()
		
		let payload: ConfirmPasswordlessPayload = {
			id: uuid(),
			token: TOKEN
		}

		let res = await Http
			.post(Url.PasswordlessConfim, payload)
			.catch(err => err.response)

		expect(res.status).toBe(404)
		expect(res.data.code).toBe(ErrorCode.NotFound)
	})
})

async function cleanUp() {
	return Db.query(`
		delete from users
		 where id = $1 
	`, [USER_ID])
}

function createUser() {
	return Db.query(`
		insert into users(id, email, project_id, provider_id)
		values($1, $2, $3, 'link')
		on conflict (id)
		   do nothing
	`, [USER_ID, EMAIL, PROJECT_ID])
}
