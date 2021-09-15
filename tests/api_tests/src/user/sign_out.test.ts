import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
import { Url } from '@sdk-js/types'
import { ErrorCode } from '@sdk-js/error'
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

import { v4 as uuid } from 'uuid'

const EMAIL = 'michael+test_user_sign_out@riezler.dev'
const USER_ID = 'df26e3cf-a5a0-4469-966a-a5dc9b273489'
const SESSION_ID = '3dd6d873-fb95-46ae-acbd-aa7e5e3d61c8'
const KEYS = generateKeyPair()
const INVALID_KEYS = generateKeyPair()

let createSession = makeCreateSession(SESSION_ID, PROJECT_ID, USER_ID, KEYS.publicKey)
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
			let token = generateAccessToken({
				payload: ratPayload()
			})

			let url = Url.SignOut.replace(':session', SESSION_ID)
			let res = await Http.post(url, {
				value: token
			})

			expect(res.status).toBe(200)

			let { rows } = await Db.query(`
				select count(*)
				  from sessions
				 where id = $1
			`, [SESSION_ID])

			expect(rows[0].count).toBe("0")
		})

		test("Fails for invalid token", async () => {
			let token = generateInvalidAccessToken({
				payload: ratPayload()
			})

			let url = Url.SignOut.replace(':session', SESSION_ID)
			let res = await Http.post(url, {
				value: token
			})
			.catch(err => err.response)

			expect(res.status).toBe(403)
			expect(res.data.code).toBe(ErrorCode.NotAllowed)
		})

		test("Fails for duplicate jti", async () => {
			let jti = uuid()
			let token = generateInvalidAccessToken({
				payload: ratPayload(5, jti)
			})

			await Db.query(`
				insert into refresh_access_tokens(id, session_id, expire_at)
				values($1, $2, now() + '5 minutes')
			`, [jti, SESSION_ID])

			let url = Url.SignOut.replace(':session', SESSION_ID)
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

			let sink = Array
				.from({length: 10}, () => uuid())
				.map(sessionId => makeCreateSession(sessionId, PROJECT_ID, USER_ID, KEYS.publicKey))
				.map(fn => fn())

			await Promise.all(sink)

			let token = generateAccessToken({
				payload: ratPayload()
			})

			let url = Url.SignOutAll.replace(':session', SESSION_ID)
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
			let token = generateInvalidAccessToken({
				payload: ratPayload()
			})

			let url = Url.SignOutAll.replace(':session', SESSION_ID)
			let res = await Http.post(url, {
				value: token
			})
			.catch(err => err.response)

			expect(res.status).toBe(403)
			expect(res.data.code).toBe(ErrorCode.NotAllowed)
		})

		test("Fails for duplicate jti", async () => {
			let jti = uuid()
			let token = generateInvalidAccessToken({
				payload: ratPayload(5, jti)
			})

			await Db.query(`
				insert into refresh_access_tokens(id, session_id, expire_at)
				values($1, $2, now() + '5 minutes')
			`, [jti, SESSION_ID])

			let url = Url.SignOutAll.replace(':session', SESSION_ID)
			let res = await Http.post(url, {
				value: token
			})
			.catch(err => err.response)

			expect(res.status).toBe(403)
			expect(res.data.code).toBe(ErrorCode.NotAllowed)
		})
	})
})