let fs = require('fs')
let path = require('path')

let keyPath = path.resolve(process.cwd(), 'keys')

let admin = {
	id: 'f4db2736-ce01-40d7-9a3b-94e5d2a648c8',
	is_admin: true,
	flags: ['auth::signin','method::email_password']
}

let adminSettings = {
	name: 'Admin',
	domain: 'http://localhost:9000',
	project_id: admin.id,
}

let adminKeys = {
	public_key: fs.readFileSync(`${keyPath}/admin.pub`, { encoding: 'utf8' }),
	private_key: fs.readFileSync(`${keyPath}/admin`, { encoding: 'utf8' }),
	is_active: true,
	project_id: admin.id,
}

let project = {
	id: 'ae16cc4a-33be-4b4e-a408-e67018fe453b',
	is_admin: false,
	flags: []
}

let projectSettings = {
	name: 'Development',
	domain: 'http://localhost:3000',
	project_id: project.id,
}

let projectKeys = {
	public_key: fs.readFileSync(`${keyPath}/project.pub`, { encoding: 'utf8' }),
	private_key: fs.readFileSync(`${keyPath}/project`, { encoding: 'utf8' }),
	is_active: true,
	project_id: project.id
}

module.exports = {
	adminKeys,
	admin,
	adminSettings,

	projectKeys,
	project,
	projectSettings,
}