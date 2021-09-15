import Db from '../utils/db'
import Http from '../utils/http'
import { Url, VerifyEmailPayload } from '@sdk-js/types'
import { ErrorCode } from '@sdk-js/error'
import { PROJECT_ID } from '../utils/env'
import {
	makeCreateUser,
	makeCleanUp,
} from '../utils/passwordless'

import * as bcrypt from 'bcryptjs'

const EMAIL = 'michael+test_user_verify_email@riezler.dev'
const USER_ID = '39334431-3523-4469-8e66-d1a5cde6b181'
const SALT = bcrypt.genSaltSync(10);
const TOKEN = 'random-token'
const HASHED_TOKEN = bcrypt.hashSync(TOKEN, SALT)
const TOKEN_ID = '7e539309-5244-4fcb-be64-a4d00ab0d981'
let createUser = makeCreateUser(USER_ID, EMAIL, PROJECT_ID)

beforeAll(createUser)
beforeEach(async () => {

	await Db.query(`
		delete from verify_email
		 where user_id = $1
	`, [USER_ID])

	return Db.query(`
		insert into verify_email (id, token, user_id, project_id)
		values ($1, $2, $3, $4)
		on conflict do nothing
	`, [TOKEN_ID, HASHED_TOKEN, USER_ID, PROJECT_ID])	
})
afterAll(makeCleanUp(USER_ID))
afterAll(() => Db.end())

describe("Verify Email", () => {
	test("Sets user.email_verified to true", async () => {

		let sink = Array
			.from({length: 10})
			.map(() => Db.query(`
				insert into verify_email (token, user_id, project_id)
				values ($1, $2, $3)
				on conflict do nothing
			`, [HASHED_TOKEN, USER_ID, PROJECT_ID])
			)

		await Promise.all(sink)

		let payload: VerifyEmailPayload = {
			id: TOKEN_ID,
			token: TOKEN,
		}

		let res = await Http
			.post(Url.UserVerifyEmail, payload)
			.catch(err => err.response)

		expect(res.status).toBe(200)

		let { rows: users } = await Db.query(`
			select email_verified
			  from users
			 where id = $1
		`, [USER_ID])

		expect(users[0].email_verified).toBe(true)


		let { rows: tokens } = await Db.query(`
			select *
			  from verify_email
			 where user_id = $1
		`, [USER_ID])

		expect(tokens.length).toBe(0)		
	})

	test("returns token/invalid for invalid token", async () => {
		let payload: VerifyEmailPayload = {
			id: TOKEN_ID,
			token: `invalid-${TOKEN}`,
		}

		let res = await Http
			.post(Url.UserVerifyEmail, payload)
			.catch(err => err.response)

		expect(res.status).toBe(403)
		expect(res.data.code).toBe(ErrorCode.TokenInvalid)		
	})

	test("returns token/expired for expired token", async (): Promise<void> => {

		await Db.query(`
			update verify_email
			   set expire_at = now() - interval '1 minutes'
			 where id = $1  
		`, [TOKEN_ID])

		let payload: VerifyEmailPayload = {
			id: TOKEN_ID,
			token: TOKEN,
		}

		let res = await Http
			.post(Url.UserVerifyEmail, payload)
			.catch(err => err.response)

		expect(res.status).toBe(400)
		expect(res.data.code).toBe(ErrorCode.TokenExpired)		
	})
})