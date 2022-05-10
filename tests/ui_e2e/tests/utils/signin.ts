import { Page } from "@playwright/test"

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