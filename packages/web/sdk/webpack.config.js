let createConfig = require('../../../webpack.config')

module.exports = function ({ browser }, argv) {
	let config = createConfig(argv.mode || 'production')

	config.entry = {
		main: './src/main.ts',
		interceptor: './src/interceptor.ts',
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