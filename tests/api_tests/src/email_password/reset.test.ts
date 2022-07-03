import Db from '../utils/db'
import Http from '../utils/http'
import { createUser, getEmail } from '../utils/user'

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
const PASSWORD = 'password'

afterAll(() => Db.end())

describe("Reset Password", () => {
	test("should create reset token", async () => {
		let user_id = uuid()
		let email = getEmail()
		await createUser({
			id: user_id,
			password: PASSWORD,
			email: email,
		})

		let payload: PasswordResetPayload = {
			email: email
		}

		let res = await Http.post(Url.RequestPasswordReset, payload)
		expect(res.status).toBe(200)

		let token = await getToken(user_id)
		expect(token).toBeTruthy()
	})


	test("should return ok for non existing user", async () => {
		let user_id = uuid()
		let email = getEmail()
		await createUser({
			id: user_id,
			password: PASSWORD,
			email: email,
		})

		let payload: PasswordResetPayload = {
			email: `wrong-${email}`
		}

		let res = await Http.post(Url.RequestPasswordReset, payload)
		expect(res.status).toBe(200)

		let token = await getToken(user_id)
		expect(token).toBe(null)
	})


	test("should verify reset token", async () => {
		let user_id = uuid()
		await createUser({
			id: user_id,
			password: PASSWORD,
			email: getEmail(),
		})

		let { token, hashed } = generateToken()
		let tokenId = await insertToken(user_id, hashed)

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
		let user_id = uuid()
		await createUser({
			id: user_id,
			password: PASSWORD,
			email: getEmail(),
		})

		let { token, hashed } = generateToken()
		let tokenId = await insertToken(user_id, hashed, true)

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
		let user_id = uuid()
		await createUser({
			id: user_id,
			password: PASSWORD,
			email: getEmail(),
		})

		let { token, hashed } = generateToken()
		let tokenId = await insertToken(user_id, hashed)

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
		let user_id = uuid()
		await createUser({
			id: user_id,
			password: PASSWORD,
			email: getEmail(),
		})

		let password = 'password'
		let { token, hashed } = generateToken()
		let tokenId = await insertToken(user_id, hashed)

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
			`, [user_id])
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
		let user_id = uuid()
		await createUser({
			id: user_id,
			password: PASSWORD,
			email: getEmail(),
		})

		let password = 'password'
		let { token, hashed } = generateToken()
		let tokenId = await insertToken(user_id, hashed, true)

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
		let user_id = uuid()
		await createUser({
			id: user_id,
			password: PASSWORD,
			email: getEmail(),
		})

		let password = 'password'
		let { token, hashed } = generateToken()
		let tokenId = await insertToken(user_id, hashed)

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


async function getToken(id: string): Promise<{ id: string, token: string } | null> {
	let { rows } = await Db.query(`
		select id
		     , token
		  from password_change_requests
		 where user_id = $1
		   and project_id = $2
	`, [id, PROJECT_ID])

	return rows[0] ?? null
}


function generateToken() {
	let token = (Math.random() * 100000000).toFixed(0).toString()
	let hashed = bcrypt.hashSync(token, SALT)
	return { token, hashed }
}


async function insertToken(user_id: string, token: string, expired: boolean = false): Promise<string> {

	let expiredAt = !expired
		? new Date(Date.now() + 32 * 60 * 1000)
		: new Date(Date.now() - 1 * 60 * 1000)

	let { rows } = await Db.query(`
		insert into password_change_requests (token, user_id, project_id, expire_at)
		values ($1, $2, $3, $4)
		returning id
	`, [token, user_id, PROJECT_ID, expiredAt])

	return rows[0].id
}
