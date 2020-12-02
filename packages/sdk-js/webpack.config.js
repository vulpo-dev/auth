let createConfig = require('../../webpack.config')

module.exports = function (env) {

	let config = createConfig(env)
	
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