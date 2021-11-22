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

const EMAIL = 'api.test+user_delete_account@vulpo.dev'
const USER_ID = '90896fe0-d3c2-4f2d-8cce-e6dd628ca584'
const SESSION_ID = 'd18477d0-206c-4611-b248-1a25b4378562'
const KEYS = generateKeyPair()
const INVALID_KEYS = generateKeyPair()

let createSession = makeCreateSession(SESSION_ID, PROJECT_ID, USER_ID, KEYS.publicKey)
let createUser = makeCreateUser(USER_ID, EMAIL, PROJECT_ID)
let generateAccessToken = makeGenerateAccessToken(KEYS.privateKey)
let generateInvalidAccessToken = makeGenerateInvalidAccessToken(INVALID_KEYS.privateKey)

beforeEach(async () => {
	await createUser()
	await createSession()
})
afterAll(makeCleanUp(USER_ID))
afterAll(() => Db.end())

describe("Delete Account", () => {
	test("Remove from DB", async () => {
		let token = generateAccessToken({
			payload: ratPayload()
		})

		let url = Url.UserDeleteAccount.replace(':session', SESSION_ID)
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
		let token = generateInvalidAccessToken({
			payload: ratPayload()
		})

		let url = Url.UserDeleteAccount.replace(':session', SESSION_ID)
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

		let url = Url.UserDeleteAccount.replace(':session', SESSION_ID)
		let res = await Http.post(url, {
			value: token
		})
		.catch(err => err.response)

		expect(res.status).toBe(403)
		expect(res.data.code).toBe(ErrorCode.NotAllowed)
	})	
})