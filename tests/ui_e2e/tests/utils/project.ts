import Db from './db'
import { v4 as uuid } from 'uuid'

export enum Flag {
	SignIn = 'auth::signin',
	SignUp = 'auth::signup',
	PasswordReset = 'action::password_reset',
	VerifyEmail = 'action::verify_email',
	EmailAndPassword = 'method::email_password',
	AuthenticationLink = 'method::authentication_link',

	OAuthGoogle = 'oauth::google',
}


let allFlags = Object.values(Flag)

export async function createProject(flags: Array<Flag> = allFlags) {
	let id = uuid()

	await Db.query(`
		insert into projects(id, flags)
		values($1, $2)
	`, [id, flags])

	await Db.query(`
		insert into project_settings(project_id, name, domain)
		values($1, $2, 'http://localhost:5000')
	`, [id, `test-${id}`])

	return id
}


export async function deleteProjects() {
	await Db.query(`
		delete from projects
		where id in (
			select project_id
			  from project_settings
			where name like 'test-%'
		)
	`)
}