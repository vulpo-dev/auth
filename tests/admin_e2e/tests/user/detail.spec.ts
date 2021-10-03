import { test, expect } from '@playwright/test'
import { addSessions } from '@vulpo/test-helper'

test.beforeEach(async ({ page }) => {
	await page.goto('http://localhost:9000/')
	await addSessions(page, 'sessions.json')
})

test('shows user emails', async ({ page }) => {
	await page.goto('http://localhost:9000/dashboard')

	let item = page.locator('.user-table--user-email >> nth=0')
	await item.dblclick()

	let sidebarTitle = page.locator('.user-detail--title')
	let title = await sidebarTitle.innerText()
	let email = await item.innerText()
	expect(title).toContain(email)
})