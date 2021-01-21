let createConfig = require('../../webpack.config')

module.exports = function (_, argv) {
	let config = createConfig(argv.mode || 'production')

	if (argv.mode === 'browser') {
		config.output = {
			library: 'BentoAuth',
			libraryExport: 'Auth',
	    	globalObject: 'this',
	     	filename: '[name].js',
	     	path: process.cwd() + '/lib',
	     	libraryTarget: 'umd'
	    }
	}

    return config
}