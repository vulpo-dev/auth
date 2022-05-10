import { expect, test } from '@playwright/test'
import { createProject, Flag } from './utils/project'
import { pathname } from './utils'

test('overview with all methods', async ({ page }) => {
	let project = await createProject()
	await page.goto(`/auth?project=${project}`)
	await page.waitForSelector('.vulpo-auth-overview')

	await expect(page.locator(".vulpo-auth-link-button")).toHaveCount(1)
	await expect(page.locator(".vulpo-auth-password-button")).toHaveCount(1)
	await expect(page.locator(".vulpo-auth-oauth-google")).toHaveCount(1)
})

test('only google', async ({ page }) => {
	let project = await createProject([
		Flag.SignIn,
		Flag.SignUp,
		Flag.OAuthGoogle
	])
	await page.goto(`/auth?project=${project}`)
	await page.waitForSelector('.vulpo-auth-overview')

	await expect(page.locator(".vulpo-auth-link-button")).toHaveCount(0)
	await expect(page.locator(".vulpo-auth-password-button")).toHaveCount(0)
	await expect(page.locator(".vulpo-auth-oauth-google")).toHaveCount(1)
})

test('only email and password: signin + signup', async ({ page }) => {
	let project = await createProject([
		Flag.SignIn,
		Flag.SignUp,
		Flag.EmailAndPassword
	])

	await page.goto(`/auth?project=${project}`)
	await page.waitForSelector('.vulpo-auth-password')
	expect(pathname(page)).toBe('/auth/signin/email')

	await expect(page.locator('//a[text()="Create Account"]')).toHaveCount(1)
	await expect(page.locator('.vulpo-auth-password-forgot-password')).toHaveCount(0)
	await expect(page.locator('#back')).toHaveCount(0)
})

test('only email and password: signin', async ({ page }) => {
	let project = await createProject([
		Flag.SignIn,
		Flag.EmailAndPassword
	])

	await page.goto(`/auth?project=${project}`)
	await page.waitForSelector('.vulpo-auth-password')
	expect(pathname(page)).toBe('/auth/signin/email')

	await expect(page.locator('//a[text()="Create Account"]')).toHaveCount(0)
	await expect(page.locator('.vulpo-auth-password-forgot-password')).toHaveCount(0)
})

test('only email and password: signin + password-reset', async ({ page }) => {
	let project = await createProject([
		Flag.SignIn,
		Flag.PasswordReset,
		Flag.EmailAndPassword
	])

	await page.goto(`/auth?project=${project}`)
	await page.waitForSelector('.vulpo-auth-password')
	expect(pathname(page)).toBe('/auth/signin/email')

	await expect(page.locator('//a[text()="Create Account"]')).toHaveCount(0)
	await expect(page.locator('.vulpo-auth-password-forgot-password')).toHaveCount(1)
})

test('only email and password: signup', async ({ page }): Promise<void> => {
	let project = await createProject([
		Flag.SignUp,
		Flag.EmailAndPassword
	])

	await page.goto(`/auth?project=${project}`)
	await page.waitForSelector('.vulpo-auth-password')
	expect(pathname(page)).toBe('/auth/signup/email')

	await expect(page.locator('//a[text()="Sign In"]')).toHaveCount(0)
})

test('only email and password: signup + signin', async ({ page }): Promise<void> => {
	let project = await createProject([
		Flag.SignUp,
		Flag.SignIn,
		Flag.EmailAndPassword
	])

	await page.goto(`/auth/signup/email?project=${project}`)
	await page.waitForSelector('.vulpo-auth-password')
	expect(pathname(page)).toBe('/auth/signup/email')

	await expect(page.locator('//a[text()="Sign In"]')).toHaveCount(1)
})

test('only link', async ({ page }): Promise<void> => {
	let project = await createProject([
		Flag.SignUp,
		Flag.SignIn,
		Flag.AuthenticationLink
	])

	await page.goto(`/auth?project=${project}`)
	await page.waitForSelector('.vulpo-auth-passwordless')
	expect(pathname(page)).toBe('/auth/signin/link')

	await expect(page.locator('#back')).toHaveCount(0)
})