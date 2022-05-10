import { expect, test } from '@playwright/test'
import { v4 as uuid } from 'uuid'

import { pathname } from '../utils'
import { createUserWithEmailPassword } from '../utils/user'
import { signIn } from '../utils/signin'

let email = () => `ui.e2e+reset-${uuid()}@vulpo.dev`
let PASSWORD = 'password'
let NEW_PASSWORD = 'new-password'

test.beforeEach(async ({ page }) => {
	await page.goto('/auth/signin')
})

test('can reset password', async ({ page, browser }) => {
	let EMAIL = email()
	await createUserWithEmailPassword(EMAIL, PASSWORD)

	await page.click('.vulpo-auth-password-button')
	await page.waitForSelector('.vulpo-auth-password')

	await page.click('.vulpo-auth-password-forgot-password')
	await page.waitForSelector('.vulpo-auth-password-reset')
	await page.fill('input[name="email"]', EMAIL)
	await page.click(`button:has-text("Send Reset Password Link")`)

	await page.waitForSelector('.vulpo-auth-password-reset-check')
	await page.waitForSelector(`//strong[@id="email" and text()="${EMAIL}"]`)

	let ctx = await browser.newContext()
	let mail = await ctx.newPage()
	await mail.goto('http://localhost:8025')
	await mail.click(`.msglist-message div:has-text("${EMAIL}")`)

	let [,frame] = mail.frames()
	let [setPasswordPage] = await Promise.all([
		ctx.waitForEvent('page'),
		frame!.click('.btn-primary a:has-text("Reset Password")')
	])

	await setPasswordPage.waitForLoadState();
	await setPasswordPage.waitForSelector('#set-password')

	await setPasswordPage.fill('input[name="password1"]', NEW_PASSWORD)
	await setPasswordPage.fill('input[name="password2"]', NEW_PASSWORD)
	await setPasswordPage.click(`button:has-text("Set Password")`)


	await setPasswordPage.waitForSelector('.vulpo-auth-password')
	expect(pathname(setPasswordPage)).toBe(`/auth/signin/email`)

	await signIn(setPasswordPage, EMAIL, NEW_PASSWORD)

	await page.goto('/auth/signin/email')
	await signIn(page, EMAIL, NEW_PASSWORD)
})