import Db from '../utils/db'
import Http from '../utils/http'

import { v4 as uuid } from 'uuid'
import * as bcrypt from 'bcryptjs'
import * as argon2 from 'argon2'

import {
	Url,
	PasswordResetPayload,
	VerifyResetTokenPayload,
	SetPasswordPayload,
} from '@sdk-js/types'
import { ErrorCode } from '@sdk-js/error'
import { PROJECT_ID } from '../utils/env'

const SALT = bcrypt.genSaltSync(10);
const EMAIL = 'api.test+reset_password@vulpo.dev'
const PASSWORD = 'password'
const ID = '031eb841-9650-4b52-a62f-1aa2742ceb43'

beforeAll(createUser)
beforeEach(resetPasswordReset)
afterAll(cleanUp)
afterAll(() => Db.end())


describe("Reset Password", () => {
	test("should create reset token", async () => {

		let payload: PasswordResetPayload = {
			email: EMAIL
		}

		let res = await Http.post(Url.RequestPasswordReset, payload)
		expect(res.status).toBe(200)

		let token = await getToken()
		expect(token).toBeTruthy()
	})


	test("should return ok for non existing user", async () => {
		let payload: PasswordResetPayload = {
			email: `wrong-${EMAIL}`
		}

		let res = await Http.post(Url.RequestPasswordReset, payload)
		expect(res.status).toBe(200)

		let token = await getToken()
		expect(token).toBe(null)
	})


	test("should verify reset token", async () => {
		let { token, hashed } = generateToken()
		let tokenId = await insertToken(hashed)

		let payload: VerifyResetTokenPayload = {
			id: tokenId,
			token
		}

		let res = await Http
			.post(Url.VerifyResetToken, payload)
			.catch(err => err.response)

		expect(res.status).toBe(200)
	})


	test("verify should fail when token is expired", async () => {
		let { token, hashed } = generateToken()
		let tokenId = await insertToken(hashed, true)

		let payload: VerifyResetTokenPayload = {
			id: tokenId,
			token
		}

		let res = await Http
			.post(Url.VerifyResetToken, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.ResetExpired)
	})


	test("verify should fail when token is invalid", async () => {
		let { token, hashed } = generateToken()
		let tokenId = await insertToken(hashed)

		let payload: VerifyResetTokenPayload = {
			id: tokenId,
			token: `wrong-${token}`
		}

		let res = await Http
			.post(Url.VerifyResetToken, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.ResetInvalidToken)
	})


	test("should set new password", async () => {
		let password = 'password'
		let { token, hashed } = generateToken()
		let tokenId = await insertToken(hashed)

		let payload: SetPasswordPayload = {
			id: tokenId,
			token,
			password1: password,
			password2: password,
		}

		let res = await Http
			.post(Url.PasswordReset, payload)
			.catch(err => err.response)

		expect(res.status).toBe(200)

		let [user] = await Db.query(`
				select hash
				  from passwords
				 where user_id = $1
			`, [ID])
			.then(res => res.rows)

		let passwordSet = await argon2.verify(user.hash, password)
		expect(passwordSet).toBe(true)
	})


	test("should fail when password is too short", async () => {
		let password = '1234567'

		let payload: SetPasswordPayload = {
			id: uuid(),
			token: '',
			password1: password,
			password2: password,
		}

		let res = await Http
			.post(Url.PasswordReset, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.PasswordMinLength)
	})


	test("should fail when password is too long", async () => {
		let password = '_3>pKuBc,FMD;m(WK=+=g<GSda{}$Tk0IL#>8]BWcQy.J3?/hQ{4q(hH_c*iLax^!'

		let payload: SetPasswordPayload = {
			id: uuid(),
			token: '',
			password1: password,
			password2: password,
		}

		let res = await Http
			.post(Url.PasswordReset, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.PasswordMaxLength)
	})


	test("should fail when passwords do not match", async () => {
		let password = '12345678'

		let payload: SetPasswordPayload = {
			id: uuid(),
			token: '',
			password1: password,
			password2: `wrong-${password}`,
		}

		let res = await Http
			.post(Url.PasswordReset, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.ResetPasswordMismatch)
	})


	test("set password should fail when token is expired", async () => {
		let password = 'password'
		let { token, hashed } = generateToken()
		let tokenId = await insertToken(hashed, true)

		let payload: SetPasswordPayload = {
			id: tokenId,
			token,
			password1: password,
			password2: password,
		}

		let res = await Http
			.post(Url.PasswordReset, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.ResetExpired)
	})


	test("set password should fail when token is invalid", async () => {
		let password = 'password'
		let { token, hashed } = generateToken()
		let tokenId = await insertToken(hashed)

		let payload: SetPasswordPayload = {
			id: tokenId,
			token: `invalid-${token}`,
			password1: password,
			password2: password,
		}

		let res = await Http
			.post(Url.PasswordReset, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.ResetInvalidToken)
	})
})


async function getToken(): Promise<{ id: string, token: string } | null> {
	let { rows } = await Db.query(`
		select id
		     , token
		  from password_change_requests
		 where user_id = $1
		   and project_id = $2
	`, [ID, PROJECT_ID])

	return rows[0] ?? null
}


function generateToken() {
	let token = (Math.random() * 100000000).toFixed(0).toString()
	let hashed = bcrypt.hashSync(token, SALT)
	return { token, hashed }
}


async function insertToken(token: string, expired: boolean = false): Promise<string> {

	let expiredAt = !expired
		? new Date(Date.now() + 32 * 60 * 1000)
		: new Date(Date.now() - 1 * 60 * 1000)

	let { rows } = await Db.query(`
		insert into password_change_requests (token, user_id, project_id, expire_at)
		values ($1, $2, $3, $4)
		returning id
	`, [token, ID, PROJECT_ID, expiredAt])

	return rows[0].id
}


async function createUser() {
	await Db.query(`
		delete from users
		 where id = $1
	`, [ID])

	await Db.query(`
		insert into users(id, email, project_id, provider_id)
		values($1, $2, $3, 'email')
	`, [ID, EMAIL, PROJECT_ID])

	let password = await argon2.hash(PASSWORD, { type: argon2.argon2id })

	await Db.query(`
		insert into passwords(user_id, alg, hash)
		values($1, 'argon2id', $2)
	`, [ID, password])
}


function resetPasswordReset() {
	return Db.query(`
		delete from password_change_requests
		 where user_id = $1
	`, [ID])
}


function cleanUp() {
	return Db.query(`
		delete from users
		 where email = $1
		   and project_id = $2
	`, [EMAIL, PROJECT_ID])
}