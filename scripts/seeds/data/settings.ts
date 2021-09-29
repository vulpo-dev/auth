
import { project } from './projects'

let { env } = process

export let email = {
	project_id: project.id,
	from_name: env.MAIL_NAME ?? 'DEV Localhost',
	from_email: env.MAIL_EMAIL ?? 'dev@riezler.dev',
	password: env.MAIL_PASSWORD ?? '',
	username: env.MAIL_USERNAME ?? 'michael@riezler.dev',
	port: env.MAIL_PORT ? parseInt(env.MAIL_PORT, 10) : 1025,
	host: env.MAIL_HOST ?? 'localhost',
}