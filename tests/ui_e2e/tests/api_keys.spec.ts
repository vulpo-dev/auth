import { expect, test } from '@playwright/test'
import { signUp } from './utils'

test.beforeEach(async ({ page }) => {
	await page.goto('/auth/signup/email')
})

test("can generate API key", async ({ page }) => {
	await signUp(page)
	await page.click('button:has-text("Generate API Key")')
	let elm = await page.waitForSelector('#generated-api-key')
	let id = await elm.innerText()
	let selector = `#api-key_${id}`
	await page.waitForSelector(selector)

	await page.click('button:has-text("Delete Generated Key")')
	await page.waitForLoadState('networkidle')

	let row = await page.$(selector)
	expect(row).toBeNull()
})
