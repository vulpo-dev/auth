let createConfig = require('../../../webpack.config')

module.exports = function ({ browser }, argv) {
	let config = createConfig(argv.mode || 'production')

	config.entry = {
		main: './src/main.ts',
	}

	if (!browser) {
		config.entry = {
			...config.entry,
			interceptor: './src/interceptor.ts',
			mock_client: './src/mock_client.ts',
		}
	}

	if (browser) {
		config.output = {
			library: 'VulpoAuth',
			libraryExport: 'Auth',
	    	globalObject: 'this',
	     	filename: '[name].js',
	     	path: process.cwd() + '/browser',
	     	libraryTarget: 'umd'
	    }
	}

    return config
}