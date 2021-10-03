import { test, expect, Page } from '@playwright/test'


test('can sign in', async ({ page }) => { 
	await auth(page)
	
	let title = page.locator('main > section > h3')
	await expect(title).toHaveText('Users')
})

test('can navigate projects', async ({ page }) => {
	await auth(page)
	await page.click('a:has-text("Development")')
})


async function auth(page: Page) {
	await page.goto('http://localhost:9000/')
	await page.fill('input[name="email"]', 'michael@riezler.co')
	await page.fill('input[name="password"]', 'password')
	await page.click('button:has-text("Sign In")')
}