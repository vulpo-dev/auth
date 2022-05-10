import { test, expect } from '@playwright/test'
import { getValidationMessage } from './utils'
import { v4 as uuid } from 'uuid'

let email = () => `ui.e2e+passwordless-${uuid()}@vulpo.dev`
let PATH = '/auth/signin/link'
let BTN = 'Send Authentication Link'

test.beforeEach(async ({ page }) => {
	await page.goto(PATH)
})

test('can sign in', async ({ page, browser }) => {
	let EMAIL = email()

	await page.fill('input[name="email"]', EMAIL)
	await page.click(`button:has-text("${BTN}")`)
	await page.waitForSelector('.test-check-email')

	let ctx = await browser.newContext()
	let mail = await ctx.newPage()
	await mail.goto('http://localhost:8025')
	await mail.click(`.msglist-message div:has-text("${EMAIL}")`)

	let [,frame] = mail.frames()

	let [confirm] = await Promise.all([
		ctx.waitForEvent('page'),
		frame!.click('.btn-primary a:has-text("Sign In")')
	])

	await confirm.waitForLoadState();
	await confirm.waitForSelector('.test-confirm-signin')

	await page.waitForSelector('.App')
})


test('fails for empty email', async ({ page }) => {
	await page.fill('input[name="email"]', '')
	await page.click(`button:has-text("${BTN}")`)

	let validationMessage = await page.$eval('input[name="email"]', getValidationMessage)
	expect(validationMessage.length).toBeGreaterThan(0)
})