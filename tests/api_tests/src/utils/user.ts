import Db from './db'
import { PROJECT_ID } from '../utils/env'
import { projectKeys } from '@seeds/data/projects'

import * as jwt from 'jsonwebtoken'
import { Algorithm } from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import * as argon2 from 'argon2'

export let getEmail = () => `api.test+${uuid()}@vulpo.dev`

type GenerateAccessToken = {
	payload?: any;
	algorithm?: Algorithm;
}

type PrivateKey = {
	key: string;
	passphrase: string;
}

export function makeGenerateAccessToken(key: string | PrivateKey) {
	return function generateAccessToken({
		payload = {},
		algorithm = 'RS256',
	}: GenerateAccessToken = {}) {
		return jwt.sign(
			JSON.stringify(payload),
			key,
			{
				algorithm,
				header: {
					typ: "JWT",
					alg: algorithm,
				}
			}
		)
	}
}

export function makeGenerateInvalidAccessToken(key: string) {
	return function generateInvalidAccessToken({
		payload = {},
		algorithm = 'RS256',
	}: GenerateAccessToken = {}) {
		return jwt.sign(
			JSON.stringify(payload),
			key,
			{
				algorithm,
				header: {
					typ: "JWT",
					alg: algorithm,
				}
			}
		)
	}
}

export function makeTokenPayload(
	sub: string,
	iss: string,
) {
	return function tokenPayload(minutes = 5) {
		let now = new Date()
		let exp = Math.ceil(now.setMinutes(now.getMinutes() + minutes) / 1000)
		return {
			exp,
			sub,
			iss,
			traits: [],
		}
	}
}

export function ratPayload(minutes = 5, jti?: string) {
	let now = new Date()
	let exp = Math.ceil(now.setMinutes(now.getMinutes() + minutes) / 1000)
	return {
		exp,
		jti: jti ?? uuid()
	}
}

type CreateUser = {
	project?: string;
	traits?: Array<string>;
	password?: string;
}

type CreatedUser = {
	id: string;
	email: string;
}

export async function createUser({
	project = PROJECT_ID,
	traits = [],
	password
}: CreateUser = {}): Promise<CreatedUser> {
	let userId = uuid()
	let email = getEmail()
	let authType = password ? 'email' : 'link'

	await Db.query(`
		insert into users(id, email, project_id, provider_id, traits)
		values($1, $2, $3, $4, $5)
	`, [userId, email, project, authType, traits])

	if (password) {
		let hash = await argon2.hash(password, { type: argon2.argon2id })

		await Db.query(`
			insert into passwords(user_id, alg, hash)
			values($1, 'argon2id', $2)
			on conflict do nothing
		`, [userId, hash])
	}

	return { id: userId, email }
}

export function createTokenPayload(sub: string, iss: string, minutes = 5) {
	let now = new Date()
	let exp = Math.ceil(now.setMinutes(now.getMinutes() + minutes) / 1000)
	return {
		exp,
		sub,
		iss,
		traits: [],
	}
}

let defaultKey = {
	key: projectKeys.private_key,
	passphrase: 'password'
}

type CreateAccessToken = {
	key?: string | PrivateKey;
	user: CreatedUser;
	project?: string;
}

export function createAccessToken({
	user,
	key = defaultKey,
	project = PROJECT_ID,
}: CreateAccessToken) {
	let algorithm = 'RS256' as Algorithm
	let payload = createTokenPayload(user.id, project)

	return jwt.sign(
		JSON.stringify(payload),
		key,
		{
			algorithm,
			header: {
				typ: "JWT",
				alg: algorithm,
			}
		}
	)
}