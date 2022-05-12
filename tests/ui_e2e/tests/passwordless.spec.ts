import { test, expect } from '@playwright/test'
import { getValidationMessage } from './utils'
import { v4 as uuid } from 'uuid'
import { passwordless } from './utils/signin'

let email = () => `ui.e2e+passwordless-${uuid()}@vulpo.dev`
let PATH = '/auth/signin/link'
let BTN = 'Send Authentication Link'

test.beforeEach(async ({ page }) => {
	await page.goto(PATH)
})

test('can sign in', async ({ page, browser }) => {
	let EMAIL = email()
	await passwordless(page, browser, EMAIL)
	await page.waitForSelector('.App')
})


test('fails for empty email', async ({ page }) => {
	await page.fill('input[name="email"]', '')
	await page.click(`button:has-text("${BTN}")`)

	let validationMessage = await page.$eval('input[name="email"]', getValidationMessage)
	expect(validationMessage.length).toBeGreaterThan(0)
})