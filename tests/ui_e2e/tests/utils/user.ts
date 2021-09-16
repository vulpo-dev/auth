import Db from './db'
import * as bcrypt from 'bcryptjs'

let SALT = bcrypt.genSaltSync(10);

export function removeByEmail(email: string) {
	return Db.query(`
		delete from users
		 where email = $1
	`, [email])
}

export function removeByEmailType(email: string) {
	return Db.query(`
		delete from users
		 where email like $1
	`, [email])
}

export function createUserWithEmailPassword(email: string, password: string) {
	return Db.query(`
		insert into users(email, password, project_id, provider_id)
		values($1, $2, $3, 'email')
		on conflict (email, project_id)
		   do update set password = excluded.password
	`, [email, bcrypt.hashSync(password, SALT), 'ae16cc4a-33be-4b4e-a408-e67018fe453b'])
}