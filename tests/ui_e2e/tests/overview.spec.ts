import { expect, Page, test } from '@playwright/test'
import { pathname } from './utils'

test('can visit overview without trailing /', async ({ page }) => {
	await page.goto('/auth')
	await page.waitForSelector('.vulpo-auth-overview')
})

test('can visit overview with trailing /', async ({ page }) => {
	await page.goto('/auth/')
	await page.waitForSelector('.vulpo-auth-overview')
})

test('can navigate sign in/up', async ({ page }) => {
	await page.goto('/')

	await page.waitForSelector('.vulpo-auth-overview')
	expect(pathname(page)).toBe('/auth/signin')
	await page.waitForSelector('//h3[contains(@class, vulpo-auth-card-title) and text()="Welcome Back."]')

	await page.click('.vulpo-auth-header-link')
	expect(pathname(page)).toBe('/auth/signup')
	await page.waitForSelector('//h3[contains(@class, vulpo-auth-card-title) and text()="Create an account."]')

	await page.click('.vulpo-auth-header-link')
	expect(pathname(page)).toBe('/auth/signin')
})

test('can navigate email/password: signin', emailPasswordNavigation('signin'))
test('can navigate email/password: signup', emailPasswordNavigation('signup'))
function emailPasswordNavigation(type: 'signin' | 'signup') {
	return async function({ page }: { page: Page }) {
		await page.goto(`/auth/${type}`)
		await page.waitForSelector('.vulpo-auth-overview')

		await page.click('.vulpo-auth-password-button')
		await page.waitForSelector('.vulpo-auth-password')
		expect(pathname(page)).toBe(`/auth/${type}/email`)

		await page.click("#back")
		await page.waitForSelector('.vulpo-auth-overview')
		expect(pathname(page)).toBe(`/auth/${type}`)	
	}
}

test('can navigate link: signin', linkNavigation('signin'))
test('can navigate link: signup', linkNavigation('signup'))
function linkNavigation(type: 'signin' | 'signup') {
	return async function({ page }: { page: Page }) {
		await page.goto(`/auth/${type}`)
		await page.waitForSelector('.vulpo-auth-overview')

		await page.click('.vulpo-auth-link-button')
		await page.waitForSelector('.vulpo-auth-passwordless')
		expect(pathname(page)).toBe(`/auth/${type}/link`)

		await page.click("#back")
		await page.waitForSelector('.vulpo-auth-overview')
		expect(pathname(page)).toBe(`/auth/${type}`)	
	}
}
