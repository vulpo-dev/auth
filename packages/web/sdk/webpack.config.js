let createConfig = require('../../../webpack.config')

module.exports = function ({ browser }, argv) {
	let config = createConfig(argv.mode || 'production')

	if (browser) {
		config.output = {
			library: 'BentoAuth',
			libraryExport: 'Auth',
	    	globalObject: 'this',
	     	filename: '[name].js',
	     	path: process.cwd() + '/browser',
	     	libraryTarget: 'umd'
	    }
	}

    return config
}