import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
	globalSetup: './scripts/setup.mjs'
}

export default config