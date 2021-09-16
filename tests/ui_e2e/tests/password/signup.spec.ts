import { test, expect } from '@playwright/test'
import Db from '../utils/db'
import { getValidationMessage } from '../utils'
import { v4 as uuid } from 'uuid'

let email = () => `ui.e2e+signup-${uuid()}@vulpo.dev`
let PATH = '/auth#/signup/email'

test.beforeEach(async ({ page }) => {
	await page.goto(PATH)
})

test.afterAll(async () => {
	await Db.end()
})

test('can sign up with email and password', async ({ page }) => {
	let EMAIL = email()
	await page.fill('input[name="email"]', EMAIL)
	await page.fill('input[name="password"]', 'password')

	await page.click('button:has-text("Sign Up")')
	await page.waitForSelector('.App')
})


test('fails when password is too short', async ({ page }) => {
	let EMAIL = email()
	await page.fill('input[name="email"]', EMAIL)
	await page.fill('input[name="password"]', '1234567')
	await page.click('button:has-text("Sign Up")')
	
	let validationMessage = await page.$eval('input[name="password"]', getValidationMessage)

	expect(validationMessage).toMatch('Your password should be at least 8 characters long')
})


test('fails when password is too long', async ({ page }) => {
	let EMAIL = email()
	await page.fill('input[name="email"]', EMAIL)
	await page.fill('input[name="password"]', '_3>pKuBc,FMD;m(WK=+=g<GSda{}$Tk0IL#>8]BWcQy.J3?/hQ{4q(hH_c*iLax^!')
	await page.click('button:has-text("Sign Up")')
	
	let validationMessage = await page.$eval('input[name="password"]', getValidationMessage)
	expect(validationMessage).toMatch('Your password cannot be longer than 64 characters')
})


test('fails when email is empty', async ({ page }) => {
	await page.fill('input[name="email"]', '')
	await page.fill('input[name="password"]', 'password')
	await page.click('button:has-text("Sign Up")')
	
	let validationMessage = await page.$eval('input[name="email"]', getValidationMessage)
	expect(validationMessage.length).toBeGreaterThan(0)
})


test('fails when email is invalid', async ({ page }) => {
	await page.fill('input[name="email"]', 'fuu')
	await page.fill('input[name="password"]', 'password')
	await page.click('button:has-text("Sign Up")')
	
	let validationMessage = await page.$eval('input[name="email"]', getValidationMessage)
	expect(validationMessage.length).toBeGreaterThan(0)
})


test('fails for duplicate user', async ({ page, browser }) => {
	let EMAIL = email()
	await page.fill('input[name="email"]', EMAIL)
	await page.fill('input[name="password"]', 'password')

	await page.click('button:has-text("Sign Up")')
	await page.waitForSelector('.App')

	let ctx = await browser.newContext()
	let newPage = await ctx.newPage()

	await newPage.goto(PATH)
	await newPage.fill('input[name="email"]', EMAIL)
	await newPage.fill('input[name="password"]', 'password')

	await newPage.click('button:has-text("Sign Up")')
	let error = await newPage.waitForSelector('.test-error')
	expect(await error.innerText()).toEqual('Something went wrong')
})