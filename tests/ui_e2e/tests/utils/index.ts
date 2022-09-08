import { URL } from 'url'
import { Browser, Page } from "@playwright/test"
import { v4 as uuid } from 'uuid'

export function getValidationMessage(input: HTMLInputElement): string {
	return input.validationMessage
}

export function pathname(page: Page): string {
	let u = new URL(page.url())
	return u.pathname
}

export async function followEmail(browser: Browser, email: string, label: string) {
	let ctx = await browser.newContext()
	let mail = await ctx.newPage()
	await mail.goto('http://localhost:8025')
	await mail.click(`.msglist-message div:has-text("${email}")`)

	let [,frame] = mail.frames()

	let [page] = await Promise.all([
		ctx.waitForEvent('page'),
		frame!.click(`.btn-primary a:has-text("${label}")`)
	])

	await page.waitForLoadState();

	return page
}

export let getEmail = () => `ui.e2e+${uuid()}@vulpo.dev`

export async function signUp(page: Page,  password: string = 'password') {
	let email = getEmail()
	await page.fill('input[name="email"]', email)
	await page.fill('input[name="password"]', password)
	await page.click('button:has-text("Sign Up")')

	await page.waitForSelector('.App')
	
	return email
}
