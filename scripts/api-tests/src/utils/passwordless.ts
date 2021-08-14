import Db from '../utils/db'

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
		`, [sessionId, projectId, userId, publicKey])
	}
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
) {
	return function() {
		return Db.query(`
			insert into users(id, email, project_id, provider_id)
			values($1, $2, $3, 'link')
			on conflict (id)
			   do nothing
		`, [userId, email, projectId])
	}
}
