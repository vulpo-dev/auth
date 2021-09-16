import { Page } from "@playwright/test";

export default async function ({ page }: { page: Page }) {
	await page.goto('http://localhost:9000/');
	await page.fill('input[name="email"]', 'michael@riezler.co');
	await page.fill('input[name="password"]', 'password');
	await page.click('button:has-text("Sign In")');
}

export function session() {
	return async ({ page }: { page: Page }) => {
		
	}
}