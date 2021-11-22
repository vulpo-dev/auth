import Http from '../utils/http'
import Db from '../utils/db'
import { PROJECT_ID } from '../utils/env'
import * as bcrypt from 'bcryptjs'
import { makeGenerateAccessToken, makeTokenPayload } from '../utils/user'
import { generateKeyPair } from '../utils/crypto'
import { makeCreateSession } from '../utils/passwordless'
import { projectKeys } from '@seeds/data/projects'

import { ErrorCode } from '@sdk-js/error'
import { Url } from '@sdk-js/types'

const USER_ID = '077a9f18-e3c9-428f-99de-49a9a6772887'
const SESSION_ID = '4e418b87-f967-4d1c-9d40-70e352611101'
const EMAIL = 'api.test+set_password@vulpo.dev'
const KEYS = generateKeyPair()
const INVALID_KEYS = generateKeyPair()

let createSession = makeCreateSession(SESSION_ID, PROJECT_ID, USER_ID, KEYS.publicKey)
let getAccessToken = makeGenerateAccessToken({
	key: projectKeys.private_key,
	passphrase: 'password',
})

let getInvalidAccessToken = makeGenerateAccessToken(INVALID_KEYS.privateKey)

let tokenPayload = makeTokenPayload(USER_ID, PROJECT_ID)

async function removeUser() {
	await Db.query(`
		delete from users
		where id = $1
	`, [USER_ID])
}

beforeEach(async () => {
	await removeUser()
	await Db.query(`
		insert into users(id, email, project_id, provider_id, state)
		values($1, $2, $3, 'password', 'SetPassword')
		on conflict (id)
		   do nothing
	`, [USER_ID, EMAIL, PROJECT_ID])
	await createSession()
})

afterAll(removeUser)
afterAll(() => Db.end())

describe("Set Password", () => {
	test("can set password", async () => {
		let password = 'password'

		let res = await Http
			.post(Url.UserSetPassword, { password }, options())
			.catch(err => err.response)

		expect(res.status).toEqual(200)

		let user = await getUser()
		expect(user.state).toEqual('Active')
		expect(bcrypt.compare(password, user.password)).toBeTruthy()
	})

	test("fails when user is in incorrect state", async () => {

		await Db.query(`
			update users
			   set state = 'Active'
			 where id = $1 
		`, [USER_ID])

		let password = 'password'

		let res = await Http
			.post(Url.UserSetPassword, { password }, options())
			.catch(err => err.response)

		expect(res.status).toEqual(403)
	})

	test("fails when password is too short", async () => {
		let password = '1234567'

		let res = await Http
			.post(Url.UserSetPassword, {password}, options())
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.PasswordMinLength)

		let user = await getUser()
		expect(user.state).toEqual('SetPassword')
		expect(user.password).toEqual(null)
	})

	test("fails when password is too long", async () => {
		let password = 'passwordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpassword'
		
		let res = await Http
			.post(Url.UserSetPassword, { password }, options())
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.PasswordMaxLength)

		let user = await getUser()
		expect(user.state).toEqual('SetPassword')
		expect(user.password).toEqual(null)
	})

	test("fails for invalid token", async () => {
		let password = 'password'
		
		let res = await Http
			.post(Url.UserSetPassword, { password }, options(true))
			.catch(err => err.response)

		expect(res.status).toBe(401)
	})
})

function options(invalid: boolean = false) {
	let args = {
		payload: tokenPayload()
	}

	let accessToken = invalid
		? getInvalidAccessToken
		: getAccessToken

	return {
		headers: {
			'Authorization': `Bearer ${accessToken(args)}`,
		}
	}
}

async function getUser() {
	let { rows } = await Db.query(`
		select password
		     , state
		  from users
		 where id = $1 
	`, [USER_ID])

	return rows[0]
}