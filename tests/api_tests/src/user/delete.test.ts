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

const EMAIL = 'api.test+user_delete_account@vulpo.dev'
const USER_ID = '90896fe0-d3c2-4f2d-8cce-e6dd628ca584'
const KEYS = generateKeyPair()
const INVALID_KEYS = generateKeyPair()

let createSession = makeCreateSession(PROJECT_ID, USER_ID, KEYS.publicKey)
let createUser = makeCreateUser(USER_ID, EMAIL, PROJECT_ID)
let generateAccessToken = makeGenerateAccessToken(KEYS.privateKey)
let generateInvalidAccessToken = makeGenerateInvalidAccessToken(INVALID_KEYS.privateKey)

beforeEach(async () => {
	await createUser()
})
afterAll(makeCleanUp(USER_ID))
afterAll(() => Db.end())

describe("Delete Account", () => {
	test("Remove from DB", async () => {
		let sessionId = await createSession()

		let token = generateAccessToken({
			payload: ratPayload()
		})

		let url = Url.UserDeleteAccount.replace(':session', sessionId)
		let res = await Http.post(url, {
			value: token
		})
		.catch(err => err.response)

		expect(res.status).toBe(200)

		let { rows } = await Db.query(`
			select *
			  from users
			 where id = $1
		`, [USER_ID])
		
		expect(rows.length).toBe(0)
	})

	test("Fails for invalid token", async () => {
		let sessionId = await createSession()
		let token = generateInvalidAccessToken({
			payload: ratPayload()
		})

		let url = Url.UserDeleteAccount.replace(':session', sessionId)
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

		let url = Url.UserDeleteAccount.replace(':session', sessionId)
		let res = await Http.post(url, {
			value: token
		})
		.catch(err => err.response)

		expect(res.status).toBe(403)
		expect(res.data.code).toBe(ErrorCode.NotAllowed)
	})	
})