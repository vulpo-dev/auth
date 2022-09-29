import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
import { Url, UserState } from '@sdk-js/types'
import { ErrorCode } from '@sdk-js/error'
import { PROJECT_ID } from '../utils/env'
import {
	makeCleanUp,
	makeCreateUser,
} from '../utils/passwordless'
import UserResponseSchema from '../utils/schema/user'
import { projectKeys } from '@seeds/data/projects'

import { v4 as uuid } from 'uuid'
import * as jwt from 'jsonwebtoken'
import { Algorithm } from 'jsonwebtoken'

const EMAIL = 'api.test+user_get@vulpo.dev'
const USER_ID = 'a9ad9dd7-c599-4128-8f92-65f14ac87102'
const KEYS = generateKeyPair()

let createUser = makeCreateUser(
	USER_ID,
	EMAIL,
	PROJECT_ID
)

beforeEach(async () => {
	await Db.query(`
		delete from users
		 where id = $1 
	`, [USER_ID])

	return createUser()
})
afterAll(makeCleanUp(USER_ID))
afterAll(() => Db.end())

describe("Get User", () => {
	test("returns valid user", async () => {
		let token = generateAccessToken({
			payload: tokenPayload()
		})

		let res = await Http.get(Url.UserGet, {
			headers: {
				'Authorization': `Bearer ${token}`,
			}
		})

		expect(res.status).toBe(200)
		expect(res.headers['content-type']).toBe('application/json')

		let body = UserResponseSchema.validate(res.data)
		expect(body).toBeTruthy()
	})

	test("retuns correct user values", async (): Promise<void> => {
		const newUser = {
			display_name: 'michael',
			email: 'michael+test_user_get_changed@riezler.dev',
			email_verified: true,
			photo_url: 'random fuu',
			traits: ['one', 'two'],
			data: {
				random: 'value',
				fuu: 124,
				bar: false
			},
			provider_id: 'link',
			state: UserState.Disabled,
		} 

		await Db.query(`
			update users
			   set display_name = $2
			     , email = $3
			     , email_verified = $4
			     , photo_url = $5
			     , traits = $6
			     , data = $7
			     , provider_id = $8
			     , state = $9
			 where id = $1
		`, [
			USER_ID,
			newUser.display_name,
			newUser.email,
			newUser.email_verified,
			newUser.photo_url,
			newUser.traits,
			newUser.data,
			newUser.provider_id,
			newUser.state,
		])

		let token = generateAccessToken({
			payload: tokenPayload()
		})

		let res = await Http.get(Url.UserGet, {
			headers: {
				'Authorization': `Bearer ${token}`,
			}
		})

		let {
			created_at,
			updated_at,
			...user
		} = res.data

		expect(user).toMatchObject(newUser)
	})

	test("returns not_found for invalid id", async () => {
		let token = generateAccessToken({
			payload: {
				...tokenPayload(),
				sub: uuid(),
			}
		})

		let res = await Http.get(Url.UserGet, {
			headers: {
				'Authorization': `Bearer ${token}`,
			}
		})
		.catch(err => err.response)

		expect(res.status).toBe(404)
		expect(res.data.code).toBe(ErrorCode.NotFound)
	})

	test("returns unauthorized for invalid token", async () => {
		let token = generateInvalidAccessToken({
			payload: tokenPayload()
		})

		let res = await Http.get(Url.UserGet, {
			headers: {
				'Authorization': `Bearer ${token}`,
			}
		})
		.catch(err => err.response)

		expect(res.status).toBe(401)
	})

	test("returns unauthorized for expired token", async () => {
		let token = generateAccessToken({
			payload: tokenPayload(-5)
		})

		let res = await Http.get(Url.UserGet, {
			headers: {
				'Authorization': `Bearer ${token}`,
			}
		})
		.catch(err => err.response)

		expect(res.status).toBe(401)
	})
})

type GenerateAccessToken = {
	payload?: any;
	algorithm?: Algorithm;
}

function generateAccessToken({
	payload = {},
	algorithm = 'ES384',
}: GenerateAccessToken = {}) {
	return jwt.sign(
		JSON.stringify(payload),
		{
			key: projectKeys.private_key,
			passphrase: 'password'
		},
		{
			algorithm,
			header: {
				typ: "JWT",
				alg: algorithm,
			}
		}
	)
}

function generateInvalidAccessToken({
	payload = {},
	algorithm = 'ES384',
}: GenerateAccessToken = {}) {
	return jwt.sign(
		JSON.stringify(payload),
		KEYS.privateKey,
		{
			algorithm,
			header: {
				typ: "JWT",
				alg: algorithm,
			}
		}
	)
}

export function tokenPayload(minutes = 5) {
	let now = new Date()
	let exp = Math.ceil(now.setMinutes(now.getMinutes() + minutes) / 1000)
	return {
		exp,
		sub: USER_ID,
		iss: PROJECT_ID,
		traits: [],
	}
}
