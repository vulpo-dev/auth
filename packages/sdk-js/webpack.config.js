let createConfig = require('../../webpack.config')

module.exports = function (_, argv) {
	console.log('mode: ', argv.mode)

	let config = createConfig(argv.mode || 'production')
	
	config.entry = {
		client: ['@babel/polyfill', process.cwd() + '/src/client']
	}

	config.output = {
		library: 'BentoAuth',
		libraryExport: 'Auth',
    	globalObject: 'this',
     	filename: '[name].js',
     	path: process.cwd(),
     	libraryTarget: 'umd'
    }

    return config
}