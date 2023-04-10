import { v4 as uuid } from 'uuid'
import { Url, ErrorCode } from '@vulpo-dev/auth-sdk'

import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
import { PROJECT_ID } from '../utils/env'
import {
	makeCreateSession,
	makeCreateUser,
	makeCleanUp,
} from '../utils/passwordless'
import {
	makeGenerateAccessToken,
	makeGenerateInvalidAccessToken,
	ratPayload
} from '../utils/user'

const EMAIL = 'api.test+user_sign_out@vulpo.dev'
const USER_ID = 'df26e3cf-a5a0-4469-966a-a5dc9b273489'
const KEYS = generateKeyPair()
const INVALID_KEYS = generateKeyPair()

let createSession = makeCreateSession(PROJECT_ID, USER_ID, KEYS.publicKey)
let createUser = makeCreateUser(USER_ID, EMAIL, PROJECT_ID)
let generateAccessToken = makeGenerateAccessToken(KEYS.privateKey)
let generateInvalidAccessToken = makeGenerateInvalidAccessToken(INVALID_KEYS.privateKey)

beforeAll(createUser)
beforeEach(async () => {
	await Db.query(`
		delete from sessions
		 where user_id = $1
	`, [USER_ID])

	return createSession()
})
afterAll(makeCleanUp(USER_ID))
afterAll(() => Db.end())

describe("User Sign Out", () => {
	describe("current session", () => {
		test("Removes Session from DB", async () => {
			let sessionId = await createSession()
			let token = generateAccessToken({
				payload: ratPayload()
			})

			let url = Url.SignOut.replace(':session', sessionId)
			let res = await Http.post(url, {
				value: token
			})

			expect(res.status).toBe(200)

			let { rows } = await Db.query(`
				select count(*)
				  from sessions
				 where id = $1
			`, [sessionId])

			expect(rows[0].count).toBe("0")
		})

		test("Fails for invalid token", async () => {
			let sessionId = await createSession()
			let token = generateInvalidAccessToken({
				payload: ratPayload()
			})

			let url = Url.SignOut.replace(':session', sessionId)
			let res = await Http.post(url, {
				value: token
			})
			.catch(err => err.response)

			expect(res.status).toBe(403)
			expect(res.data.code).toBe(ErrorCode.NotAllowed)
		})

		test("Fails for duplicate jti", async () => {
			let sessionId = await createSession()
			let jti = uuid()
			let token = generateInvalidAccessToken({
				payload: ratPayload(5, jti)
			})

			await Db.query(`
				insert into refresh_access_tokens(id, session_id, expire_at, project_id)
				values($1, $2, now() + '5 minutes', $3)
			`, [jti, sessionId, PROJECT_ID])

			let url = Url.SignOut.replace(':session', sessionId)
			let res = await Http.post(url, {
				value: token
			})
			.catch(err => err.response)

			expect(res.status).toBe(403)
			expect(res.data.code).toBe(ErrorCode.NotAllowed)
		})
	})
	

	describe("all sessions", () => {
		test("Removes Sessions from DB", async () => {
			let sessionId = await createSession()

			let sink = Array
				.from({length: 10})
				.map(() => makeCreateSession(PROJECT_ID, USER_ID, KEYS.publicKey))

			await Promise.all(sink)

			let token = generateAccessToken({
				payload: ratPayload()
			})

			let url = Url.SignOutAll.replace(':session', sessionId)
			let res = await Http.post(url, {
				value: token
			})

			expect(res.status).toBe(200)

			let { rows } = await Db.query(`
				select count(*)
				  from sessions
				 where user_id = $1
			`, [USER_ID])

			expect(rows[0].count).toBe("0")
		})

		test("Fails for invalid token", async () => {
			let sessionId = await createSession()
			let token = generateInvalidAccessToken({
				payload: ratPayload()
			})

			let url = Url.SignOutAll.replace(':session', sessionId)
			let res = await Http.post(url, {
				value: token
			})
			.catch(err => err.response)

			expect(res.status).toBe(403)
			expect(res.data.code).toBe(ErrorCode.NotAllowed)
		})

		test("Fails for duplicate jti", async () => {
			let sessionId = await createSession()
			let jti = uuid()
			let token = generateInvalidAccessToken({
				payload: ratPayload(5, jti)
			})

			await Db.query(`
				insert into refresh_access_tokens(id, session_id, expire_at, project_id)
				values($1, $2, now() + '5 minutes', $3)
			`, [jti, sessionId, PROJECT_ID])

			let url = Url.SignOutAll.replace(':session', sessionId)
			let res = await Http.post(url, {
				value: token
			})
			.catch(err => err.response)

			expect(res.status).toBe(403)
			expect(res.data.code).toBe(ErrorCode.NotAllowed)
		})
	})
})