import { test, expect } from '@playwright/test';
import auth from './utils/auth'

test.beforeEach(auth)

test('can sign in', async ({ page }) => { 
	const title = page.locator('main > section > h3');
	await expect(title).toHaveText('Users');
});

test('can navigate projects', async ({ page }) => { 
	await page.click('a:has-text("Development")');
});
