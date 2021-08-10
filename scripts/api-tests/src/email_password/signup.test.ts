import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
import SessionResponseSchema from '../utils/schema/session-response'

import uuid from 'uuid/v4'

import { Url, EmailPasswordPayload } from '@sdk-js/types'
import { ErrorCode } from '@sdk-js/error'
import { project } from '@seeds/data/projects'

const EMAIL = 'savanna.stanton+test_sign_up@ethereal.email'

function cleanUp() {
	return Db.query(`
		delete from users
		 where email = $1
		   and project_id = $2
	`, [EMAIL, project.id])
}

async function userCreated(): Promise<boolean> {
	let result = await Db.query(`
		select count(email)
		  from users
		 where email = $1
		   and project_id = $2
	`, [EMAIL, project.id])

	let [row] = result.rows
	return parseInt(row.count, 10) === 1
}

beforeEach(() => {
	return cleanUp()
})

afterAll(() => {
	return cleanUp()
})

describe("Email and Password signup", () => {

	test("create new user", async (): Promise<void> => {

		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: EMAIL,
			password: 'password',
			public_key: publicKey,
			session: uuid()
		}

		let res = await Http.post(Url.SignUp, payload)

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toBe('application/json')

		let body = SessionResponseSchema.validate(res.data)

		expect(body).toBeTruthy()

		let userExist = await userCreated()
		expect(userExist).toBeTruthy()
	})

	test("fails when password is to short", async () => {
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: EMAIL,
			password: '1234567',
			public_key: publicKey,
			session: uuid()
		}

		let res = await Http
			.post(Url.SignUp, payload)
			.catch(err => err.response)

		expect(res.status).toBe(500)
		expect(res.data.code).toBe(ErrorCode.PasswordMinLength)
	})

	test("fails when password is to long", async () => {
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: EMAIL,
			password: '_3>pKuBc,FMD;m(WK=+=g<GSda{}$Tk0IL#>8]BWcQy.J3?/hQ{4q(hH_c*iLax^!',
			public_key: publicKey,
			session: uuid()
		}

		let res = await Http
			.post(Url.SignUp, payload)
			.catch(err => err.response)

		expect(res.status).toBe(500)
		expect(res.data.code).toBe(ErrorCode.PasswordMaxLength)
	})

	test("fails when user exists", async () => {
		let { publicKey } = generateKeyPair()

		let payload: EmailPasswordPayload = {
			email: EMAIL,
			password: 'password',
			public_key: publicKey,
			session: uuid()
		}

		await Http.post(Url.SignUp, payload)

		let res = await Http
			.post(Url.SignUp, payload)
			.catch(err => err.response)

		expect(res.status).toBe(500)
		expect(res.data.code).toBe(ErrorCode.InvalidEmailPassword)
	})

})