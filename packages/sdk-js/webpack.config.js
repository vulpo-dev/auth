let createConfig = require('../../webpack.config')

module.exports = function (_, argv) {
	console.log('mode: ', argv.mode)

	let config = createConfig(argv.mode || 'production')
	

	let entry = argv.mode === 'development'
		? ['@babel/polyfill', process.cwd() + '/src/client']
		: [process.cwd() + '/src/main']

	config.entry = {
		main: entry
	}

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