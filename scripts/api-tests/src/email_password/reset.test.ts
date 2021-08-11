import Db from '../utils/db'
import Http from '../utils/http'
import SessionResponseSchema from '../utils/schema/session-response'

import uuid from 'uuid/v4'
import * as bcrypt from 'bcryptjs'

import {
	Url,
	PasswordResetPayload,
	VerifyResetTokenPayload,
	SetPasswordPayload,
} from '@sdk-js/types'
import { ErrorCode } from '@sdk-js/error'
import { project } from '@seeds/data/projects'

const SALT = bcrypt.genSaltSync(10);
const EMAIL = 'savanna.stanton+test_reset@ethereal.email'
const PASSWORD = 'password'
const ID = '031eb841-9650-4b52-a62f-1aa2742ceb43'

beforeAll(() => {
	return Db.query(`
		insert into users(id, email, password, project_id, provider_id)
		values($1, $2, $3, $4, 'email')
		on conflict (email, project_id)
		   do update set password = excluded.password
	`, [ID, EMAIL, bcrypt.hashSync(PASSWORD, SALT), project.id])
})

beforeEach(() => {
	return Db.query(`
		delete from password_change_requests
		 where user_id = $1
	`, [ID])
})

afterAll(() => {
	return Db.query(`
		delete from users
		 where email = $1
		   and project_id = $2
	`, [EMAIL, project.id])
})

async function getToken(): Promise<{ id: string, token: string } | null> {
	let { rows } = await Db.query(`
		select id
		     , token
		  from password_change_requests
		 where user_id = $1
		   and project_id = $2
	`, [ID, project.id])

	return rows[0] ?? null
}

function generateToken() {
	let token = (Math.random() * 100000000).toFixed(0).toString()
	let hashed = bcrypt.hashSync(token, SALT)
	return { token, hashed }
}

async function insertToken(token: string, expired: boolean = false): Promise<string> {

	let createdAt = !expired
		? new Date()
		: new Date(Date.now() - 32 * 60 * 1000)

	let { rows } = await Db.query(`
		insert into password_change_requests (token, user_id, project_id, created_at)
		values ($1, $2, $3, $4)
		returning id
	`, [token, ID, project.id, createdAt])

	return rows[0].id
}

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

		expect(res.status).toBe(500)
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

		expect(res.status).toBe(500)
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
				select password
				  from users
				 where id = $1
			`, [ID])
			.then(res => res.rows)

		let passwordSet = bcrypt.compareSync(password, user.password)
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

		expect(res.status).toBe(500)
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

		expect(res.status).toBe(500)
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

		expect(res.status).toBe(500)
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

		expect(res.status).toBe(500)
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

		expect(res.status).toBe(500)
		expect(res.data.code).toBe(ErrorCode.ResetInvalidToken)
	})
})