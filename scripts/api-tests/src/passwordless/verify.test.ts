import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
import { Url, VerifyPasswordlessPayload } from '@sdk-js/types'
import { ErrorCode } from '@sdk-js/error'
import { PROJECT_ID } from '../utils/env'
import {
	makeCreateSession,
	makeCreateToken,
	makeResetPasswordless,
	makeCleanUp,
	makeCreateUser,
} from '../utils/passwordless'
import SessionResponseSchema from '../utils/schema/session-response'

import uuid from 'uuid/v4'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

const SALT = bcrypt.genSaltSync(10);
const EMAIL = 'michael+test_passwordless_verify@riezler.dev'
const USER_ID = 'a7f60eb2-aafe-42cc-bfa3-6964140555cc'
const SESSION_ID = 'ee78fe6e-c997-4eff-9af7-24c57ed1ab76'
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

let createUser = makeCreateUser(
	USER_ID,
	EMAIL,
	PROJECT_ID
)

beforeAll(createUser)
beforeEach(resetPasswordless)
afterAll(makeCleanUp(USER_ID))

describe("Verify Passwordless", () => {
	test("returns session data for valid token", async () => {
		let id = await createToken()
		let token = generateAccessToken(ratPayload())

		await Db.query(`
			update passwordless
			   set confirmed = true
			 where id = $1 
		`, [id])

		let payload: VerifyPasswordlessPayload = {
			id,
			session: SESSION_ID,
			token,
		}

		let res = await Http
			.post(Url.PasswordlessVerify, payload)
			.catch(err => err.response)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = SessionResponseSchema.validate(res.data)
		expect(body).toBeTruthy()
	})


	test("returns passwordless/await_confirm while token is not confirmed", async () => {
		let id = await createToken()
		let token = generateAccessToken(ratPayload())

		let payload: VerifyPasswordlessPayload = {
			id,
			session: SESSION_ID,
			token,
		}

		let wait = await Http
			.post(Url.PasswordlessVerify, payload)
			.catch(err => err.response)

		expect(wait.status).toBe(401);
		expect(wait.data.code).toBe(ErrorCode.PasswordlessAwaitConfirm)

		await Db.query(`
			update passwordless
			   set confirmed = true
			 where id = $1 
		`, [id])

		let res = await Http
			.post(Url.PasswordlessVerify, payload)
			.catch(err => err.response)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = SessionResponseSchema.validate(res.data)
		expect(body).toBeTruthy()
	})


	test("returns passwordless/invalid_token when token is invalid", async () => {
		let id = await createToken()
		let token = generateAccessToken(ratPayload())

		await Db.query(`
			update passwordless
			   set confirmed = true
			     , is_valid = false
			 where id = $1 
		`, [id])

		let payload: VerifyPasswordlessPayload = {
			id,
			session: SESSION_ID,
			token,
		}

		let res = await Http
			.post(Url.PasswordlessVerify, payload)
			.catch(err => err.response)

		expect(res.status).toBe(500);
		expect(res.data.code).toBe(ErrorCode.PasswordlessInvalidToken)
	})


	test("returns passwordless/token_expire when token is expired", async () => {
		let id = await createToken()
		let token = generateAccessToken(ratPayload())

		await Db.query(`
			update passwordless
			   set confirmed = true
			     , created_at = $2
			 where id = $1 
		`, [id, new Date(Date.now() - 32 * 60 * 1000)])

		let payload: VerifyPasswordlessPayload = {
			id,
			session: SESSION_ID,
			token,
		}

		let res = await Http
			.post(Url.PasswordlessVerify, payload)
			.catch(err => err.response)

		expect(res.status).toBe(500);
		expect(res.data.code).toBe(ErrorCode.PasswordlessTokenExpire)
	})


	test("returns forbidden when auth token is expired", async () => {
		let id = await createToken()
		let token = generateAccessToken(ratPayload(-5))

		await Db.query(`
			update passwordless
			   set confirmed = true
			 where id = $1 
		`, [id])

		let payload: VerifyPasswordlessPayload = {
			id,
			session: SESSION_ID,
			token,
		}

		let res = await Http
			.post(Url.PasswordlessVerify, payload)
			.catch(err => err.response)

		expect(res.status).toBe(403);
		expect(res.data.code).toBe(ErrorCode.NotAllowed)
	})


	test("returns passwordless/invalid_token when token is invalid", async () => {
		let id = await createToken()
		let token = generateAccessToken(ratPayload())

		await Db.query(`
			update passwordless
			   set confirmed = true
			     , is_valid = false
			 where id = $1 
		`, [id])

		let payload: VerifyPasswordlessPayload = {
			id,
			session: SESSION_ID,
			token,
		}

		let res = await Http
			.post(Url.PasswordlessVerify, payload)
			.catch(err => err.response)

		expect(res.status).toBe(500);
		expect(res.data.code).toBe(ErrorCode.PasswordlessInvalidToken)
	})
})

function generateAccessToken(payload: any, algorithm = 'RS256') {
	return jwt.sign(
		JSON.stringify(payload),
		KEYS.privateKey,
		{
			algorithm,
			header: {
				typ: "JWT"
			}
		}
	)
}

export function ratPayload(minutes = 5) {
	let now = new Date()
	let exp = Math.ceil(now.setMinutes(now.getMinutes() + minutes) / 1000)
	return {
		exp,
		jti: uuid()
	}
}
