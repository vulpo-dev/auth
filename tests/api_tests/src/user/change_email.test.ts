import Db from '../utils/db'
import Http from '../utils/http'
import { generateKeyPair } from '../utils/crypto'
// import { Url } from '@sdk-js/types'
// import { ErrorCode } from '@sdk-js/error'
import { PROJECT_ID } from '../utils/env'
import {
	makeCleanUp,
	makeCreateUser,
} from '../utils/passwordless'
import { makeGenerateAccessToken, makeTokenPayload } from '../utils/user'
import { projectKeys } from '@seeds/data/projects'

import { v4 as uuid } from 'uuid'
import * as jwt from 'jsonwebtoken'
import { Algorithm } from 'jsonwebtoken'

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
})