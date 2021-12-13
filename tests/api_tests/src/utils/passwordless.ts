import Db from '../utils/db'
import { CreatedUser } from './user'
import { generateKeyPair } from './crypto'

import { v4 as uuid } from 'uuid'
import * as bcrypt from 'bcryptjs'

const SALT = bcrypt.genSaltSync(10);

export function makeCreateToken(
	userId: string,
	email: string,
	hashedToken: string,
	projectId: string,
	sessionId: string,
) {
	return async function(): Promise<string> {
		let { rows } = await Db.query(`
			insert into passwordless
				( user_id
				, email
				, token
				, project_id
				, session_id
				, is_valid
				)
			values ($1, $2, $3, $4, $5, True)
			returning id
		`, [userId, email, hashedToken, projectId, sessionId])

		return rows[0].id
	} 
}

type CreateToken = {
	user: CreatedUser;
	session: CreatedSession;
	token?: string;
	id?: string;
}

export async function createToken({
	user,
	session,
	token = uuid(),
	id = uuid(),
}: CreateToken) {
	let hashedToken = bcrypt.hashSync(token, SALT)

	await Db.query(`
		insert into passwordless
			( id
			, user_id
			, email
			, token
			, project_id
			, session_id
			, is_valid
			)
		values ($1, $2, $3, $4, $5, $6, True)
		returning id
	`, [id, user.id, user.email, hashedToken, user.project, session.id])

	return { hashedToken, id, value: token }
}

export function makeResetPasswordless(
	userId: string,
	sessionId: string,
	createSession: () => Promise<any>
) {
	return async function() {
		await Db.query(`
			delete from passwordless
			 where user_id = $1
		`, [userId])

		await Db.query(`
			delete from sessions
			 where id = $1 
		`, [sessionId])

		await createSession()
	}
}

export function makeCreateSession(
	sessionId: string,
	projectId: string,
	userId: string,
	publicKey: string,
) {
	return function() {
		return Db.query(`
			insert into sessions
				( id
				, project_id
				, user_id
				, public_key
				)
			values($1, $2, $3, $4)
			on conflict do nothing
		`, [sessionId, projectId, userId, publicKey])
	}
}

type CreateSession = {
	user: CreatedUser;
	id?: string;
	keys?: {
		publicKey: string;
		privateKey: string;
	};
}

export type CreatedSession = {
	id: string;
	keys: {
		publicKey: string;
		privateKey: string;
	}
}

export async function createSession({
	user,
	id = uuid(),
	keys = generateKeyPair()
}: CreateSession): Promise<CreatedSession> {
	await Db.query(`
		insert into sessions
			( id
			, project_id
			, user_id
			, public_key
			)
		values($1, $2, $3, $4)
		on conflict do nothing
	`, [id, user.project, user.id, keys.publicKey])

	return { id, keys }
}

export function makeCleanUp(userId: string) {
	return function() {
		return Db.query(`
			delete from users
			 where id = $1 
		`, [userId])
	}
}

export function makeCreateUser(
	userId: string,
	email: string,
	projectId: string,
	traits: Array<string> = []
) {
	return function() {
		return Db.query(`
			insert into users(id, email, project_id, provider_id, traits)
			values($1, $2, $3, 'link', $4)
			on conflict (id)
			   do nothing
		`, [userId, email, projectId, traits])
	}
}
