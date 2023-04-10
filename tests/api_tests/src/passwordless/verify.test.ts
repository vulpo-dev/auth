import { Url, VerifyPasswordlessPayload, ErrorCode } from '@vulpo-dev/auth-sdk'
import { v4 as uuid } from 'uuid'
import * as jwt from 'jsonwebtoken'
import { Algorithm } from 'jsonwebtoken'

import Db from '../utils/db'
import Http from '../utils/http'
import { createToken, createSession, CreatedSession } from '../utils/passwordless'
import { createUser } from '../utils/user'
import SessionResponseSchema from '../utils/schema/session-response'


afterAll(() => Db.end())

describe("Verify Passwordless", () => {
	test("returns session data for valid token/existing user", async () => {
		let user = await createUser()
		let session = await createSession({ user })
		let token = await createToken({ user, session })
		let accessToken = generateAccessToken({ session })

		await Db.query(`
			update passwordless
			   set confirmed = true
			 where id = $1 
		`, [token.id])

		let payload: VerifyPasswordlessPayload = {
			id: token.id,
			session: session.id,
			token: accessToken,
			device_languages: ['de-AT', 'de'],
		}

		let res = await Http
			.post(Url.PasswordlessVerify, payload)
			.catch(err => err.response)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = SessionResponseSchema.validate(res.data)
		expect(body).toBeTruthy()

		let { rows: sessions } = await Db.query(`
			select public_key
			  from sessions
			 where id = $1
		`, [payload.session])

		expect(Array.from(Buffer.from(sessions[0].public_key)))
			.toEqual(Array.from(Buffer.from(session.keys.publicKey)))
	})

	test("returns passwordless/await_confirm while token is not confirmed", async () => {
		let user = await createUser()
		let session = await createSession({ user })
		let token = await createToken({ user, session })
		let accessToken = generateAccessToken({ session })

		let payload: VerifyPasswordlessPayload = {
			id: token.id,
			session: session.id,
			token: accessToken,
			device_languages: ['de-AT', 'de'],
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
		`, [token.id])

		let res = await Http
			.post(Url.PasswordlessVerify, payload)
			.catch(err => err.response)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = SessionResponseSchema.validate(res.data)
		expect(body).toBeTruthy()
	})


	test("returns passwordless/invalid_token when token is invalid", async () => {
		let user = await createUser()
		let session = await createSession({ user })
		let token = await createToken({ user, session })
		let accessToken = generateAccessToken({ session })

		await Db.query(`
			update passwordless
			   set confirmed = true
			     , is_valid = false
			 where id = $1 
		`, [token.id])

		let payload: VerifyPasswordlessPayload = {
			id: token.id,
			session: session.id,
			token: accessToken,
			device_languages: ['de-AT', 'de'],
		}

		let res = await Http
			.post(Url.PasswordlessVerify, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400);
		expect(res.data.code).toBe(ErrorCode.PasswordlessInvalidToken)
	})


	test("returns passwordless/token_expire when token is expired", async () => {
		let user = await createUser()
		let session = await createSession({ user })
		let token = await createToken({ user, session })
		let accessToken = generateAccessToken({ session })

		await Db.query(`
			update passwordless
			   set confirmed = true
			     , created_at = $2
			 where id = $1 
		`, [token.id, new Date(Date.now() - 32 * 60 * 1000)])

		let payload: VerifyPasswordlessPayload = {
			id: token.id,
			session: session.id,
			token: accessToken,
			device_languages: ['de-AT', 'de'],
		}

		let res = await Http
			.post(Url.PasswordlessVerify, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400);
		expect(res.data.code).toBe(ErrorCode.PasswordlessTokenExpire)
	})


	test("returns forbidden when auth token is expired", async () => {
		let user = await createUser()
		let session = await createSession({ user })
		let token = await createToken({ user, session })
		let accessToken = generateAccessToken({ session, minutes: -5 })

		await Db.query(`
			update passwordless
			   set confirmed = true
			 where id = $1 
		`, [token.id])

		let payload: VerifyPasswordlessPayload = {
			id: token.id,
			session: session.id,
			token: accessToken,
			device_languages: ['de-AT', 'de'],
		}

		let res = await Http
			.post(Url.PasswordlessVerify, payload)
			.catch(err => err.response)

		expect(res.status).toBe(403);
		expect(res.data.code).toBe(ErrorCode.NotAllowed)
	})


	test("returns passwordless/invalid_token when token is invalid", async () => {
		let user = await createUser()
		let session = await createSession({ user })
		let token = await createToken({ user, session })
		let accessToken = generateAccessToken({ session })

		await Db.query(`
			update passwordless
			   set confirmed = true
			     , is_valid = false
			 where id = $1 
		`, [token.id])

		let payload: VerifyPasswordlessPayload = {
			id: token.id,
			session: session.id,
			token: accessToken,
			device_languages: ['de-AT', 'de'],
		}

		let res = await Http
			.post(Url.PasswordlessVerify, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400);
		expect(res.data.code).toBe(ErrorCode.PasswordlessInvalidToken)
	})
})

type GenerateAccessToken = {
	minutes?: number;
	algorithm?: Algorithm;
	session: CreatedSession
} 

function generateAccessToken({
	session,
	minutes,
	algorithm = 'ES384',
}: GenerateAccessToken) {
	let payload = ratPayload(minutes)

	return jwt.sign(
		JSON.stringify(payload),
		session.keys.privateKey,
		{
			algorithm,
			header: {
				typ: "JWT",
				alg: algorithm,
			}
		}
	)
}

export function ratPayload(minutes = 10) {
	let now = new Date()
	let exp = Math.ceil(now.setMinutes(now.getMinutes() + minutes) / 1000)
	return {
		exp,
		jti: uuid()
	}
}
