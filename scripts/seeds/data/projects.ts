let fs = require('fs')
let path = require('path')

let keyPath = path.resolve(__dirname, '..', 'keys')

export let admin = {
	id: 'f4db2736-ce01-40d7-9a3b-94e5d2a648c8',
	is_admin: true,
	flags: ['auth::signin','method::email_password']
}

export let adminSettings = {
	name: 'Admin',
	domain: 'http://localhost:9000',
	project_id: admin.id,
}

export let adminKeys = {
	public_key: fs.readFileSync(`${keyPath}/admin.public`),
	private_key: fs.readFileSync(`${keyPath}/admin.private`),
	encrypted_private_key: fs.readFileSync(`${keyPath}/admin.encrypted`),
	is_active: true,
	project_id: admin.id,
}

export let project = {
	id: 'ae16cc4a-33be-4b4e-a408-e67018fe453b',
	is_admin: false,
	flags: [
		'auth::signin',
		'auth::signup',
		'action::password_reset',
		'action::verify_email',
		'method::email_password',
		'method::authentication_link',
		'oauth::google',
	]
}

export let projectSettings = {
	name: 'Development',
	domain: 'http://localhost:5000',
	project_id: project.id,
}

export let projectKeys = {
	public_key: fs.readFileSync(`${keyPath}/project.public`),
	private_key: fs.readFileSync(`${keyPath}/project.private`),
	encrypted_private_key: fs.readFileSync(`${keyPath}/project.encrypted`),
	is_active: true,
	project_id: project.id
}

export let googleCredentials = {
	client_id: process.env.GOOGLE_CLIENT_ID,
	client_secret: process.env.GOOGLE_CLIENT_SECRET,
	redirect_uri: 'http://localhost:5000/auth/oauth/confirm',
}