import { test, expect } from '@playwright/test';
import auth from '../utils/auth'

test.beforeEach(auth)

test('shows user emails', async ({ page }) => {
	let item = page.locator('.user-table--user-email >> nth=0')
	await item.dblclick()

	let sidebarTitle = page.locator('.user-detail--title')
	let title = await sidebarTitle.innerText()
	let email = await item.innerText()
	expect(title).toContain(email)
})