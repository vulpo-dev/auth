import { Browser, Page } from "@playwright/test"

export async function signIn(page: Page, email: string, password: string, btn: string = 'Sign In') {
	await page.fill('input[name="email"]', email)
	await page.fill('input[name="password"]', password)

	await page.click(`button:has-text("${btn}")`)
	await page.waitForSelector('.App')
}

export async function signInNoWait(page: Page, email: string, password: string, btn: string = 'Sign In') {
	await page.fill('input[name="email"]', email)
	await page.fill('input[name="password"]', password)

	await page.click(`button:has-text("${btn}")`)
}

export async function passwordless(page: Page, browser: Browser, email: string, btn: string = 'Send Authentication Link') {

	await page.fill('input[name="email"]', email)
	await page.click(`button:has-text("${btn}")`)
	await page.waitForSelector('.test-check-email')

	let ctx = await browser.newContext()
	let mail = await ctx.newPage()
	await mail.goto('http://localhost:8025')
	await mail.click(`.msglist-message div:has-text("${email}")`)

	let [,frame] = mail.frames()

	let [confirm] = await Promise.all([
		ctx.waitForEvent('page'),
		frame!.click('.btn-primary a:has-text("Sign In")')
	])

	await confirm.waitForLoadState();
	await confirm.waitForSelector('.test-confirm-signin')
}