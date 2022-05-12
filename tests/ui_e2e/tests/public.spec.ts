import { test } from '@playwright/test'
import { createUserWithEmailPassword } from './utils/user'
import { v4 as uuid } from 'uuid'
import { signInNoWait, passwordless } from './utils/signin'

let email = () => `ui.e2e+signin-${uuid()}@vulpo.dev`
let PASSWORD = 'password'

test("can visit public route", async ({ page }) => {
	await page.goto('/public')
	await page.waitForSelector('.test-public-page')
})

test("auth redirect public -> private", async ({ page }) => {
	await page.goto('/public')
	await page.waitForSelector('.test-public-page')

	await page.click('.test-goto-private')
	await page.waitForSelector('.vulpo-auth-overview')
})

test("auth redirect for private route", async ({ page }) => {
	await page.goto('/page')
	await page.waitForSelector('.vulpo-auth-overview')
})

test("private route redirect: signin password", async ({ page }) => {
	let EMAIL = email()
	await createUserWithEmailPassword(EMAIL, PASSWORD)

	await page.goto('/page')
	await page.waitForSelector('.vulpo-auth-overview')
	
	await page.click('.vulpo-auth-password-button')
	await page.waitForSelector('.vulpo-auth-password')
	await signInNoWait(page, EMAIL, PASSWORD)

	await page.waitForSelector('.test-private-page')
})

test("private route redirect: passwordless", async ({ page, browser }) => {
	let EMAIL = email()

	await page.goto('/page')
	await page.waitForSelector('.vulpo-auth-overview')
	
	await page.click('.vulpo-auth-link-button')
	await page.waitForSelector('.vulpo-auth-passwordless')

	await passwordless(page, browser, EMAIL)

	await page.waitForSelector('.test-private-page')
})
