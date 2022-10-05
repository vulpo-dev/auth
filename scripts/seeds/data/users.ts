import { admin, project } from './projects'
import * as faker from 'faker'
import { v4 as uuid } from 'uuid'
import * as argon2 from 'argon2'

export let adminUser = {
	id: uuid(),
	email: 'michael@riezler.co',
	project_id: admin.id,
	traits: ['Admin'],
	data: {},
	provider_id: 'email'
}


export function getUsers(total: number) {

	let emails = new Set()

	while(emails.size < total) {
		emails.add(faker.internet.email().toLowerCase())
	}

	return Array.from(emails.values()).map(email => {
		return {
			id: uuid(),
			email,
			project_id: project.id,
			traits: [],
			data: {},
			provider_id: 'email',
			created_at: faker.date.past(),
		}
	})
}

export function hash(password: string) {
	return argon2.hash(password)
}