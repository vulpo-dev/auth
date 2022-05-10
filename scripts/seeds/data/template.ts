import { join } from 'path'
import { readFileSync } from 'fs'


let templateRoot = join(__dirname, '../../../server/template')

let template = readFileSync(join(templateRoot, 'view/passwordless.hbs')).toString()
let button = readFileSync(join(templateRoot, 'component/button.hbs')).toString()
let index = readFileSync(join(templateRoot, 'index.hbs')).toString()
let password_changed = readFileSync(join(templateRoot, 'view/password_changed.hbs')).toString()
let confirm_email_change = readFileSync(join(templateRoot, 'view/confirm_email_change.hbs')).toString()


let translations = [
	require(join(templateRoot, '/translation/change_email')),
	require(join(templateRoot, '/translation/confirm_email_change')),
	require(join(templateRoot, '/translation/password_reset')),
	require(join(templateRoot, '/translation/passwordless')),
	require(join(templateRoot, '/translation/verify_email')), 
	require(join(templateRoot, '/translation/password_changed')),
]

let redirects = [
	["/auth/user/change-email/reset", "change_email", translations[0]],
	["/auth/user/change-email/confirm", "confirm_email_change", translations[1]],
	["/auth/forgot-password/set-password", "password_reset", translations[2]],
	["/auth/signin/link/confirm", "passwordless", translations[3]],
	["/auth/verify-email", "verify_email", translations[4]],
	["", "password_changed", translations[5]],
]

export let Templates = redirects.map(([redirect_to, of_type, translation]) => {
	
	let body
		= of_type === 'password_changed'
		? password_changed
		: of_type === 'confirm_email_change'
		? confirm_email_change
		: template

	return {
		from_name: '',
		subject: '{{t.subject}}',
		body,
		redirect_to,
		template_type: 'view',
		of_type,
		translation: translation as any,
	}
}).concat([{
	from_name: ' ',
	subject: ' ',
	body: index,
	redirect_to: '',
	of_type: 'index',
	template_type: 'index',
	translation: {},
}, {
	from_name: ' ',
	subject: ' ',
	body: button,
	redirect_to: ' ',
	of_type: 'button',
	template_type: 'component',
	translation: {},
}])