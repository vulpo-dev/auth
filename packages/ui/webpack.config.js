let createConfig = require('../../webpack.config')

module.exports = function (_, argv) {
	console.log('mode: ', argv.mode)
	let config = createConfig(argv.mode || 'production')
    return config
}