import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
	use: {
		baseURL: 'http://localhost:4200'
	},
	globalTeardown: './scripts/global_teardown'
}

export default config