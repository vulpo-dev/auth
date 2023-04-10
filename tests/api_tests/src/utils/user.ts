import { projectKeys } from '@vulpo-dev/auth-seeds/data/projects'
import * as jwt from 'jsonwebtoken'
import { Algorithm } from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import * as argon2 from 'argon2'
import { UserState } from '@vulpo-dev/auth-sdk'

import Db from './db'
import { PROJECT_ID } from '../utils/env'


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
		algorithm = 'ES384',
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
		algorithm = 'ES384',
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

export type CreatedUser = {
	project: string;
	traits: Array<string>;
	password: string;
	id: string;
	email: string;
	state: UserState;
}

type CreateUser = Partial<CreatedUser>


export async function createUser({
	id = uuid(),
	email = getEmail(),
	project = PROJECT_ID,
	traits = [],
	state = UserState.Active,
	password
}: CreateUser = {}): Promise<CreatedUser> {
	let authType = password ? 'email' : 'link'

	await Db.query(`
		insert into users(id, email, project_id, provider_id, traits, state)
		values($1, $2, $3, $4, $5, $6)
	`, [id, email, project, authType, traits, state])

	if (password) {
		let hash = await argon2.hash(password, { type: argon2.argon2id })

		await Db.query(`
			insert into passwords(user_id, alg, hash, project_id)
			values($1, 'argon2id', $2, $3)
			on conflict do nothing
		`, [id, hash, project])
	}

	return { id, email, project, traits, password: password ?? '', state }
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
	let algorithm = 'ES384' as Algorithm
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