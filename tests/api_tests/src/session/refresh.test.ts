import { Url, RefreshAccessTokenPayload, ErrorCode } from '@vulpo-dev/auth-sdk'
import { v4 as uuid } from 'uuid'
import * as jwt from 'jsonwebtoken'
import { Algorithm } from 'jsonwebtoken'
import { differenceInDays } from 'date-fns'

import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
import { PROJECT_ID } from '../utils/env'
import {
	makeCreateSession,
	makeCleanUp,
	makeCreateUser,
} from '../utils/passwordless'
import SessionResponseSchema from '../utils/schema/session-response'


const EMAIL = 'api.test+session_refresh@vulpo.dev'
const USER_ID = '7fc30b8f-8647-4d4b-9ce3-28ae53cbd2e3'
const KEYS = generateKeyPair()

let createSession = makeCreateSession(
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
afterAll(makeCleanUp(USER_ID))
afterAll(() => Db.end())

describe("Session Refresh", () => {
	test("returns session data for valid token", async () => {
		let sessionId = await createSession();

		await Db.query(`
			update sessions
			   set expire_at = $2
			 where id = $1 
		`, [sessionId, new Date(Date.now() + 30 * 60 * 1000)])

		let token = generateAccessToken({
			payload: ratPayload()
		})

		let payload: RefreshAccessTokenPayload = {
			value: token
		}

		let url = Url.TokenRefresh.replace(':session', sessionId)

		let res = await Http
			.post(url, payload)
			.catch(err => err.response)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = SessionResponseSchema.validate(res.data)
		expect(body).toBeTruthy()

		let newSession = await getSession(sessionId)
		let expireIn = differenceInDays(
			new Date(newSession.expire_at),
			new Date(),
		)

		expect(expireIn === 29 || expireIn === 30).toBe(true)
	})

	test("returns forbidden for invalid token", async () => {
		let sessionId = await createSession();
		let invalidKeys = generateKeyPair()

		let token = generateAccessToken({
			payload: ratPayload(),
			privateKey: invalidKeys.privateKey,
		})

		let payload: RefreshAccessTokenPayload = {
			value: token
		}

		let url = Url.TokenRefresh.replace(':session', sessionId)

		let res = await Http
			.post(url, payload)
			.catch(err => err.response)

		expect(res.status).toBe(403)
		expect(res.data.code).toBe(ErrorCode.NotAllowed)
	})

	test("returns session/expired", async () => {
		let sessionId = await createSession();

		await Db.query(`
			update sessions
			   set expire_at = $2
			 where id = $1 
		`, [sessionId, new Date(Date.now() - 30 * 60 * 1000)])

		let token = generateAccessToken({
			payload: ratPayload(),
		})

		let payload: RefreshAccessTokenPayload = {
			value: token
		}

		let url = Url.TokenRefresh.replace(':session', sessionId)

		let res = await Http
			.post(url, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.SessionExpired)
	})

	test("returns forbidden when token is reused", async () => {
		let sessionId = await createSession();
		let accessToken = ratPayload()

		let token = generateAccessToken({
			payload: accessToken
		})

		let payload: RefreshAccessTokenPayload = {
			value: token
		}

		let url = Url.TokenRefresh.replace(':session', sessionId)

		await Http
			.post(url, payload)

		let res = await Http
			.post(url, payload)
			.catch(err => err.response)

		expect(res.status).toBe(403)
		expect(res.data.code).toBe(ErrorCode.NotAllowed)
	})


	test("returns forbidden for missing jti claim", async () => {
		let sessionId = await createSession();
		let accessToken = ratPayload()

		let token = generateAccessToken({
			payload: {
				exp: accessToken.exp
			}
		})

		let payload: RefreshAccessTokenPayload = {
			value: token
		}

		let url = Url.TokenRefresh.replace(':session', sessionId)

		let res = await Http
			.post(url, payload)
			.catch(err => err.response)

		expect(res.status).toBe(403)
		expect(res.data.code).toBe(ErrorCode.NotAllowed)
	})


	test("returns forbidden for missing exp claim", async () => {
		let sessionId = await createSession();
		let accessToken = ratPayload()

		let token = generateAccessToken({
			payload: {
				jti: accessToken.jti
			}
		})

		let payload: RefreshAccessTokenPayload = {
			value: token
		}

		let url = Url.TokenRefresh.replace(':session', sessionId)

		let res = await Http
			.post(url, payload)
			.catch(err => err.response)

		expect(res.status).toBe(403)
		expect(res.data.code).toBe(ErrorCode.NotAllowed)
	})


	test("returns bad_request for invalid algorithm", async () => {
		let sessionId = await createSession();
		let accessToken = ratPayload()

		let token = generateAccessToken({
			payload: accessToken,
			algorithm: 'HS256',
			privateKey: 'fuuu',
		})

		let payload: RefreshAccessTokenPayload = {
			value: token
		}

		let url = Url.TokenRefresh.replace(':session', sessionId)

		let res = await Http
			.post(url, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.BadRequest)
	})


	test("returns forbidden for expired token", async () => {
		let sessionId = await createSession();
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

		let url = Url.TokenRefresh.replace(':session', sessionId)

		let res = await Http
			.post(url, payload)
			.catch(err => err.response)

		expect(res.status).toBe(403)
		expect(res.data.code).toBe(ErrorCode.NotAllowed)
	})


	test("returns forbidden for session without user", async () => {
		let sessionId = await createSession();
		await Db.query(`
			update sessions
			   set user_id = null
			 where id = $1
		`, [sessionId])

		let accessToken = ratPayload()

		let token = generateAccessToken({
			payload: accessToken
		})

		let payload: RefreshAccessTokenPayload = {
			value: token
		}

		let url = Url.TokenRefresh.replace(':session', sessionId)

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
	algorithm = 'ES384',
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

async function getSession(sessionId: string): Promise<Session> {
	let { rows } = await Db.query(`
		select expire_at
		  from sessions
		 where id = $1
	`, [sessionId])

	return rows[0]
}