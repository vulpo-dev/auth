
let { project } = require('./projects')

exports.email = {
	project_id: project.id,
	from_name: 'DEV Localhost',
	from_email: 'dev@riezler.dev',
	password: 'password',
	username: 'michael@riezler.co',
	port: 2500,
	host: 'http://localhost',
}