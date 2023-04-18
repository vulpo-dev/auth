import * as path from 'path'
import * as fs from 'fs'


let root = path.parse(require.resolve("@vulpo-dev/auth-email-templates/package.json"));

let templateRoot = path.resolve(root.dir, 'build');

let templates = fs.readdirSync(templateRoot);

let redirects = {
	change_email: "/auth/user/change-email/reset",
	confirm_email_change: "/auth/user/change-email/confirm",
	password_reset: "/auth/forgot-password/set-password",
	passwordless: "/auth/signin/link/confirm",
	verify_email: "/auth/verify-email",
	password_changed: "/auth/forgot-password`",
}

export let Templates = templates.map(template => {
	let root = path.resolve(templateRoot, template);
	let body = fs.readFileSync(path.join(root, "template.hbs"), { encoding: "utf8" });

	let translations = getTranslations(root);
	let data = {
		redirect_to: redirects[template] as string
	}

	return {
		body,
		name: template,
		translations,
		data
	}
})

function getTranslations(base: string): Array<{ language: string, content: string }> {
	let dir = path.join(base, "translations");
	let files = fs.readdirSync(dir).filter(file => file.endsWith(".hbs"));
	return files.map(fileName => {
		let language = fileName.slice(0, 2);
		let content = fs.readFileSync(path.join(dir, fileName), { encoding: "utf8" });
		return { language, content }
	})
}