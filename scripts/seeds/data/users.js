let { admin, project } = require('./projects')
let bcrypt = require('bcryptjs')
let faker = require('faker')

let salt = bcrypt.genSaltSync(10);


let adminUser = {
	email: 'michael@riezler.co',
	password: hash("password"),
	project_id: admin.id,
	traits: ['Admin'],
	data: {},
	provider_id: 'email'
}


function getUsers(total) {

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


module.exports =  {
	getUsers,
	adminUser
}


function hash(password) {
	return bcrypt.hashSync(password, salt)
}