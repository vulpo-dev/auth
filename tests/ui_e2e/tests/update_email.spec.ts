import { test, Page, Browser } from '@playwright/test'
import { signUp, getEmail } from './utils'
import { signIn } from './utils/signin'


test('can update email', async ({ page, browser }) => {
	await page.goto('/auth/signup/email')

	let email = await signUp(page)
	let newEmail = getEmail()
	await page.fill('input[name="new_email"]', newEmail)
	await page.click('button:has-text("Update Email")')
	await page.waitForSelector('.update-email--submitted')

	let confirm = await followEmail(browser, newEmail, 'Confirm Email Change')
	await confirmUpdate(confirm)

	await signOut(page)
	await page.goto('/auth/signin/email')
	await signIn(page, newEmail, 'password')
})

test('can reject email', async ({ page, browser }) => {
	await page.goto('/auth/signup/email')

	let email = await signUp(page)
	let newEmail = getEmail()
	await page.fill('input[name="new_email"]', newEmail)
	await page.click('button:has-text("Update Email")')
	await page.waitForSelector('.update-email--submitted')

	let confirm = await followEmail(browser, email, 'Reset Email')
	await rejectUpdate(confirm)

	await signOut(page)
	await page.goto('/auth/signin/email')
	await signIn(page, email, 'password')
})

test('can reset email', async ({ page, browser }) => {
	await page.goto('/auth/signup/email')

	let email = await signUp(page)
	let newEmail = getEmail()
	await page.fill('input[name="new_email"]', newEmail)
	await page.click('button:has-text("Update Email")')
	await page.waitForSelector('.update-email--submitted')

	let confirm = await followEmail(browser, newEmail, 'Confirm Email Change')
	await confirmUpdate(confirm)

	let reject = await followEmail(browser, email, 'Reset Email')
	await rejectUpdate(reject)

	await signOut(page)
	await page.goto('/auth/signin/email')
	await signIn(page, email, 'password')
})

test('fails to update email when email has been reseted', async ({ page, browser }) => {
	await page.goto('/auth/signup/email')

	let email = await signUp(page)
	let newEmail = getEmail()
	await page.fill('input[name="new_email"]', newEmail)
	await page.click('button:has-text("Update Email")')
	await page.waitForSelector('.update-email--submitted')

	let reject = await followEmail(browser, email, 'Reset Email')
	await rejectUpdate(reject)

	let confirm = await followEmail(browser, newEmail, 'Confirm Email Change')
	await confirm.click('button:has-text("Change Email")')
	await confirm.waitForSelector('p:has-text("Not Allowed")')
})


async function followEmail(browser: Browser, email: string, label: string) {
	let ctx = await browser.newContext()
	let mail = await ctx.newPage()
	await mail.goto('http://localhost:8025')
	await mail.click(`.msglist-message div:has-text("${email}")`)

	let [,frame] = mail.frames()

	let [confirm] = await Promise.all([
		ctx.waitForEvent('page'),
		frame!.click(`.btn-primary a:has-text("${label}")`)
	])

	await confirm.waitForLoadState();

	return confirm
}

async function confirmUpdate(page: Page) {
	await page.click('button:has-text("Change Email")')
	await page.waitForSelector('p:has-text("Your email has been changed.")')
}

async function rejectUpdate(page: Page) {
	await page.click('button:has-text("Reset Email")')
	await page.waitForSelector('p:has-text("Your email has been reset.")')
}

async function signOut(page: Page) {
	await page.click('button:has-text("Sign Out")')
}