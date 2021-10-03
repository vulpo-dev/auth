import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
import { PROJECT_ID } from '../utils/env'
import { makeCreateUser } from '../utils/passwordless'
import { makeGenerateAccessToken, makeTokenPayload } from '../utils/user'
import { projectKeys } from '@seeds/data/projects'

import { v4 as uuid } from 'uuid'
import * as bcrypt from 'bcryptjs'

const EMAIL = 'api+test_change_email@vulpo.dev'
const NEW_EMAIL = 'api+test_change_new_email@vulpo.dev'
const USER_ID = '4d883557-1efb-4a4b-9108-40e68d597fbc'
const KEYS = generateKeyPair()

let createUser = makeCreateUser(
	USER_ID,
	EMAIL,
	PROJECT_ID
)

let generateAccessToken = makeGenerateAccessToken({
	key: projectKeys.private_key,
	passphrase: 'password'
})
let tokenPayload = makeTokenPayload(USER_ID, PROJECT_ID)

beforeEach(async () => {
	await Db.query(`
		delete from users
		 where id = $1 
	`, [USER_ID])

	return createUser()
})

afterAll(() => Db.end())

describe("User change email", () => {
	test("can request email change", async () => {
		let token = generateAccessToken({
			payload: tokenPayload()
		})

		let payload = { new_email: NEW_EMAIL }

		let res = await Http.post('user/email/update', payload, {
			headers: {
				'Authorization': `Bearer ${token}`,
			}
		})
		.catch(err => err.response)

		expect(res.status).toEqual(200)
	})

	test("can confirm email", async () => {
		let changeRequest = await insertChangeRequestToken()

		let payload = {
			id: changeRequest.id,
			token: changeRequest.token,
		}

		let res = await confirm(payload)

		expect(res.status).toEqual(200)

		let { rows } = await Db.query(`
			select email_change_request.state
			     , users.email
			  from email_change_request
			  join users on users.id = email_change_request.user_id
			 where email_change_request.id = $1
		`, [changeRequest.id])

		expect(rows[0]).toMatchObject({
			state: 'accept',
			email: NEW_EMAIL,
		})
	})

	test("confirm fails when token is expired", async () => {
		let changeRequest = await insertChangeRequestToken({ expired: true })

		let payload = {
			id: changeRequest.id,
			token: changeRequest.token,
		}

		let res = await confirm(payload)

		expect(res.status).toEqual(403)

		await dataIsUnchanged(changeRequest.id, 'request')
	})

	test("confirm fails when token is invalid", async () => {
		let changeRequest = await insertChangeRequestToken()

		let payload = {
			id: changeRequest.id,
			token: changeRequest.resetToken,
		}

		let res = await confirm(payload)

		expect(res.status).toEqual(403)

		await dataIsUnchanged(changeRequest.id, 'request')
	})


	test("confirm fails when token state is reject", testState('reject'))
	test("confirm fails when token state is reset", testState('reset'))
	test("confirm fails when token state is accept", testState('accept'))
})


describe("User reset change email", () => {
	test("can reset email change", async () => {
		let changeRequest = await insertChangeRequestToken()

		await confirm({
			id: changeRequest.id,
			token: changeRequest.token,
		})

		let payload = {
			id: changeRequest.id,
			token: changeRequest.resetToken,
		}

		let res = await reset(payload)

		expect(res.status).toEqual(200)

		let { rows } = await Db.query(`
			select email_change_request.state
			     , users.email
			  from email_change_request
			  join users on users.id = email_change_request.user_id
			 where email_change_request.id = $1
		`, [changeRequest.id])

		expect(rows[0]).toMatchObject({
			state: 'reset',
			email: EMAIL,
		})
	})

	test("reset fails when token state is reject", testResetState('reject'))
	test("reset fails when token state is reset", testResetState('reset'))
})


function testState(state: string) {
	return async () => {
		let changeRequest = await insertChangeRequestToken()
		await setState(changeRequest.id, state)

		let payload = {
			id: changeRequest.id,
			token: changeRequest.token,
		}

		let res = await confirm(payload)

		expect(res.status).toEqual(403)

		await dataIsUnchanged(changeRequest.id, state)
	}
}

function testResetState(state: string) {
	return async () => {
		let changeRequest = await insertChangeRequestToken()
		await setState(changeRequest.id, state)

		let payload = {
			id: changeRequest.id,
			token: changeRequest.resetToken,
		}

		let res = await reset(payload)

		expect(res.status).toEqual(403)

		await dataIsUnchanged(changeRequest.id, state)
	}
}


async function insertChangeRequestToken({ expired = false } = {}) {
	let token = uuid()
	let hashedToken = bcrypt.hashSync(token)

	let resetToken = uuid()
	let hashedResetToken = bcrypt.hashSync(resetToken)

	let expireAt = expired
		? new Date(Date.now() - 60 * 1000)
		: new Date(Date.now() + 30 * 60 * 1000)

	let { rows } = await Db.query(`
		insert into email_change_request(old_email, new_email, user_id, token, reset_token, expire_at)
		values($1, $2, $3, $4, $5, $6)
		returning id
	`, [EMAIL, NEW_EMAIL, USER_ID, hashedToken, hashedResetToken, expireAt])
	
	let id = rows[0].id

	return { id, token, resetToken }
}

async function setState(id: string, state: string) {
	await Db.query(`
		update email_change_request
	       set state = $2
	     where id = $1 
	`, [id, state])
}

async function dataIsUnchanged(changeRequestId: string, state: string, email: string = EMAIL) {
	let { rows } = await Db.query(`
		select email_change_request.state
		     , users.email
		  from email_change_request
		  join users on users.id = email_change_request.user_id
		 where email_change_request.id = $1
	`, [changeRequestId])

	expect(rows[0]).toMatchObject({ state, email })
}



async function confirm(payload) {
	let token = generateAccessToken({
		payload: tokenPayload()
	})

	return Http.post('user/email/update/confirm', payload, {
		headers: {
			'Authorization': `Bearer ${token}`,
		}
	})
	.catch(err => err.response)	
}

async function reset(payload: any) {
	return req('user/email/update/reset', payload)
}

async function req(url: string, payload: any) {
	let token = generateAccessToken({
		payload: tokenPayload()
	})

	return Http.post(url, payload, {
		headers: {
			'Authorization': `Bearer ${token}`,
		}
	})
	.catch(err => err.response)
}