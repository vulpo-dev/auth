import { test, expect } from '@playwright/test'
import Db from '../utils/db'
import { removeByEmail, createUserWithEmailPassword } from '../utils/user'
import { getValidationMessage } from '../utils'
import { v4 as uuid } from 'uuid'

let email = () => `ui.e2e+signin-${uuid()}@vulpo.dev`

let PASSWORD = 'password'
let PATH = '/auth#/signin/email'
let BTN = 'Sign In'

test.beforeEach(async ({ page }) => {
	await page.goto(PATH)
})
test.afterAll(() => Db.end())

test('can sign in with email and password', async ({ page }) => {
	let EMAIL = email()
	await createUserWithEmailPassword(EMAIL, PASSWORD)

	await page.fill('input[name="email"]', EMAIL)
	await page.fill('input[name="password"]', 'password')

	await page.click(`button:has-text("${BTN}")`)
	await page.waitForSelector('.App')
})


test('fails when password is too short', async ({ page }) => {
	let EMAIL = email()
	await createUserWithEmailPassword(EMAIL, PASSWORD)

	await page.fill('input[name="email"]', EMAIL)
	await page.fill('input[name="password"]', '1234567')
	await page.click(`button:has-text("${BTN}")`)
	
	let validationMessage = await page.$eval('input[name="password"]', getValidationMessage)
	expect(validationMessage).toMatch('Your password should be at least 8 characters long')
})


test('fails when password is too long', async ({ page }) => {
	let EMAIL = email()
	await createUserWithEmailPassword(EMAIL, PASSWORD)

	await page.fill('input[name="email"]', EMAIL)
	await page.fill('input[name="password"]', '_3>pKuBc,FMD;m(WK=+=g<GSda{}$Tk0IL#>8]BWcQy.J3?/hQ{4q(hH_c*iLax^!')
	await page.click(`button:has-text("${BTN}")`)
	
	let validationMessage = await page.$eval('input[name="password"]', getValidationMessage)
	expect(validationMessage).toMatch('Your password cannot be longer than 64 characters')
})


test('fails when email is empty', async ({ page }) => {
	let EMAIL = email()
	await createUserWithEmailPassword(EMAIL, PASSWORD)

	await page.fill('input[name="email"]', '')
	await page.fill('input[name="password"]', 'password')
	await page.click(`button:has-text("${BTN}")`)
	
	let validationMessage = await page.$eval('input[name="email"]', getValidationMessage)
	expect(validationMessage.length).toBeGreaterThan(0)
})


test('fails when email is invalid', async ({ page }) => {
	let EMAIL = email()
	await createUserWithEmailPassword(EMAIL, PASSWORD)

	await page.fill('input[name="email"]', 'fuu')
	await page.fill('input[name="password"]', 'password')
	await page.click(`button:has-text("${BTN}")`)
	
	let validationMessage = await page.$eval('input[name="email"]', getValidationMessage)
	expect(validationMessage.length).toBeGreaterThan(0)
})


test('fails for invalid email', async ({ page, browser }) => {
	let EMAIL = email()
	await createUserWithEmailPassword(EMAIL, PASSWORD)

	await page.fill('input[name="email"]', 'invalid@vulpo.dev')
	await page.fill('input[name="password"]', PASSWORD)

	await page.click(`button:has-text("${BTN}")`)

	let error = await page.waitForSelector('.test-error')
	expect(await error.innerText()).toEqual('Invalid Email or Password')
})


test('fails for invalid password', async ({ page, browser }) => {
	let EMAIL = email()
	await createUserWithEmailPassword(EMAIL, PASSWORD)

	await page.fill('input[name="email"]', EMAIL)
	await page.fill('input[name="password"]', `${PASSWORD}1`)

	await page.click(`button:has-text("${BTN}")`)

	let error = await page.waitForSelector('.test-error')
	expect(await error.innerText()).toEqual('Invalid Email or Password')
})
