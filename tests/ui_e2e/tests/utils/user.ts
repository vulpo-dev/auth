import Db from './db'
import * as bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'

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

export async function createUserWithEmailPassword(email: string, password: string) {
	let id = uuid()

	await Db.query(`
		delete from users
		 where email = $1
		   and project_id = $2 
	`, [email, 'ae16cc4a-33be-4b4e-a408-e67018fe453b'])

	await Db.query(`
		insert into users(id, email, project_id, provider_id)
		values($1, $2, $3, 'email')
	`, [id, email, 'ae16cc4a-33be-4b4e-a408-e67018fe453b'])

	let hash = bcrypt.hashSync(password, SALT)

	await Db.query(`
		insert into passwords(user_id, hash, alg, project_id)
		values($1, $2, 'bcrypt', $3)
	`, [id, hash, 'ae16cc4a-33be-4b4e-a408-e67018fe453b'])
}

export async function setState(email: string, state: 'active' | 'disabled' | 'set_password') {
	await Db.query(`
		update users
		   set state = $2
		 where email = $1
		   and project_id = 'ae16cc4a-33be-4b4e-a408-e67018fe453b'
	`, [email, state])
}