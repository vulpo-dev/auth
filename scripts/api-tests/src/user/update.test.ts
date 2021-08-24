import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
import { Url, UpdateUserPayload } from '@sdk-js/types'
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
	makeTokenPayload,
} from '../utils/user'
import { projectKeys } from '@seeds/data/projects'

import { v4 as uuid } from 'uuid'

const EMAIL = 'michael+test_user_update@riezler.dev'
const USER_ID = '90896fe0-d3c2-4f2d-8cce-e6dd628ca584'
const SESSION_ID = 'd18477d0-206c-4611-b248-1a25b4378562'
const KEYS = generateKeyPair()
const INVALID_KEYS = generateKeyPair()

const DUPLICATE_ID = 'dd4a1cfe-d21f-45aa-8a92-108ce7a93334'
const DUPLICATE_EMAIL = `michael+${DUPLICATE_ID}@riezler.dev`


let createSession = makeCreateSession(SESSION_ID, PROJECT_ID, USER_ID, KEYS.publicKey)
let createUser = makeCreateUser(USER_ID, EMAIL, PROJECT_ID)
let generateAccessToken = makeGenerateAccessToken({
	key: projectKeys.private_key,
	passphrase: 'password',
})
let generateInvalidAccessToken = makeGenerateInvalidAccessToken(INVALID_KEYS.privateKey)
let cleanUp = makeCleanUp(USER_ID)
let cleanUpDuplicate = makeCleanUp(DUPLICATE_ID)
let tokenPayload = makeTokenPayload(USER_ID, PROJECT_ID)

beforeEach(async () => {
	await Promise.all([
		await cleanUpDuplicate(),
		await cleanUp(),
	])
	await createUser()
	await createSession()
})
afterAll(() => {
	return Promise.all([
		cleanUp(),
		cleanUpDuplicate()
	])
})

describe("Update user", () => {
	test("should update values", async () => {

		await Db.query(`
			update users
	           set display_name = $2
	             , email = $3
	             , traits = $4
	             , data = $5
	             , email_verified = True
	         where id = $1 
		`, [USER_ID, 'abc', 'email', [], {}])

		let token = generateAccessToken({
			payload: tokenPayload()
		})

		let user: UpdateUserPayload = {
			display_name: 'test',
			email: EMAIL,
			traits: ['one', 'two'],
			data: {
				prop1: 1,
				prop2: 'bar'
			},
		}

		let res = await Http.post(Url.UserUpdate, user, {
			headers: {
				'Authorization': `Bearer ${token}`,
			}
		})
		.catch(err => err.response)

		expect(res.status).toBe(200)

		let { rows } = await Db.query(`
			select display_name
	             , email
	             , traits
	             , data
	             , email_verified
	          from users
	         where id = $1 
		`, [USER_ID])

		let { email_verified, ...newUser} = rows[0]
		expect(newUser).toMatchObject(user)
		expect(email_verified).toBe(false)
	})

	test("user.email_verified is true when email is stays the same", async () => {
		let token = generateAccessToken({
			payload: tokenPayload()
		})

		let user: UpdateUserPayload = {
			display_name: 'test',
			email: EMAIL,
			traits: ['one', 'two'],
			data: {
				prop1: 1,
				prop2: 'bar'
			},
		}

		let res = await Http.post(Url.UserUpdate, user, {
			headers: {
				'Authorization': `Bearer ${token}`,
			}
		})
		.catch(err => err.response)

		expect(res.status).toBe(200)

		let { rows } = await Db.query(`
			select email_verified
	          from users
	         where id = $1 
		`, [USER_ID])

		let { email_verified } = rows[0]
		expect(email_verified).toBe(true)
	})


	test("fails when access token is invalid", async () => {
		let token = generateInvalidAccessToken({
			payload: tokenPayload()
		})

		let user: UpdateUserPayload = {
			display_name: 'test',
			email: EMAIL,
			traits: ['one', 'two'],
			data: {
				prop1: 1,
				prop2: 'bar'
			},
		}

		let res = await Http.post(Url.UserUpdate, user, {
			headers: {
				'Authorization': `Bearer ${token}`,
			}
		})
		.catch(err => err.response)

		expect(res.status).toBe(401)
	})


	test("fails for duplicate email", async () => {
		let create = makeCreateUser(DUPLICATE_ID, DUPLICATE_EMAIL, PROJECT_ID)
		await create()

		let token = generateAccessToken({
			payload: tokenPayload()
		})

		let user: UpdateUserPayload = {
			display_name: 'test',
			email: DUPLICATE_EMAIL,
			traits: ['one', 'two'],
			data: {
				prop1: 1,
				prop2: 'bar'
			},
		}

		let res = await Http.post(Url.UserUpdate, user, {
			headers: {
				'Authorization': `Bearer ${token}`,
			}
		})
		.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.UserDuplicate)
	})
})