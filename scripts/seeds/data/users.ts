import { admin, project } from './projects'
import * as bcrypt from 'bcryptjs'
import * as faker from 'faker'

let salt = bcrypt.genSaltSync(10);

export let adminUser = {
	email: 'michael@riezler.co',
	password: hash("password"),
	project_id: admin.id,
	traits: ['Admin'],
	data: {},
	provider_id: 'email'
}


export function getUsers(total: number) {

	let password = hash("password")
	let emails = new Set()

	while(emails.size < total) {
		emails.add(faker.internet.email().toLowerCase())
	}

	return Array.from(emails.values()).map(email => {
		return {
			email,
			password,
			project_id: project.id,
			traits: [],
			data: {},
			provider_id: 'email'
		}
	})
}

function hash(password: string) {
	return bcrypt.hashSync(password, salt)
}