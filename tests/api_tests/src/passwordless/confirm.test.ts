import { v4 as uuid } from 'uuid'
import { Url, ConfirmPasswordlessPayload, ErrorCode } from '@vulpo-dev/auth-sdk'

import Db from '../utils/db'
import Http from '../utils/http'
import { createToken, createSession } from '../utils/passwordless'
import { createUser } from '../utils/user'

afterAll(() => Db.end())

describe("Confirm Passwordless", () => {
	test("returns ok for valid token", async () => {
		let user = await createUser()
		let session = await createSession({ user })
		let token = await createToken({ user, session })
		
		let payload: ConfirmPasswordlessPayload = {
			id: token.id,
			token: token.value,
		}

		let res = await Http
			.post(Url.PasswordlessConfim, payload)
			.catch(err => err.response)

		expect(res.status).toBe(200)

		let { rows } = await Db.query(`
			select confirmed
			     , is_valid
			  from passwordless
			 where id = $1
		`, [token.id])

		expect(rows[0].confirmed).toBe(true)
		expect(rows[0].is_valid).toBe(true)
	})


	test("fails when token is invalid", async () => {
		let user = await createUser()
		let session = await createSession({ user })
		let token = await createToken({ user, session })

		await Db.query(`
			update passwordless
			   set is_valid = false
			 where id = $1 
		`, [token.id])
		
		let payload: ConfirmPasswordlessPayload = {
			id: token.id,
			token: token.value,
		}

		let res = await Http
			.post(Url.PasswordlessConfim, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.PasswordlessInvalidToken)
	})


	test("fails when token does not match", async () => {
		let user = await createUser()
		let session = await createSession({ user })
		let token = await createToken({ user, session })
		
		let payload: ConfirmPasswordlessPayload = {
			id: token.id,
			token: `wrong-${token.value}`
		}

		let res = await Http
			.post(Url.PasswordlessConfim, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.PasswordlessInvalidToken)
	})


	test("fails when token is expired", async () => {
		let user = await createUser()
		let session = await createSession({ user })
		let token = await createToken({ user, session })

		await Db.query(`
			update passwordless
			   set expire_at = now() - interval '1 minutes'
			 where id = $1 
		`, [token.id])
		
		let payload: ConfirmPasswordlessPayload = {
			id: token.id,
			token: token.value,
		}

		let res = await Http
			.post(Url.PasswordlessConfim, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.PasswordlessTokenExpire)
	})


	test("returns not found when id is wrong", async () => {
		let user = await createUser()
		let session = await createSession({ user })
		let token = await createToken({ user, session })
		
		let payload: ConfirmPasswordlessPayload = {
			id: uuid(),
			token: token.value
		}

		let res = await Http
			.post(Url.PasswordlessConfim, payload)
			.catch(err => err.response)

		expect(res.status).toBe(404)
		expect(res.data.code).toBe(ErrorCode.NotFound)
	})
})
