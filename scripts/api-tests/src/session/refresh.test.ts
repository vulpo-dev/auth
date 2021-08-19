import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
import { Url, RefreshAccessTokenPayload } from '@sdk-js/types'
import { ErrorCode } from '@sdk-js/error'
import { PROJECT_ID } from '../utils/env'
import {
	makeCreateSession,
	makeCleanUp,
	makeCreateUser,
} from '../utils/passwordless'
import SessionResponseSchema from '../utils/schema/session-response'

import { v4 as uuid } from 'uuid'
import * as jwt from 'jsonwebtoken'
import { Algorithm } from 'jsonwebtoken'
import { differenceInDays } from 'date-fns'

const EMAIL = 'michael+test_session_refresh@riezler.dev'
const USER_ID = '7fc30b8f-8647-4d4b-9ce3-28ae53cbd2e3'
const SESSION_ID = 'cfebb19b-2107-43d4-8da3-c7fc2ed153a7'
const KEYS = generateKeyPair()

let createSession = makeCreateSession(
	SESSION_ID,
	PROJECT_ID,
	USER_ID,
	KEYS.publicKey,
)

let createUser = makeCreateUser(
	USER_ID,
	EMAIL,
	PROJECT_ID
)

beforeAll(createUser)
beforeEach(async () => {
	await Db.query(`
		delete from sessions
		 where id = $1
	`, [SESSION_ID])

	return createSession()
})
afterAll(makeCleanUp(USER_ID))

describe("Session Refresh", () => {
	test("returns session data for valid token", async () => {

		await Db.query(`
			update sessions
			   set expire_at = $2
			 where id = $1 
		`, [SESSION_ID, new Date(Date.now() + 30 * 60 * 1000)])

		let token = generateAccessToken({
			payload: ratPayload()
		})

		let payload: RefreshAccessTokenPayload = {
			value: token
		}

		let url = Url.TokenRefresh.replace(':session', SESSION_ID)

		let res = await Http
			.post(url, payload)
			.catch(err => err.response)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = SessionResponseSchema.validate(res.data)
		expect(body).toBeTruthy()

		let newSession = await getSession()
		let expireIn = differenceInDays(
			new Date(newSession.expire_at),
			new Date(),
		)

		expect(expireIn === 29 || expireIn === 30).toBe(true)
	})

	test("returns forbidden for invalid token", async () => {
		let invalidKeys = generateKeyPair()

		let token = generateAccessToken({
			payload: ratPayload(),
			privateKey: invalidKeys.privateKey,
		})

		let payload: RefreshAccessTokenPayload = {
			value: token
		}

		let url = Url.TokenRefresh.replace(':session', SESSION_ID)

		let res = await Http
			.post(url, payload)
			.catch(err => err.response)

		expect(res.status).toBe(403)
		expect(res.data.code).toBe(ErrorCode.NotAllowed)
	})

	test("returns session/expired", async () => {
		await Db.query(`
			update sessions
			   set expire_at = $2
			 where id = $1 
		`, [SESSION_ID, new Date(Date.now() - 30 * 60 * 1000)])

		let token = generateAccessToken({
			payload: ratPayload(),
		})

		let payload: RefreshAccessTokenPayload = {
			value: token
		}

		let url = Url.TokenRefresh.replace(':session', SESSION_ID)

		let res = await Http
			.post(url, payload)
			.catch(err => err.response)

		expect(res.status).toBe(500)
		expect(res.data.code).toBe(ErrorCode.SessionExpired)
	})

	test("returns forbidden when token is reused", async () => {

		let accessToken = ratPayload()

		let token = generateAccessToken({
			payload: accessToken
		})

		let payload: RefreshAccessTokenPayload = {
			value: token
		}

		let url = Url.TokenRefresh.replace(':session', SESSION_ID)

		await Http
			.post(url, payload)

		let res = await Http
			.post(url, payload)
			.catch(err => err.response)

		expect(res.status).toBe(403)
		expect(res.data.code).toBe(ErrorCode.NotAllowed)
	})


	test("returns forbidden for missing jti claim", async () => {

		let accessToken = ratPayload()

		let token = generateAccessToken({
			payload: {
				exp: accessToken.exp
			}
		})

		let payload: RefreshAccessTokenPayload = {
			value: token
		}

		let url = Url.TokenRefresh.replace(':session', SESSION_ID)

		let res = await Http
			.post(url, payload)
			.catch(err => err.response)

		expect(res.status).toBe(403)
		expect(res.data.code).toBe(ErrorCode.NotAllowed)
	})


	test("returns forbidden for missing exp claim", async () => {

		let accessToken = ratPayload()

		let token = generateAccessToken({
			payload: {
				jti: accessToken.jti
			}
		})

		let payload: RefreshAccessTokenPayload = {
			value: token
		}

		let url = Url.TokenRefresh.replace(':session', SESSION_ID)

		let res = await Http
			.post(url, payload)
			.catch(err => err.response)

		expect(res.status).toBe(403)
		expect(res.data.code).toBe(ErrorCode.NotAllowed)
	})


	test("returns bad_request for invalid algorithm", async () => {

		let accessToken = ratPayload()

		let token = generateAccessToken({
			payload: accessToken,
			algorithm: 'HS256',
			privateKey: 'fuuu',
		})

		let payload: RefreshAccessTokenPayload = {
			value: token
		}

		let url = Url.TokenRefresh.replace(':session', SESSION_ID)

		let res = await Http
			.post(url, payload)
			.catch(err => err.response)

		expect(res.status).toBe(500)
		expect(res.data.code).toBe(ErrorCode.BadRequest)
	})


	test("returns forbidden for expired token", async () => {

		let accessToken = ratPayload()

		let token = generateAccessToken({
			payload: {
				...accessToken,
				exp: new Date(Date.now() - 1 * 60 * 1000)
			}
		})

		let payload: RefreshAccessTokenPayload = {
			value: token
		}

		let url = Url.TokenRefresh.replace(':session', SESSION_ID)

		let res = await Http
			.post(url, payload)
			.catch(err => err.response)

		expect(res.status).toBe(403)
		expect(res.data.code).toBe(ErrorCode.NotAllowed)
	})


	test("returns forbidden for session without user", async () => {

		await Db.query(`
			update sessions
			   set user_id = null
			 where id = $1
		`, [SESSION_ID])

		let accessToken = ratPayload()

		let token = generateAccessToken({
			payload: accessToken
		})

		let payload: RefreshAccessTokenPayload = {
			value: token
		}

		let url = Url.TokenRefresh.replace(':session', SESSION_ID)

		let res = await Http
			.post(url, payload)
			.catch(err => err.response)

		expect(res.status).toBe(403)
		expect(res.data.code).toBe(ErrorCode.NotAllowed)
	})
})

type GenerateAccessToken = {
	payload: any;
	algorithm?: Algorithm;
	privateKey?: string;
}

function generateAccessToken({
	payload,
	algorithm = 'RS256',
	privateKey = KEYS.privateKey,
}: GenerateAccessToken) {
	return jwt.sign(
		JSON.stringify(payload),
		privateKey,
		{
			algorithm,
			header: {
				typ: "JWT",
				alg: algorithm,
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

type Session = {
	expire_at: string;
}

async function getSession(): Promise<Session> {
	let { rows } = await Db.query(`
		select expire_at
		  from sessions
		 where id = $1
	`, [SESSION_ID])

	return rows[0]
}